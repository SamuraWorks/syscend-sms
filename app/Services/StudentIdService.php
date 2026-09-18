<?php

namespace App\Services;

use App\Models\School;
use App\Models\SchoolSetting;
use App\Models\Student;
use Illuminate\Support\Facades\DB;

/**
 * School-scoped Student ID (admission number) generation.
 *
 * Format is configurable per school via the `student_id_format` school
 * setting. Supported tokens:
 *
 *   {YYYY}   four-digit year            2026
 *   {YY}     two-digit year             26
 *   {SCHOOL} school code, uppercased    SCH (from schools.code / slug)
 *   {SEQ:N}  per-school sequence, zero padded to N digits (default 4)
 *
 * Default format: ADM-{YYYY}-{SEQ:4} → ADM-2026-0001
 *
 * The sequence is derived from the highest existing sequence for the same
 * rendered prefix within the school (NOT a row count), so deleting students
 * can never cause a duplicate. A DB-level unique index on
 * (school_id, admission_no) is the final guard; generation retries on the
 * rare race.
 */
class StudentIdService
{
    public const DEFAULT_FORMAT = 'ADM-{YYYY}-{SEQ:4}';

    public static function formatFor(int $schoolId): string
    {
        $format = SchoolSetting::get($schoolId, 'student_id_format');

        return is_string($format) && trim($format) !== ''
            ? trim($format)
            : self::DEFAULT_FORMAT;
    }

    /** Preview of the NEXT id that would be generated (for UI hints). */
    public static function nextPreview(int $schoolId): string
    {
        return self::render(self::formatFor($schoolId), $schoolId);
    }

    /**
     * Generate a guaranteed-unique student id for the school.
     * Retries against the unique index in case of concurrent creation.
     */
    public static function generate(int $schoolId): string
    {
        $format = self::formatFor($schoolId);

        for ($attempt = 0; $attempt < 5; $attempt++) {
            $candidate = self::render($format, $schoolId);

            $exists = Student::withoutGlobalScopes()
                ->where('school_id', $schoolId)
                ->where('admission_no', $candidate)
                ->exists();

            if (! $exists) {
                return $candidate;
            }
        }

        // Extremely defensive fallback: suffix a random tail rather than fail.
        return $candidate . '-' . strtoupper(substr(bin2hex(random_bytes(2)), 0, 4));
    }

    private static function render(string $format, int $schoolId): string
    {
        // A format without a sequence token could never guarantee uniqueness,
        // so one is appended implicitly.
        if (!preg_match('/\{SEQ:\d+\}/', $format)) {
            $format .= '-{SEQ:4}';
        }

        $school = School::find($schoolId);
        $seqWidth = 4;
        if (preg_match('/\{SEQ:(\d+)\}/', $format, $m)) {
            $seqWidth = max(1, min(10, (int) $m[1]));
        }

        // Prefix with all variable parts EXCEPT the sequence resolved,
        // so we can find the highest existing sequence for this exact prefix.
        $prefix = str_replace(
            ['{YYYY}', '{YY}', '{SCHOOL}', '{SEQ:' . $seqWidth . '}'],
            [
                now()->format('Y'),
                now()->format('y'),
                self::schoolToken($school),
                '{SEQ}',
            ],
            $format
        );

        $next = self::nextSequence($schoolId, $prefix, $seqWidth);

        return str_replace('{SEQ}', str_pad((string) $next, $seqWidth, '0', STR_PAD_LEFT), $prefix);
    }

    private static function schoolToken(?School $school): string
    {
        $token = $school->code ?? null;

        if (empty($token)) {
            $slug = $school->slug ?? '';
            $token = substr(preg_replace('/[^a-z0-9]/i', '', $slug) ?? '', 0, 3);
        }

        return strtoupper($token !== '' ? $token : 'SCH');
    }

    /**
     * Highest existing numeric sequence following the static prefix + 1.
     * Matches both plain and zero-padded stored values.
     */
    private static function nextSequence(int $schoolId, string $prefix, int $seqWidth): int
    {
        // Everything before the sequence placeholder is the static stem.
        $stem = rtrim(str_replace('{SEQ}', '', $prefix), '-');

        // Degenerate format like "{SEQ:4}" — plain numeric ids.
        $like    = $stem === '' ? '%' : str_replace(['%', '_'], ['\%', '\_'], $stem) . '-%';
        $pattern = $stem === ''
            ? '/^(\d{1,' . ($seqWidth + 3) . '})$/u'
            : '/^' . preg_quote($stem, '/') . '-(\d{1,' . ($seqWidth + 3) . '})$/u';

        $rows = Student::withoutGlobalScopes()
            ->where('school_id', $schoolId)
            ->where('admission_no', 'like', $like)
            ->pluck('admission_no');

        $max = 0;
        foreach ($rows as $admissionNo) {
            if (preg_match($pattern, $admissionNo, $m)) {
                $max = max($max, (int) $m[1]);
            }
        }

        return $max + 1;
    }
}
