<?php

namespace App\Services;

use App\Models\{Guardian, ImportJob, SchoolClass, Section, Student};
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\{DB, Str};
use PhpOffice\PhpSpreadsheet\IOFactory;

class StudentImportService
{
    private const ALLOWED_COLUMNS = [
        'student_id_no', 'first_name', 'last_name', 'middle_name', 'gender',
        'date_of_birth', 'class_name', 'section_name', 'phone', 'email',
        'parent_name', 'parent_phone', 'parent_email', 'parent_occupation', 'parent_address',
    ];

    private const VALID_GENDERS = ['male', 'female'];

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
        ]);

        return $dataRows;
    }

    public function validateRows(ImportJob $job): array
    {
        $rows = $this->parseFile($job);
        $valid = [];
        $errors = [];

        $existingStudentIds = Student::where('school_id', $this->schoolId)
            ->pluck('student_id')
            ->map(fn($id) => strtolower($id))
            ->toArray();

        $existingClasses = SchoolClass::where('school_id', $this->schoolId)
            ->get()
            ->keyBy(fn($c) => strtolower($c->name));

        $existingSections = [];
        foreach ($existingClasses as $class) {
            foreach ($class->sections as $section) {
                $existingSections[strtolower($class->name)][strtolower($section->name)] = $section->id;
            }
        }

        $seenStudentIds = [];

        foreach ($rows as $row) {
            $rowNum = $row['__row_number'];
            $rowErrors = [];

            $studentIdNo = trim($row['student_id_no'] ?? '');
            $firstName = trim($row['first_name'] ?? '');
            $lastName = trim($row['last_name'] ?? '');
            $gender = strtolower(trim($row['gender'] ?? ''));
            $className = strtolower(trim($row['class_name'] ?? ''));

            if ($firstName === '') {
                $rowErrors[] = 'first_name is required.';
            }
            if ($lastName === '') {
                $rowErrors[] = 'last_name is required.';
            }
            if ($gender === '' || !in_array($gender, self::VALID_GENDERS, true)) {
                $rowErrors[] = 'gender must be male or female.';
            }
            if ($className === '') {
                $rowErrors[] = 'class_name is required.';
            } elseif (!isset($existingClasses[$className])) {
                $rowErrors[] = "class_name '{$row['class_name']}' not found.";
            }

            $sectionName = strtolower(trim($row['section_name'] ?? ''));
            if ($sectionName !== '' && $className !== '' && isset($existingClasses[$className])) {
                if (!isset($existingSections[$className][$sectionName])) {
                    $rowErrors[] = "section_name '{$row['section_name']}' not found for class '{$row['class_name']}'.";
                }
            }

            if ($studentIdNo !== '') {
                if (isset($existingStudentIds[strtolower($studentIdNo)])) {
                    $rowErrors[] = "student_id_no '{$studentIdNo}' already exists in this school.";
                }
                if (in_array(strtolower($studentIdNo), $seenStudentIds, true)) {
                    $rowErrors[] = "Duplicate student_id_no '{$studentIdNo}' in file.";
                }
                $seenStudentIds[] = strtolower($studentIdNo);
            }

            $email = trim($row['email'] ?? '');
            if ($email !== '' && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
                $rowErrors[] = 'email is not a valid email address.';
            }

            if (!empty($rowErrors)) {
                $errors[$rowNum] = $rowErrors;
                continue;
            }

            $resolvedClassId = isset($existingClasses[$className]) ? $existingClasses[$className]->id : null;
            $resolvedSectionId = null;
            if ($sectionName !== '' && isset($existingSections[$className][$sectionName])) {
                $resolvedSectionId = $existingSections[$className][$sectionName];
            }

            $valid[] = array_merge(
                collect($row)->only(self::ALLOWED_COLUMNS)->toArray(),
                [
                    '__row_number'    => $rowNum,
                    '__class_id'      => $resolvedClassId,
                    '__section_id'    => $resolvedSectionId,
                    '__gender'        => $gender,
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
            'students_created'  => 0,
            'guardians_created' => 0,
            'guardians_linked'  => 0,
            'skipped'           => 0,
            'errors'            => [],
        ];

        $job->update(['status' => 'importing']);

        $resolver = new \App\Services\ParentIdentityResolver($this->schoolId);

        foreach ($batches as $batch) {
            DB::transaction(function () use ($batch, &$summary, $resolver) {
                foreach ($batch as $row) {
                    try {
                        $this->processRow($row, $summary, $resolver);
                    } catch (\Throwable $e) {
                        $summary['errors'][$row['__row_number']] = $e->getMessage();
                    }
                }
            });
        }

        $job->update([
            'status'         => 'completed',
            'imported_rows'  => $summary['students_created'],
            'import_summary' => $summary,
            'imported_at'    => now(),
        ]);

        return $summary;
    }

    private function processRow(array $row, array &$summary, \App\Services\ParentIdentityResolver $resolver): void
    {
        $studentId = trim($row['student_id_no'] ?? '');
        if ($studentId === '') {
            $studentId = strtoupper(
                date('Y') .
                substr($this->getSchoolCode(), 0, 3) .
                str_pad($summary['students_created'] + 1, 4, '0', STR_PAD_LEFT)
            );
        }

        $guardianId = null;
        $parentName = trim($row['parent_name'] ?? '');
        $rawEmail = strtolower(trim($row['parent_email'] ?? ''));
        $rawPhone = trim($row['parent_phone'] ?? '');
        $normalizedPhone = preg_replace('/\D/', '', $rawPhone) ?? '';

        if ($parentName !== '' || $rawEmail !== '' || $rawPhone !== '') {
            // Prefer stable identity resolution by email+phone when available
            $existingGuardianId = null;
            if ($rawEmail !== '' || $normalizedPhone !== '') {
                $existingGuardianId = $resolver->resolve($rawEmail, $normalizedPhone);
            }

            if ($existingGuardianId) {
                $guardian = Guardian::where('school_id', $this->schoolId)->findOrFail($existingGuardianId);
                $updates = [];
                if (empty($guardian->email) && $rawEmail !== '') $updates['email'] = $rawEmail;
                if (empty($guardian->phone) && $normalizedPhone !== '') $updates['phone'] = $normalizedPhone;
                if (!empty($row['parent_occupation']) && empty($guardian->occupation)) $updates['occupation'] = trim($row['parent_occupation']);
                if (!empty($row['parent_address']) && empty($guardian->address)) $updates['address'] = trim($row['parent_address']);
                if (!empty($updates)) $guardian->update($updates);

                $guardianId = $guardian->id;
                $summary['guardians_linked']++;
            } else {
                // Fallback: try name-based legacy matching, else create new guardian record
                $existingGuardian = null;
                if ($parentName !== '') {
                    $existingGuardian = Guardian::where('school_id', $this->schoolId)
                        ->whereRaw('LOWER(name) = ?', [strtolower($parentName)])
                        ->first();
                }

                if ($existingGuardian) {
                    $guardianId = $existingGuardian->id;
                    $summary['guardians_linked']++;
                } else {
                    $guardian = Guardian::create([
                        'school_id'  => $this->schoolId,
                        'user_id'    => null,
                        'name'       => $parentName ?: null,
                        'relation'   => 'guardian',
                        'phone'      => $normalizedPhone ?: null,
                        'email'      => $rawEmail ?: null,
                        'occupation' => trim($row['parent_occupation'] ?? '') ?: null,
                        'address'    => trim($row['parent_address'] ?? '') ?: null,
                    ]);
                    $guardianId = $guardian->id;
                    $summary['guardians_created']++;
                }
            }
        }

        Student::create([
            'school_id'             => $this->schoolId,
            'user_id'               => null,
            'student_id'            => $studentId,
            'first_name'            => $row['first_name'],
            'last_name'             => $row['last_name'],
            'middle_name'           => $row['middle_name'] ?? null,
            'gender'                => $row['__gender'],
            'date_of_birth'         => $row['date_of_birth'] ?? null,
            'class_id'              => $row['__class_id'],
            'section_id'            => $row['__section_id'],
            'guardian_id'           => $guardianId,
            'phone'                 => trim($row['phone'] ?? '') ?: null,
            'email'                 => trim($row['email'] ?? '') ?: null,
            'status'                => 'active',
            'registration_status'   => 'pending',
            'admission_date'        => now(),
        ]);

        $summary['students_created']++;
    }

    private function getSchoolCode(): string
    {
        return \App\Models\School::where('id', $this->schoolId)->value('code') ?? 'SCH';
    }
}
