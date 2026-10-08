<?php

namespace App\Services;

/**
 * School-scoped Student ID (admission number) generation.
 *
 * Backwards-compatible facade over SchoolPersonIdService. The school owns its
 * student identifiers — a supplied student_id / admission_no is never
 * overwritten (generation only ever fills an EMPTY field). Generation can be
 * disabled per school via the `school_id_generation_enabled` setting.
 *
 * Format is configurable per school via the `student_id_format` school
 * setting. Supported tokens:
 *
 *   {YYYY}   four-digit year            2026
 *   {YY}     two-digit year             26
 *   {SCHOOL} school code, uppercased    SCH (from schools.code / slug)
 *   {TYPE}   person-type code           STU
 *   {SEQ:N}  per-school sequence, zero padded to N digits (default 4)
 *
 * Default format: ADM-{YYYY}-{SEQ:4} → ADM-2026-0001
 */
class StudentIdService
{
    public const DEFAULT_FORMAT = 'ADM-{YYYY}-{SEQ:4}';

    public static function formatFor(int $schoolId): string
    {
        return SchoolPersonIdService::formatFor($schoolId, 'student');
    }

    /** Preview of the NEXT id that would be generated (for UI hints). */
    public static function nextPreview(int $schoolId): string
    {
        return SchoolPersonIdService::nextPreview($schoolId, 'student');
    }

    /** Generate a guaranteed-unique student id for the school. */
    public static function generate(int $schoolId): string
    {
        return SchoolPersonIdService::generate($schoolId, 'student');
    }

    public static function generationEnabled(int $schoolId): bool
    {
        return SchoolPersonIdService::generationEnabled($schoolId);
    }
}