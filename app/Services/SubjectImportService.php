<?php

namespace App\Services;

use App\Models\{AcademicYear, Department, ImportJob, SchoolClass, Subject, SubjectOffering};
use App\Support\StoredFile;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;
use PhpOffice\PhpSpreadsheet\IOFactory;

class SubjectImportService
{
    private const ALLOWED_COLUMNS = [
        'class_name', 'name', 'code', 'type', 'full_marks', 'pass_marks', 'department_name', 'is_core',
    ];

    private const VALID_TYPES = ['theory', 'practical'];

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

        $existingClasses = SchoolClass::where('school_id', $this->schoolId)
            ->get()
            ->keyBy(fn($c) => strtolower($c->name));

        $existingDepartments = Department::where('school_id', $this->schoolId)
            ->academic()
            ->active()
            ->get()
            ->keyBy(fn($d) => strtolower($d->name));

        $existingCodes = Subject::where('school_id', $this->schoolId)
            ->whereNotNull('code')
            ->pluck('code')
            ->map(fn($code) => strtolower($code))
            ->all();

        $seenCodes = [];

        foreach ($rows as $row) {
            $rowNum = $row['__row_number'];
            $rowErrors = [];

            $className      = trim($row['class_name'] ?? '');
            $name           = trim($row['name'] ?? '');
            $code           = trim($row['code'] ?? '');
            $type           = strtolower(trim($row['type'] ?? ''));
            $isCore         = strtolower(trim($row['is_core'] ?? ''));
            $fullMarks      = trim((string) ($row['full_marks'] ?? ''));
            $passMarks      = trim((string) ($row['pass_marks'] ?? ''));
            $departmentName = trim($row['department_name'] ?? '');

            $classKey = strtolower($className);
            $class = $existingClasses[$classKey] ?? null;

            if ($name === '') {
                $rowErrors[] = 'name is required.';
            }
            if ($className === '') {
                $rowErrors[] = 'class_name is required.';
            } elseif (!$class) {
                $rowErrors[] = "class_name '{$className}' not found.";
            }

            if ($type === '') {
                $type = 'theory';
            } elseif (!in_array($type, self::VALID_TYPES, true)) {
                $rowErrors[] = 'type must be theory or practical.';
            }

            if ($code !== '') {
                if (in_array(strtolower($code), $existingCodes, true)) {
                    $rowErrors[] = "code '{$code}' already exists.";
                }
                if (in_array(strtolower($code), $seenCodes, true)) {
                    $rowErrors[] = "code '{$code}' appears more than once in the file.";
                }
            }

            $department = null;
            if ($departmentName !== '') {
                $department = $existingDepartments[strtolower($departmentName)] ?? null;
                if (!$department) {
                    $rowErrors[] = "department_name '{$departmentName}' not found.";
                } elseif ($class && $class->school_level !== 'senior_secondary') {
                    $rowErrors[] = 'department_name can only be assigned to Senior Secondary (SSS) subjects.';
                }
            }

            if ($fullMarks !== '' && !ctype_digit($fullMarks)) {
                $rowErrors[] = 'full_marks must be a whole number.';
            }
            if ($passMarks !== '' && !ctype_digit($passMarks)) {
                $rowErrors[] = 'pass_marks must be a whole number.';
            }

            if ($code !== '') {
                $seenCodes[] = strtolower($code);
            }

            if ($rowErrors !== []) {
                $errors[$rowNum] = $rowErrors;
                continue;
            }

            $valid[] = array_merge(
                collect($row)->only(self::ALLOWED_COLUMNS)->toArray(),
                [
                    '__row_number'    => $rowNum,
                    '__class_id'      => $class?->id,
                    '__school_level'  => $class?->school_level,
                    '__department_id' => $department?->id,
                    '__type'          => $type,
                    '__is_core'       => !in_array($isCore, ['no', 'false', ''], true),
                    '__full_marks'    => $fullMarks !== '' ? (int) $fullMarks : null,
                    '__pass_marks'    => $passMarks !== '' ? (int) $passMarks : null,
                    '__code'          => $code !== '' ? $code : null,
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

        $preview = array_map(
            fn(array $row) => array_diff_key($row, array_flip(array_filter(array_keys($row), fn($key) => str_starts_with($key, '__')))),
            array_slice($validation['valid'], 0, 50)
        );

        return [
            'preview'    => $preview,
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
            'subjects_created'  => 0,
            'offerings_created' => 0,
            'skipped'           => 0,
            'errors'            => [],
        ];

        $job->update(['status' => 'importing']);

        foreach (array_chunk($validRows, 50) as $batch) {
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
            'imported_rows'  => $summary['subjects_created'],
            'import_summary' => $summary,
            'imported_at'    => now(),
        ]);

        return $summary;
    }

    private function processRow(array $row, array &$summary): void
    {
        $code = $row['__code'];

        if (!empty($code) && Subject::where('school_id', $this->schoolId)->where('code', $code)->exists()) {
            $summary['skipped']++;
            return;
        }

        $subject = Subject::create([
            'school_id'     => $this->schoolId,
            'class_id'      => $row['__class_id'],
            'name'          => $row['name'],
            'code'          => $code,
            'type'          => $row['__type'],
            'full_marks'    => $row['__full_marks'],
            'pass_marks'    => $row['__pass_marks'],
            'school_level'  => $row['__school_level'],
            'department_id' => $row['__department_id'],
            'is_core'       => $row['__is_core'],
        ]);

        $summary['subjects_created']++;

        $currentYear = AcademicYear::where('school_id', $this->schoolId)
            ->where('is_current', true)
            ->first();

        if (!$currentYear) {
            return;
        }

        $subjectCode = !empty($code)
            ? $code
            : strtoupper(preg_replace('/\s+/', '', substr($row['name'], 0, 6)));

        $exists = SubjectOffering::where('school_id', $this->schoolId)
            ->where('academic_year_id', $currentYear->id)
            ->where('class_id', $row['__class_id'])
            ->where('subject_code', $subjectCode)
            ->exists();

        if ($exists) {
            return;
        }

        SubjectOffering::create([
            'school_id'        => $this->schoolId,
            'academic_year_id' => $currentYear->id,
            'class_id'         => $row['__class_id'],
            'subject_id'       => $subject->id,
            'subject_name'     => $row['name'],
            'subject_code'     => $subjectCode,
            'subject_type'     => 'compulsory',
            'department_id'    => $row['__department_id'],
            'is_active'        => true,
        ]);

        $summary['offerings_created']++;
    }
}
