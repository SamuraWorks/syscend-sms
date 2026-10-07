<?php

namespace App\Services;

use App\Models\{Guardian, ImportJob, Student};
use App\Support\StoredFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use PhpOffice\PhpSpreadsheet\IOFactory;

class ParentImportService
{
    private const VALID_RELATIONS = ['father', 'mother', 'guardian', 'uncle', 'aunt', 'sibling', 'other'];

    /**
     * Canonical column => accepted aliases (legacy headers included).
     * Canonical names match the official template headers:
     * Student ID*, Parent Full Name*, Relationship*, Email*, Phone*, Alt Phone, Address, Primary Contact
     */
    private const COLUMN_ALIASES = [
        'student_id'       => ['student_id', 'studentid', 'student_id_no', 'admission_no', 'admissionnumber'],
        'parent_full_name' => ['parent_full_name', 'parentname', 'parent_name'],
        'relationship'     => ['relationship', 'relation'],
        'email'            => ['email', 'parent_email'],
        'phone'            => ['phone', 'parent_phone', 'phonenumber'],
        'alt_phone'        => ['alt_phone', 'alternate_phone', 'altphonenumber'],
        'address'          => ['address'],
        'primary_contact'  => ['primary_contact'],
    ];

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

        $rawHeaders = array_map(fn($h) => Str::slug(trim((string) $h), '_'), array_values($rows[1]));

        $headers = array_map(function ($h) {
            foreach (self::COLUMN_ALIASES as $canonical => $aliases) {
                if (in_array($h, $aliases, true)) {
                    return $canonical;
                }
            }
            return $h;
        }, $rawHeaders);

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

        $studentsByIdentifier = $this->buildStudentLookup();
        $existingPairs = $this->buildExistingLinkSet();

        $resolver = new ParentIdentityResolver($this->schoolId);

        $seenLinks = [];

        foreach ($rows as $row) {
            $rowNum = $row['__row_number'];
            $rowErrors = [];

            $parentName = trim((string) ($row['parent_full_name'] ?? ''));
            if ($parentName === '') {
                $rowErrors[] = 'Parent Full Name is required.';
            }

            $relation = strtolower(trim((string) ($row['relationship'] ?? '')));
            if ($relation === '') {
                $rowErrors[] = 'Relationship is required.';
            } elseif (!in_array($relation, self::VALID_RELATIONS, true)) {
                $rowErrors[] = 'Relationship must be one of: ' . implode(', ', self::VALID_RELATIONS) . '.';
            }

            $rawEmail = strtolower(trim((string) ($row['email'] ?? '')));
            if ($rawEmail === '') {
                $rowErrors[] = 'Email is required.';
            } elseif (!filter_var($rawEmail, FILTER_VALIDATE_EMAIL)) {
                $rowErrors[] = "Email '{$rawEmail}' is not a valid email address.";
            }

            $rawPhone = trim((string) ($row['phone'] ?? ''));
            $phone = $this->normalizePhone($rawPhone);
            if ($phone === '') {
                $rowErrors[] = 'Phone is required.';
            } elseif (strlen($phone) < 7) {
                $rowErrors[] = "Phone '{$rawPhone}' does not look like a valid phone number.";
            }

            $altPhoneRaw = trim((string) ($row['alt_phone'] ?? ''));
            $altPhone = $this->normalizePhone($altPhoneRaw);
            if ($altPhoneRaw !== '' && $altPhone === '') {
                $rowErrors[] = "Alt Phone '{$altPhoneRaw}' does not look like a valid phone number.";
            }
            if ($altPhone !== '' && $altPhone === $phone) {
                $rowErrors[] = 'Alt Phone must be different from Phone.';
            }

            $primaryContactRaw = strtolower(trim((string) ($row['primary_contact'] ?? '')));
            if ($primaryContactRaw !== '' && !in_array($primaryContactRaw, ['email', 'phone'], true)) {
                $rowErrors[] = 'Primary Contact must be either "email" or "phone".';
            }

            $studentIdentifier = trim((string) ($row['student_id'] ?? ''));
            if ($studentIdentifier === '') {
                $rowErrors[] = 'Student ID is required.';
            } elseif (!isset($studentsByIdentifier[$studentIdentifier])) {
                $rowErrors[] = "Student ID '{$studentIdentifier}' not found in this school.";
            }

            if (!empty($rowErrors)) {
                $errors[$rowNum] = $rowErrors;
                continue;
            }

            /** @var Student $student */
            $student = $studentsByIdentifier[$studentIdentifier];

            $linkKey = $student->id . '|' . $rawEmail . '|' . $phone . '|' . $relation;
            if (isset($seenLinks[$linkKey])) {
                $errors[$rowNum] = ["Duplicate row: this parent is already linked to student {$studentIdentifier} as {$relation} earlier in this file."];
                continue;
            }
            $seenLinks[$linkKey] = true;

            $existingGuardianId = $resolver->resolve($rawEmail, $phone);

            if ($existingGuardianId && isset($existingPairs[$student->id . '|' . $existingGuardianId . '|' . $relation])) {
                $errors[$rowNum] = ["Skipped: {$parentName} is already linked to student {$studentIdentifier} as {$relation}."];
                continue;
            }

            $valid[] = [
                'student_id'       => $studentIdentifier,
                'parent_full_name' => $parentName,
                'relationship'     => $relation,
                'email'            => $rawEmail,
                'phone'            => $rawPhone,
                'alt_phone'        => $altPhoneRaw,
                'address'          => trim((string) ($row['address'] ?? '')),
                'primary_contact'  => $primaryContactRaw !== '' ? $primaryContactRaw : 'email',
                '__row_number'     => $rowNum,
                '__student_pk'     => $student->id,
                '__existing_guardian_id' => $existingGuardianId,
            ];
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

        $preview = collect($validation['valid'])
            ->take(50)
            ->map(fn($row) => collect($row)
                ->reject(fn($value, $key) => str_starts_with((string) $key, '__'))
                ->all())
            ->values()
            ->all();

        return [
            'preview'       => $preview,
            'total_rows'    => $validation['total'],
            'valid_rows'    => count($validation['valid']),
            'error_rows'    => count($validation['errors']),
            'errors'        => $validation['errors'],
        ];
    }

    public function executeImport(ImportJob $job): array
    {
        $validation = $this->validateRows($job);

        $validRows = $validation['valid'];
        $batchSize = 50;
        $batches = array_chunk($validRows, $batchSize);

        $summary = [
            'parents_created'       => 0,
            'parents_reused'        => 0,
            'links_created'         => 0,
            'skipped_existing_links'=> 0,
            'errors'                => [],
        ];

        $job->update(['status' => 'importing']);

        $resolver = null;

        foreach ($batches as $batch) {
            DB::transaction(function () use ($batch, &$summary, &$resolver) {
                foreach ($batch as $row) {
                    try {
                        $resolver ??= new ParentIdentityResolver($this->schoolId);
                        $this->processRow($row, $summary, $resolver);
                    } catch (\Throwable $e) {
                        $summary['errors'][$row['__row_number']] = $e->getMessage();
                    }
                }
            });
        }

        $linkedTotal = $summary['links_created'];

        $job->update([
            'status'         => 'completed',
            'imported_rows'  => $summary['parents_created'] + $summary['parents_reused'],
            'import_summary' => $summary,
            'imported_at'    => now(),
        ]);

        activity()
            ->useLog('imports')
            ->withProperties([
                'import_job_id'     => $job->id,
                'parents_created'   => $summary['parents_created'],
                'parents_reused'    => $summary['parents_reused'],
                'links_created'     => $summary['links_created'],
            ])
            ->log("Parent/guardian import completed: {$summary['parents_created']} created, {$summary['parents_reused']} reused, {$linkedTotal} child links created.");

        return $summary;
    }

    private function processRow(array $row, array &$summary, ParentIdentityResolver $resolver): void
    {
        $email = $row['email'];
        $phone = $this->normalizePhone($row['phone']);
        $altPhone = $this->normalizePhone($row['alt_phone']);

        $existingId = $resolver->resolve($email, $phone);

        if ($existingId) {
            /** @var Guardian $guardian */
            $guardian = Guardian::where('school_id', $this->schoolId)->findOrFail($existingId);

            $updates = [];
            if (empty($guardian->email)) $updates['email'] = $email;
            if (empty($guardian->phone)) $updates['phone'] = $phone;
            if ($altPhone !== '' && empty($guardian->alt_phone)) $updates['alt_phone'] = $altPhone;
            if (!empty($row['address']) && empty($guardian->address)) $updates['address'] = $row['address'];

            if (!empty($updates)) {
                $guardian->update($updates);
            }

            $summary['parents_reused']++;
        } else {
            $guardian = Guardian::create([
                'school_id'  => $this->schoolId,
                'user_id'    => null,
                'name'       => $row['parent_full_name'],
                'relation'   => $row['relationship'],
                'phone'      => $phone ?: null,
                'alt_phone'  => $altPhone ?: null,
                'email'      => $email,
                'occupation' => null,
                'address'    => !empty($row['address']) ? $row['address'] : null,
            ]);

            $resolver->remember($guardian);
            $summary['parents_created']++;
        }

        $student = Student::where('school_id', $this->schoolId)->findOrFail($row['__student_pk']);

        $isFirstLink = !DB::table('guardian_student')
            ->where('student_id', $student->id)
            ->exists();

        $inserted = DB::table('guardian_student')->insertOrIgnore([
            'guardian_id'    => $guardian->id,
            'student_id'     => $student->id,
            'school_id'      => $this->schoolId,
            'relationship'   => $row['relationship'],
            'is_primary'     => $isFirstLink,
            'created_at'     => now(),
            'updated_at'     => now(),
        ]);

        if ($inserted > 0) {
            $summary['links_created']++;
        } else {
            $summary['skipped_existing_links']++;
        }

        if (empty($student->guardian_id)) {
            $student->update(['guardian_id' => $guardian->id]);
        }
    }

    private function buildStudentLookup(): array
    {
        $lookup = [];

        Student::where('school_id', $this->schoolId)
            ->select('id', 'student_id', 'admission_no')
            ->get()
            ->each(function (Student $s) use (&$lookup) {
                if (!empty($s->student_id)) {
                    $lookup[$s->student_id] = $s;
                }
                if (!empty($s->admission_no)) {
                    $lookup[$s->admission_no] = $s;
                }
            });

        return $lookup;
    }

    private function buildExistingLinkSet(): array
    {
        $guardianIds = Guardian::where('school_id', $this->schoolId)->pluck('id');

        return DB::table('guardian_student')
            ->whereIn('guardian_id', $guardianIds)
            ->get(['student_id', 'guardian_id', 'relationship'])
            ->keyBy(fn($r) => "{$r->student_id}|{$r->guardian_id}|{$r->relationship}")
            ->map(fn($r) => true)
            ->all();
    }

    private function normalizePhone(string $value): string
    {
        $digits = preg_replace('/[^0-9+]/', '', trim($value)) ?? '';
        if ($digits === '') return '';
        $stripped = str_replace('+', '', $digits);
        return ctype_digit($stripped) ? $stripped : '';
    }
}
