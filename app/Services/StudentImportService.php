<?php

namespace App\Services;

use App\Models\{Guardian, ImportJob, SchoolClass, Section, Student};
use App\Support\Imports\HeaderAliases;
use App\Support\Imports\NameNormalizer;
use App\Support\Imports\TabularReader;
use App\Support\StoredFile;
use Illuminate\Support\Facades\DB;

class StudentImportService
{
    private const EXPECTED_HEADERS = [
        'student_id_no', 'first_name', 'last_name', 'gender', 'date_of_birth',
        'class_name', 'section_name', 'phone', 'email',
        'parent_name', 'parent_phone', 'parent_email', 'parent_occupation', 'parent_address',
    ];

    private const ALLOWED_COLUMNS = [
        'student_id_no', 'first_name', 'last_name', 'gender',
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

        $existingStudentIds = Student::where('school_id', $this->schoolId)
            ->whereNotNull('admission_no')
            ->pluck('admission_no')
            ->map(fn($id) => strtolower($id))
            ->toArray();


        $existingClasses = SchoolClass::where('school_id', $this->schoolId)
            ->orderBy('level_order')
            ->orderBy('name')
            ->get()
            ->keyBy(fn($c) => NameNormalizer::normalize($c->name));

        $availableClassNames = $existingClasses->pluck('name')->filter()->values()->all();

        $existingSections = [];
        $availableSections = [];
        foreach ($existingClasses as $class) {
            $classKey = NameNormalizer::normalize($class->name);
            foreach ($class->sections as $section) {
                $existingSections[$classKey][NameNormalizer::normalize($section->name)] = $section->id;
                $availableSections[$classKey][] = $section->name;
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
            $className = NameNormalizer::normalize($row['class_name'] ?? '');

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
                $rowErrors[] = "class_name '{$row['class_name']}' not found."
                    . ($availableClassNames
                        ? ' Available classes: ' . implode(', ', $availableClassNames) . '.'
                        : ' No classes exist yet — create the classes first.');
            }

            $sectionName = NameNormalizer::normalize($row['section_name'] ?? '');
            if ($sectionName !== '' && $className !== '' && isset($existingClasses[$className])) {
                if (!isset($existingSections[$className][$sectionName])) {
                    $opts = $availableSections[$className] ?? [];
                    $rowErrors[] = "section_name '{$row['section_name']}' not found for class '{$row['class_name']}'."
                        . ($opts
                            ? ' Available sections for this class: ' . implode(', ', $opts) . '.'
                            : ' This class has no sections — add a section to the class first.');
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

        $summary = [
            'students_created'  => 0,
            'guardians_created' => 0,
            'guardians_linked'  => 0,
            'skipped'           => 0,
            'errors'            => [],
        ];

        $job->update(['status' => 'importing']);

        $resolver = new \App\Services\ParentIdentityResolver($this->schoolId);

        foreach ($validRows as $row) {
            try {
                DB::transaction(function () use ($row, &$summary, $resolver) {
                    $this->processRow($row, $summary, $resolver);
                });
            } catch (\Throwable $e) {
                $summary['errors'][$row['__row_number']] = $e->getMessage();
            }
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
        $admissionNo = trim($row['student_id_no'] ?? '');

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
            'admission_no'          => $admissionNo !== '' ? $admissionNo : null,
            'first_name'            => $row['first_name'],
            'last_name'             => $row['last_name'],
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
}
