<?php

namespace App\Services;

use App\Models\{Department, Designation, ImportJob, Staff};
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\{DB, Str};
use PhpOffice\PhpSpreadsheet\IOFactory;

class StaffImportService
{
    private const ALLOWED_COLUMNS = [
        'emp_id',
        'first_name',
        'last_name',
        'middle_name',
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
        $filePath = Storage::disk('private')->path($job->file_path);

        if (!file_exists($filePath)) {
            throw new \RuntimeException("Import file not found: {$job->file_name}");
        }

        $spreadsheet = IOFactory::load($filePath);
        $sheet = $spreadsheet->getActiveSheet();
        $rows = $sheet->toArray(null, true, true, true);

        if (count($rows) < 2) {
            throw new \RuntimeException('Import file contains no data rows.');
        }

        $headers = array_map(fn($h) => Str::slug(trim($h), '_'), array_values($rows[1]));

        $dataRows = [];
        foreach ($rows as $rowIndex => $row) {
            if ($rowIndex <= 1) continue;

            $values = array_slice(array_pad(array_values($row), count($headers), ''), 0, count($headers));
            $rowKeyed = array_combine($headers, $values);
            $rowKeyed['__row_number'] = $rowIndex;
            $dataRows[] = $rowKeyed;
        }

        $job->update([
            'total_rows' => count($dataRows),
            'file_name'  => $job->file_name,
        ]);

        return $dataRows;
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
            ->mapWithKeys(fn($name, $id) => [strtolower($name) => $id])
            ->toArray();

        $existingDesignations = Designation::where('school_id', $this->schoolId)
            ->pluck('name', 'id')
            ->mapWithKeys(fn($name, $id) => [strtolower($name) => $id])
            ->toArray();

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
                $deptLower = strtolower($departmentName);
                if (!isset($existingDepartments[$deptLower])) {
                    $rowErrors[] = "department_name '{$departmentName}' not found.";
                }
            }

            if ($designationName !== '') {
                $desLower = strtolower($designationName);
                if (!isset($existingDesignations[$desLower])) {
                    $rowErrors[] = "designation_name '{$designationName}' not found.";
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
                    '__department_id'    => $departmentName !== '' ? $existingDepartments[strtolower($departmentName)] : null,
                    '__designation_id'   => $designationName !== '' ? $existingDesignations[strtolower($designationName)] : null,
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
        $batchSize = 50;
        $batches = array_chunk($validRows, $batchSize);

        $summary = [
            'staff_created'   => 0,
            'skipped'         => 0,
            'errors'          => [],
        ];

        $job->update(['status' => 'importing']);

        foreach ($batches as $batch) {
            DB::transaction(function () use ($batch, &$summary) {
                foreach ($batch as $row) {
                    try {
                        $this->processRow($row, $summary);
                    } catch (\Throwable $e) {
                        $summary['errors'][$row['__row_number']] = $e->getMessage();
                    }
                }
            });
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
            'middle_name'     => $row['middle_name'] ?? null,
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
