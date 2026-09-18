<?php

namespace App\Services;

use App\Models\{AcademicYear, SchoolClass, Section, Staff, Subject, Timetable};
use Illuminate\Support\Facades\{Storage, DB};
use Illuminate\Support\{Collection, Str};

class TimetableImportService
{
    private const ALLOWED_COLUMNS = [
        'academic_year', 'day', 'start_time', 'end_time',
        'class_name', 'section_name', 'subject_name', 'teacher_name',
        'room', 'lesson_type', 'status',
    ];

    private const VALID_DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

    private int $schoolId;

    public function __construct(int $schoolId)
    {
        $this->schoolId = $schoolId;
    }

    public function parseFile($job): void
    {
        $filePath = Storage::disk('private')->path($job->file_path);
        $rows = $this->readRows($filePath);

        $header = array_map(fn ($h) => Str::slug(Str::lower(trim((string) $h)), '_'), $rows[0] ?? []);
        $dataRows = array_slice($rows, 1);

        $validRows = [];
        $errorRows = [];

        foreach ($dataRows as $idx => $row) {
            $record = $this->recordFromRow($header, $row);
            $errors = $this->validateRow($record, $idx + 2);

            if (empty($errors)) {
                $validRows[] = $record;
            } else {
                $errorRows[] = ['row' => $idx + 2, 'errors' => $errors, 'data' => $record];
            }
        }

        $job->update([
            'total_rows'       => count($dataRows),
            'valid_rows'       => count($validRows),
            'error_rows'       => count($errorRows),
            'validation_errors' => $errorRows,
            'status'           => 'validated',
            'validated_at'     => now(),
        ]);

        $job->setRelation('parsedData', collect($validRows));
    }

    public function previewRows($job): array
    {
        $errors = $job->validation_errors ?? [];
        return [
            'valid'   => $job->valid_rows,
            'invalid' => $job->error_rows,
            'total'   => $job->total_rows,
            'errors'  => array_slice($errors, 0, 50),
        ];
    }

    public function executeImport($job): array
    {
        $filePath = Storage::disk('private')->path($job->file_path);
        $rows = $this->readRows($filePath);
        $header = array_map(fn ($h) => Str::slug(Str::lower(trim((string) $h)), '_'), $rows[0] ?? []);
        $dataRows = array_slice($rows, 1);

        $imported = 0;
        $skipReasons = [];

        DB::transaction(function () use ($dataRows, $header, &$imported, &$skipReasons) {
            foreach ($dataRows as $idx => $row) {
                $record = $this->recordFromRow($header, $row);
                $reason = $this->importRow($record);
                if ($reason === null) {
                    $imported++;
                } else {
                    $skipReasons[$idx + 2] = $reason;
                }
            }
        });

        $job->update([
            'imported_rows' => $imported,
            'status'        => 'completed',
            'imported_at'   => now(),
            'import_summary' => [
                'imported'       => $imported,
                'skipped'        => count($skipReasons),
                'skipped_details' => array_slice($skipReasons, 0, 50, true),
            ],
        ]);

        return ['imported' => $imported, 'skipped' => count($skipReasons)];
    }

    /**
     * @return string|null null = row imported, string = reason it was skipped
     */
    private function importRow(array $record): ?string
    {
        $class = SchoolClass::where('school_id', $this->schoolId)
            ->whereRaw('LOWER(name) = ?', [Str::lower($record['class_name'] ?? '')])
            ->first();
        if (! $class) return "Class '{$record['class_name']}' not found in your school";

        $subject = Subject::where('school_id', $this->schoolId)
            ->whereRaw('LOWER(name) = ?', [Str::lower($record['subject_name'] ?? '')])
            ->where('class_id', $class->id)
            ->first();
        if (! $subject) return "Subject '{$record['subject_name']}' is not offered to class '{$record['class_name']}'";

        $section = null;
        if (! empty($record['section_name'])) {
            $section = Section::where('school_id', $this->schoolId)
                ->where('class_id', $class->id)
                ->whereRaw('LOWER(name) = ?', [Str::lower($record['section_name'])])
                ->first();
            if (! $section) return "Section '{$record['section_name']}' not found for class '{$record['class_name']}'";
        }

        $teacher = null;
        if (! empty($record['teacher_name'])) {
            $nameParts = explode(' ', trim($record['teacher_name']), 2);
            $firstName = $nameParts[0] ?? '';
            $lastName = $nameParts[1] ?? '';
            $teacher = Staff::where('school_id', $this->schoolId)
                ->whereRaw('LOWER(first_name) = ?', [Str::lower($firstName)])
                ->whereRaw('LOWER(last_name) = ?', [Str::lower($lastName)])
                ->first();
            if (! $teacher) return "Teacher '{$record['teacher_name']}' not found in your school (use First Last exactly as in Staff)";
        }

        $day = Str::lower(trim($record['day'] ?? ''));
        if (! in_array($day, self::VALID_DAYS)) return "Invalid day '{$record['day']}'";

        $academicYear = null;
        if (! empty($record['academic_year'])) {
            $academicYear = AcademicYear::where('school_id', $this->schoolId)
                ->whereRaw('LOWER(name) = ?', [Str::lower($record['academic_year'])])
                ->first();
        }

        $startTime = $this->normalizeTime($record['start_time'] ?? null);
        $endTime   = $this->normalizeTime($record['end_time'] ?? null);
        if (! $startTime || ! $endTime) return 'Missing or unparseable start/end time';

        // Teacher conflict check during import — reported, never silent.
        // The exact slot being upserted is excluded so a re-import can update it.
        if ($teacher) {
            $hasConflict = Timetable::where('school_id', $this->schoolId)
                ->where('teacher_id', $teacher->id)
                ->where('day_of_week', $day)
                ->where('start_time', '<', $endTime)
                ->where('end_time', '>', $startTime)
                ->where(function ($q) use ($class, $section, $day, $startTime) {
                    $q->where('class_id', '!=', $class->id)
                        ->orWhere('section_id', '!=', $section?->id)
                        ->orWhere('day_of_week', '!=', $day)
                        ->orWhere('start_time', '!=', $startTime);
                })
                ->exists();

            if ($hasConflict) {
                return "Teacher {$record['teacher_name']} is already booked {$day} {$startTime}-{$endTime}";
            }
        }

        Timetable::updateOrCreate(
            [
                'school_id'  => $this->schoolId,
                'class_id'   => $class->id,
                'section_id' => $section?->id,
                'day_of_week' => $day,
                'start_time' => $startTime,
            ],
            [
                'subject_id' => $subject->id,
                'teacher_id' => $teacher?->id,
                'end_time'   => $endTime,
                'room'       => $record['room'] ?? null,
                'notes'      => $record['lesson_type'] ?? null,
                'status'     => 'draft',
            ]
        );

        return null;
    }

    private function recordFromRow(array $header, array $row): array
    {
        $values = array_slice(array_pad(array_values($row), count($header), ''), 0, count($header));

        return array_combine($header, $values);
    }

    private function validateRow(array $record, int $rowNum): array
    {
        $errors = [];

        if (empty($record['class_name'])) $errors[] = 'Class name is required';
        if (empty($record['subject_name'])) $errors[] = 'Subject name is required';
        if (empty($record['day'])) $errors[] = 'Day is required';
        if (empty($record['start_time'])) $errors[] = 'Start time is required';
        if (empty($record['end_time'])) $errors[] = 'End time is required';

        $day = Str::lower(trim($record['day'] ?? ''));
        if ($day && ! in_array($day, self::VALID_DAYS)) {
            $errors[] = "Invalid day: {$record['day']}. Use: monday-sunday";
        }

        $start = $this->normalizeTime($record['start_time'] ?? null);
        $end   = $this->normalizeTime($record['end_time'] ?? null);

        if (! empty($record['start_time']) && ! $start) {
            $errors[] = "Start time '{$record['start_time']}' is not a recognizable time";
        }
        if (! empty($record['end_time']) && ! $end) {
            $errors[] = "End time '{$record['end_time']}' is not a recognizable time";
        }

        if ($start && $end && $start >= $end) {
            $errors[] = 'End time must be after start time';
        }

        return $errors;
    }

    /**
     * Read the uploaded spreadsheet into header+data row arrays.
     * Supports CSV and real Excel files (the official template is XLSX).
     */
    private function readRows(string $path): array
    {
        $ext = Str::lower(pathinfo($path, PATHINFO_EXTENSION));

        if (in_array($ext, ['xlsx', 'xlsm', 'xls'])) {
            return $this->readSpreadsheet($path);
        }

        return $this->readCsv($path);
    }

    private function readSpreadsheet(string $path): array
    {
        $spreadsheet = \PhpOffice\PhpSpreadsheet\IOFactory::load($path);
        $sheet = $spreadsheet->getActiveSheet();

        // formatData=false keeps raw values; we normalise times ourselves.
        $rows = $sheet->toArray(null, true, false, false);
        $spreadsheet->disconnectWorksheets();

        return array_map(fn ($row) => array_map(fn ($cell) => $this->cellToString($cell), $row), $rows);
    }

    /** Normalise spreadsheet cells to plain strings (times become H:i). */
    private function cellToString(mixed $cell): string
    {
        if ($cell === null) return '';
        if ($cell instanceof \DateTimeInterface) {
            return $cell->format('H:i');
        }
        if (is_float($cell) || is_int($cell)) {
            // Excel stores times as fractions of a day (0.5 = 12:00)
            if ($cell > 0 && $cell < 1 && fmod((float) $cell, 1) > 0) {
                $minutes = (int) round($cell * 24 * 60);
                return sprintf('%02d:%02d', intdiv($minutes, 60), $minutes % 60);
            }
            // Avoid scientific notation for long numbers like index numbers
            return (string) $cell;
        }
        return trim((string) $cell);
    }

    /** Normalise any supported representation to HH:MM. */
    private function normalizeTime(mixed $value): ?string
    {
        if ($value === null || trim((string) $value) === '') return null;

        $asText = $this->cellToString($value);

        if (preg_match('/^(\d{1,2}):(\d{2})(?::\d{2})?$/', $asText, $m)) {
            $h = (int) $m[1];
            $min = (int) $m[2];
            if ($h > 23 || $min > 59) return null;
            return sprintf('%02d:%02d', $h, $min);
        }

        // Excel fraction of day
        if (is_numeric($asText) && (float) $asText > 0 && (float) $asText < 1) {
            $minutes = (int) round(((float) $asText) * 24 * 60);
            return sprintf('%02d:%02d', intdiv($minutes, 60), $minutes % 60);
        }

        // e.g. "8.15 AM" / "8:15 AM"
        if (preg_match('/^(\d{1,2})[.:](\d{2})\s*(AM|PM)$/i', $asText, $m)) {
            $h = (int) $m[1] % 12 + (Str::lower($m[3]) === 'pm' ? 12 : 0);
            return sprintf('%02d:%02d', $h, (int) $m[2]);
        }

        return null;
    }

    private function readCsv(string $path): array
    {
        $rows = [];
        if (($handle = fopen($path, 'r')) !== false) {
            while (($row = fgetcsv($handle)) !== false) {
                $rows[] = $row;
            }
            fclose($handle);
        }
        return $rows;
    }
}
