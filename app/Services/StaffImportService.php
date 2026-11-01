<?php

namespace App\Services;

use App\Models\{Department, Designation, ImportJob, Staff};
use App\Support\Imports\HeaderAliases;
use App\Support\Imports\NameNormalizer;
use App\Support\Imports\TabularReader;
use App\Support\StoredFile;
use Illuminate\Support\Facades\DB;

class StaffImportService
{
    private const EXPECTED_HEADERS = [
        'emp_id',
        'first_name',
        'last_name',
        'gender',
        'date_of_birth',
        'phone',
        'email',
        'department_name',
        'designation_name',
        'teacher_type',
    ];

    private const ALLOWED_COLUMNS = [
        'emp_id',
        'first_name',
        'last_name',
        'gender',
        'date_of_birth',
        'phone',
        'email',
        'department_name',
        'designation_name',
        'teacher_type',
    ];

    private const VALID_GENDERS = ['male', 'female'];

    private const VALID_TEACHER_TYPES = ['subject_teacher', 'form_master', 'both', 'non_teaching'];

    private int $schoolId;

    public function __construct(int $schoolId)
    {
        $this->schoolId = $schoolId;
    }

    public function parseFile(ImportJob $job): array
    {
        $filePath = StoredFile::localPath($job->file_path, 'private');

        if (!file_exists($filePath)) {
            throw new \RuntimeException("Import file not found: {$job->file_name}");
        }

        $rows = TabularReader::read($filePath, self::EXPECTED_HEADERS, HeaderAliases::forJob($job))['rows'];

        $job->update([
            'total_rows' => count($rows),
        ]);

        return $rows;
    }

    public function validateRows(ImportJob $job): array
    {
        $rows = $this->parseFile($job);
        $valid = [];
        $errors = [];

        $existingEmpIds = Staff::where('school_id', $this->schoolId)
            ->pluck('emp_id')
            ->map(fn($id) => strtolower($id))
            ->toArray();

        $existingDepartments = Department::where('school_id', $this->schoolId)
            ->pluck('name', 'id')
            ->mapWithKeys(fn($name, $id) => [NameNormalizer::normalize($name) => $id])
            ->toArray();
        $availableDepartmentNames = Department::where('school_id', $this->schoolId)
            ->pluck('name')->filter()->values()->all();

        $existingDesignations = Designation::where('school_id', $this->schoolId)
            ->pluck('name', 'id')
            ->mapWithKeys(fn($name, $id) => [NameNormalizer::normalize($name) => $id])
            ->toArray();
        $availableDesignationNames = Designation::where('school_id', $this->schoolId)
            ->pluck('name')->filter()->values()->all();

        $seenEmpIds = [];

        foreach ($rows as $row) {
            $rowNum = $row['__row_number'];
            $rowErrors = [];

            $empId = trim($row['emp_id'] ?? '');
            $firstName = trim($row['first_name'] ?? '');
            $lastName = trim($row['last_name'] ?? '');
            $gender = strtolower(trim($row['gender'] ?? ''));
            $teacherType = strtolower(trim($row['teacher_type'] ?? ''));
            $departmentName = trim($row['department_name'] ?? '');
            $designationName = trim($row['designation_name'] ?? '');
            $email = trim($row['email'] ?? '');

            if ($empId === '') {
                $rowErrors[] = 'emp_id is required.';
            }

            if ($firstName === '') {
                $rowErrors[] = 'first_name is required.';
            }

            if ($lastName === '') {
                $rowErrors[] = 'last_name is required.';
            }

            if ($gender === '' || !in_array($gender, self::VALID_GENDERS, true)) {
                $rowErrors[] = 'gender must be male or female.';
            }

            $departmentKey = NameNormalizer::normalize($departmentName);
            $designationKey = NameNormalizer::normalize($designationName);

            if ($teacherType !== '' && !in_array($teacherType, self::VALID_TEACHER_TYPES, true)) {
                $rowErrors[] = 'teacher_type must be subject_teacher, form_master, both, or non_teaching.';
            }

            if ($empId !== '') {
                if (isset($existingEmpIds[strtolower($empId)])) {
                    $rowErrors[] = "emp_id '{$empId}' already exists in this school.";
                }

                if (in_array(strtolower($empId), $seenEmpIds, true)) {
                    $rowErrors[] = "Duplicate emp_id '{$empId}' found in file. Row skipped.";
                }

                $seenEmpIds[] = strtolower($empId);
            }

            if ($departmentName !== '') {
                if (!isset($existingDepartments[$departmentKey])) {
                    $rowErrors[] = "department_name '{$departmentName}' not found."
                        . ($availableDepartmentNames
                            ? ' Available departments: ' . implode(', ', $availableDepartmentNames) . '.'
                            : ' No departments exist yet — create departments first.');
                }
            }

            if ($designationName !== '') {
                if (!isset($existingDesignations[$designationKey])) {
                    $rowErrors[] = "designation_name '{$designationName}' not found."
                        . ($availableDesignationNames
                            ? ' Available designations: ' . implode(', ', $availableDesignationNames) . '.'
                            : ' No designations exist yet — create designations first.');
                }
            }

            if ($email !== '' && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
                $rowErrors[] = 'email is not a valid email address.';
            }

            if (!empty($rowErrors)) {
                $errors[$rowNum] = $rowErrors;
                continue;
            }

            $valid[] = array_merge(
                collect($row)->only(self::ALLOWED_COLUMNS)->toArray(),
                [
                    '__row_number'       => $rowNum,
                    '__department_id'    => $departmentName !== '' ? ($existingDepartments[$departmentKey] ?? null) : null,
                    '__designation_id'   => $designationName !== '' ? ($existingDesignations[$designationKey] ?? null) : null,
                    '__teacher_type'     => $teacherType ?: 'non_teaching',
                ]
            );
        }

        $job->update([
            'valid_rows'        => count($valid),
            'error_rows'        => count($errors),
            'validation_errors' => $errors,
            'validated_at'      => now(),
            'status'            => 'validated',
        ]);

        return [
            'valid'  => $valid,
            'errors' => $errors,
            'total'  => $job->total_rows,
        ];
    }

    public function previewRows(ImportJob $job): array
    {
        $validation = $this->validateRows($job);

        return [
            'preview'    => array_slice($validation['valid'], 0, 50),
            'total_rows' => $validation['total'],
            'valid_rows' => count($validation['valid']),
            'error_rows' => count($validation['errors']),
            'errors'     => $validation['errors'],
        ];
    }

    public function executeImport(ImportJob $job): array
    {
        $validation = $this->validateRows($job);

        $validRows = $validation['valid'];

        $summary = [
            'staff_created'   => 0,
            'skipped'         => 0,
            'errors'          => [],
        ];

        $job->update(['status' => 'importing']);

        foreach ($validRows as $row) {
            try {
                DB::transaction(function () use ($row, &$summary) {
                    $this->processRow($row, $summary);
                });
            } catch (\Throwable $e) {
                $summary['errors'][$row['__row_number']] = $e->getMessage();
            }
        }

        $job->update([
            'status'         => 'completed',
            'imported_rows'  => $summary['staff_created'],
            'import_summary' => $summary,
            'imported_at'    => now(),
        ]);

        return $summary;
    }

    private function processRow(array $row, array &$summary): void
    {
        $teacherType = $row['__teacher_type'];

        Staff::create([
            'school_id'       => $this->schoolId,
            'user_id'         => null,
            'emp_id'          => $row['emp_id'],
            'first_name'      => $row['first_name'],
            'last_name'       => $row['last_name'],
            'gender'          => $row['gender'],
            'date_of_birth'   => $row['date_of_birth'] ?? null,
            'phone'           => $row['phone'] ?? null,
            'email'           => $row['email'] ?? null,
            'department_id'   => $row['__department_id'],
            'designation_id'  => $row['__designation_id'],
            'teacher_type'    => $teacherType,
            'status'          => 'active',
            'joining_date'    => now(),
        ]);

        $summary['staff_created']++;
    }
}
