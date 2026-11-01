<?php

namespace App\Support\Imports;

use App\Models\ImportJob;
use Illuminate\Support\Str;

/**
 * Canonical header name <-> accepted source-header aliases for bulk imports.
 *
 * The downloadable templates use canonical headers (e.g. class_name), but
 * schools often upload files exported from another system whose headers differ
 * ("Class", "Surname", "Sex"...). These aliases let those files import without
 * requiring the AI column-mapping feature. Aliases are keyed by the slugged
 * source header exactly as TabularReader resolves them.
 *
 * An AI-generated column mapping (import_options.column_mapping) is layered on
 * top so a reviewed suggestion actually takes effect during parsing.
 */
class HeaderAliases
{
    /** @var array<string, array<string, array<int, string>>> */
    private const MAPS = [
        'students' => [
            'student_id_no'    => ['student_id_no', 'studentid', 'student_id', 'admission_no', 'admissionnumber', 'admission_number', 'id_no'],
            'first_name'       => ['first_name', 'firstname', 'given_name', 'givenname', 'forename'],
            'last_name'        => ['last_name', 'lastname', 'surname', 'family_name', 'familyname'],
            'gender'           => ['gender', 'sex'],
            'date_of_birth'    => ['date_of_birth', 'dateofbirth', 'dob', 'birth_date', 'birthdate'],
            'class_name'       => ['class_name', 'classname', 'class', 'grade', 'class_level', 'classlevel'],
            'section_name'     => ['section_name', 'sectionname', 'section', 'stream', 'arm'],
            'phone'            => ['phone', 'phone_number', 'phonenumber', 'mobile', 'telephone', 'contact'],
            'email'            => ['email', 'email_address', 'emailaddress'],
            'parent_name'      => ['parent_name', 'parentname', 'guardian_name', 'guardianname', 'parent', 'guardian'],
            'parent_phone'     => ['parent_phone', 'parentphone', 'guardian_phone', 'guardianphone'],
            'parent_email'     => ['parent_email', 'parentemail', 'guardian_email', 'guardianemail'],
            'parent_occupation'=> ['parent_occupation', 'parentoccupation', 'occupation'],
            'parent_address'   => ['parent_address', 'parentaddress', 'address'],
        ],
        'staff' => [
            'emp_id'           => ['emp_id', 'empid', 'staff_id', 'staffid', 'employee_id', 'employeeid', 'id_no'],
            'first_name'       => ['first_name', 'firstname', 'given_name', 'givenname', 'forename'],
            'last_name'        => ['last_name', 'lastname', 'surname', 'family_name', 'familyname'],
            'gender'           => ['gender', 'sex'],
            'date_of_birth'    => ['date_of_birth', 'dateofbirth', 'dob', 'birth_date', 'birthdate'],
            'phone'            => ['phone', 'phone_number', 'phonenumber', 'mobile', 'telephone'],
            'email'            => ['email', 'email_address', 'emailaddress'],
            'department_name'  => ['department_name', 'departmentname', 'department', 'dept'],
            'designation_name' => ['designation_name', 'designationname', 'designation', 'position', 'title', 'role'],
            'teacher_type'     => ['teacher_type', 'teachertype', 'type'],
        ],
        'subjects' => [
            'class_name'       => ['class_name', 'classname', 'class', 'grade', 'class_level', 'classlevel'],
            'name'             => ['name', 'subject_name', 'subjectname', 'subject'],
            'code'             => ['code', 'subject_code', 'subjectcode'],
            'type'             => ['type', 'subject_type', 'subjecttype'],
            'full_marks'       => ['full_marks', 'fullmarks', 'max_marks', 'maxmarks', 'total_marks'],
            'pass_marks'       => ['pass_marks', 'passmarks', 'min_marks', 'minmarks'],
            'department_name'  => ['department_name', 'departmentname', 'department', 'dept'],
            'is_core'          => ['is_core', 'iscore', 'core', 'is_required', 'required'],
        ],
        'timetables' => [
            'academic_year'    => ['academic_year', 'academicyear', 'year', 'session'],
            'day'              => ['day', 'day_of_week', 'dayofweek', 'weekday'],
            'start_time'       => ['start_time', 'starttime', 'start', 'from', 'begin_time'],
            'end_time'         => ['end_time', 'endtime', 'end', 'to'],
            'class_name'       => ['class_name', 'classname', 'class', 'grade', 'class_level', 'classlevel'],
            'section_name'     => ['section_name', 'sectionname', 'section', 'stream', 'arm'],
            'subject_name'     => ['subject_name', 'subjectname', 'subject'],
            'teacher_name'     => ['teacher_name', 'teachername', 'teacher', 'staff_name', 'instructor'],
            'room'             => ['room', 'venue', 'location', 'room_no', 'roomnumber'],
            'lesson_type'      => ['lesson_type', 'lessontype', 'type'],
        ],
    ];

    /**
     * Merged alias map for a job: static aliases plus any reviewed AI mapping.
     *
     * @return array<string, string>
     */
    public static function forJob(ImportJob $job): array
    {
        return array_merge(
            self::forType((string) $job->import_type),
            self::fromAiMapping($job),
        );
    }

    /**
     * @return array<string, string>
     */
    public static function forType(string $type): array
    {
        $map = [];

        foreach (self::MAPS[$type] ?? [] as $canonical => $aliases) {
            foreach ($aliases as $alias) {
                $map[$alias] = $canonical;
            }
        }

        return $map;
    }

    /**
     * Convert a persisted AI column mapping into TabularReader aliases.
     *
     * @return array<string, string>
     */
    public static function fromAiMapping(ImportJob $job): array
    {
        $mappings = $job->import_options['column_mapping']['mappings'] ?? [];

        if (! is_array($mappings)) {
            return [];
        }

        $map = [];

        foreach ($mappings as $mapping) {
            if (! is_array($mapping)) {
                continue;
            }

            $source = $mapping['source_column'] ?? null;
            $target = $mapping['target_field'] ?? null;

            if (is_string($source) && $source !== '' && is_string($target) && $target !== '') {
                $map[Str::slug($source, '_')] = $target;
            }
        }

        return $map;
    }
}
