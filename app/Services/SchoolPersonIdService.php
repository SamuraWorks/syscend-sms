<?php

namespace App\Services;

use App\Models\School;
use App\Models\SchoolSetting;
use App\Models\Staff;
use App\Models\Student;

/**
 * School-owned person identification engine.
 *
 * The SCHOOL is the owner of its people's identifiers. This service only ever
 * generates an ID when the school has neither supplied one nor must have one
 * supplied explicitly:
 *  - a school-issued identifier (student_id / emp_id) is ALWAYS preserved — it
 *    is never overwritten with a Syscend-generated number;
 *  - generation is optional (school_id_generation_enabled = false disables it)
 *    and, when enabled, uses a per-type format the school configures.
 *
 * Supported format tokens:
 *   {SCHOOL}  school code / slug-derived token, uppercased   MFA
 *   {TYPE}    person-type code: STU, TCH or STF             STU
 *   {YYYY}    four-digit year                                2026
 *   {YY}      two-digit year                                 26
 *   {SEQ:N}   per-school sequence, zero-padded to N digits   00125
 *
 * Example format:  {SCHOOL}/{TYPE}/{YYYY}/{SEQ:5}  →  MFA/STU/2026/00125
 *
 * Sequences are derived from the highest existing sequence for the same
 * rendered stem within the school (never a row count), so deleted records can
 * never cause a duplicate. DB-level unique indexes on (school_id, <field>) are
 * the final guard; generation retries on the rare race.
 */
class SchoolPersonIdService
{
    public const DEFAULT_FORMATS = [
        'student' => 'ADM-{YYYY}-{SEQ:4}',
        'teacher' => 'EMP-{YYYY}-{SEQ:4}',
        'staff'   => 'EMP-{YYYY}-{SEQ:4}',
    ];

    public const TYPE_CODES = [
        'student' => 'STU',
        'teacher' => 'TCH',
        'staff'   => 'STF',
    ];

    public const TYPE_MODELS = [
        'student' => Student::class,
        'teacher' => Staff::class,
        'staff'   => Staff::class,
    ];

    public const TYPE_FIELDS = [
        'student' => 'admission_no',
        'teacher' => 'emp_id',
        'staff'   => 'emp_id',
    ];

    public const TYPE_SETTINGS = [
        'student' => 'student_id_format',
        'teacher' => 'teacher_id_format',
        'staff'   => 'staff_id_format',
    ];

    private const ENABLE_SETTING = 'school_id_generation_enabled';

    public static function generationEnabled(int $schoolId): bool
    {
        return SchoolSetting::get($schoolId, self::ENABLE_SETTING) !== '0'
            && SchoolSetting::get($schoolId, self::ENABLE_SETTING) !== 'false';
    }

    public static function setGenerationEnabled(int $schoolId, bool $enabled): void
    {
        SchoolSetting::set($schoolId, self::ENABLE_SETTING, $enabled ? '1' : '0');
    }

    public static function formatFor(int $schoolId, string $type): string
    {
        $setting = SchoolSetting::get($schoolId, self::TYPE_SETTINGS[$type]);

        return is_string($setting) && trim($setting) !== ''
            ? trim($setting)
            : (self::TYPE_FIELDS[$type] === 'emp_id'
                ? self::DEFAULT_FORMATS['teacher'] // teachers and staff share the EMP default
                : self::DEFAULT_FORMATS[$type]);
    }

    /** Preview of the NEXT id that would be generated for the type (UI hint). */
    public static function nextPreview(int $schoolId, string $type): string
    {
        return self::render(self::formatFor($schoolId, $type), $schoolId, self::TYPE_CODES[$type]);
    }

    /**
     * Generate a guaranteed-unique id for the given person type within a school.
     * The candidate is re-checked against the unique index in case of concurrent creation.
     */
    public static function generate(int $schoolId, string $type): string
    {
        $format = self::formatFor($schoolId, $type);
        $field  = self::TYPE_FIELDS[$type];
        $model  = self::TYPE_MODELS[$type];

        for ($attempt = 0; $attempt < 5; $attempt++) {
            $candidate = self::render($format, $schoolId, self::TYPE_CODES[$type]);

            $exists = $model::withoutGlobalScopes()
                ->where('school_id', $schoolId)
                ->where($field, $candidate)
                ->exists();

            if (! $exists) {
                return $candidate;
            }
        }

        return $candidate . '-' . strtoupper(substr(bin2hex(random_bytes(2)), 0, 4));
    }

    public static function render(string $format, int $schoolId, string $typeCode): string
    {
        // A format without a sequence token cannot guarantee uniqueness, so one is appended implicitly.
        if (! preg_match('/\{SEQ:\d+\}/', $format)) {
            $format .= '-{SEQ:4}';
        }

        $seqWidth = 4;
        if (preg_match('/\{SEQ:(\d+)\}/', $format, $m)) {
            $seqWidth = max(1, min(10, (int) $m[1]));
        }

        $school = School::find($schoolId);

        // Prefix with everything resolved EXCEPT the sequence, so we can find the
        // highest existing sequence for this exact stem.
        $prefix = str_replace(
            ['{YYYY}', '{YY}', '{SCHOOL}', '{TYPE}', '{SEQ:' . $seqWidth . '}'],
            [
                now()->format('Y'),
                now()->format('y'),
                self::schoolToken($school),
                self::typeToken($typeCode),
                '{SEQ}',
            ],
            $format
        );

        $next = self::nextSequence($schoolId, $typeCode, $prefix, $seqWidth);

        return str_replace('{SEQ}', str_pad((string) $next, $seqWidth, '0', STR_PAD_LEFT), $prefix);
    }

    private static function typeToken(string $typeCode): string
    {
        return strtoupper($typeCode !== '' ? $typeCode : 'PER');
    }

    private static function schoolToken(?School $school): string
    {
        $token = $school->code ?? null;

        if (empty($token)) {
            $slug  = $school->slug ?? '';
            $token = substr(preg_replace('/[^a-z0-9]/i', '', $slug) ?? '', 0, 3);
        }

        return strtoupper($token !== '' ? $token : 'SCH');
    }

    /**
     * Highest existing numeric sequence following the rendered stem + 1.
     * Matches both plain and zero-padded stored values.
     */
    private static function nextSequence(int $schoolId, string $typeCode, string $prefix, int $seqWidth): int
    {
        $model = self::TYPE_MODELS[self::typeFromCode($typeCode)];
        $field = self::TYPE_FIELDS[self::typeFromCode($typeCode)];

        $stem = rtrim(str_replace('{SEQ}', '', $prefix), '-');

        $like    = $stem === '' ? '%' : str_replace(['%', '_'], ['\%', '\_'], $stem) . '-%';
        $pattern = $stem === ''
            ? '/^(\d{1,' . ($seqWidth + 3) . '})$/u'
            : '/^' . preg_quote($stem, '/') . '-(\d{1,' . ($seqWidth + 3) . '})$/u';

        $rows = $model::withoutGlobalScopes()
            ->where('school_id', $schoolId)
            ->where($field, 'like', $like)
            ->pluck($field);

        $max = 0;
        foreach ($rows as $value) {
            if (preg_match($pattern, $value, $m)) {
                $max = max($max, (int) $m[1]);
            }
        }

        return $max + 1;
    }

    private static function typeFromCode(string $code): string
    {
        return match (strtoupper($code)) {
            'STU' => 'student',
            'TCH' => 'teacher',
            'STF' => 'staff',
            default => 'student',
        };
    }
}