<?php

namespace App\Support\Imports;

/**
 * Single source of truth for the bulk-import column contracts.
 *
 * Both the downloadable XLSX templates (ImportController) and the AI column
 * mapper (ImportColumnMapper) read the field definitions from here so a change
 * to an import's expected columns can never drift between them.
 */
class ImportTemplateRegistry
{
    public const TYPES = ['students', 'parents', 'staff', 'subjects', 'curriculum', 'timetables'];

    public static function supports(string $type): bool
    {
        return in_array($type, self::TYPES, true);
    }

    /**
     * The expected columns for an import type.
     *
     * @return array<int, array{name: string, required: bool, valid?: string, description: string, example: string}>
     */
    public static function fields(string $type): array
    {
        return self::instructions($type)['columns'] ?? [];
    }

    /**
     * @return array<int, string>
     */
    public static function headers(string $type): array
    {
        return self::instructions($type)['headers'] ?? [];
    }

    /**
     * @return array{description: string, rules: array<int, string>, headers: array<int, string>, columns: array<int, array<string, mixed>>}
     */
    public static function instructions(string $type): array
    {
        return match ($type) {
            'students'   => self::studentInstructions(),
            'staff'      => self::staffInstructions(),
            'parents'    => self::parentInstructions(),
            'subjects'   => self::subjectInstructions(),
            'curriculum' => self::curriculumInstructions(),
            'timetables' => self::timetableInstructions(),
            default      => throw new \InvalidArgumentException("Unknown import type [{$type}]."),
        };
    }

    /**
     * @return array<int, array<int, string>>
     */
    public static function samples(string $type): array
    {
        return match ($type) {
            'students'   => self::studentSamples(),
            'staff'      => self::staffSamples(),
            'parents'    => self::parentSamples(),
            'subjects'   => self::subjectSamples(),
            'curriculum' => self::curriculumSamples(),
            'timetables' => self::timetableSamples(),
            default      => throw new \InvalidArgumentException("Unknown import type [{$type}]."),
        };
    }

    private static function subjectInstructions(): array
    {
        return [
            'description' => 'Fill in the Sample Data sheet with your subjects. Each row creates one subject for a class. Classes and departments must already exist in the system.',
            'rules' => [
                'class_name and name are REQUIRED.',
                'class_name must match an existing class in your school exactly (case-insensitive).',
                'type must be either "theory" or "practical" (lowercase). Default: theory.',
                'code is optional but must be unique within your school if provided.',
                'department_name is optional and only allowed for Senior Secondary (SSS) classes.',
                'full_marks and pass_marks are optional whole numbers.',
                'is_core must be "yes" or "no". Default: yes.',
                'A subject is also added to the current curriculum automatically.',
            ],
            'headers' => ['class_name', 'name', 'code', 'type', 'full_marks', 'pass_marks', 'department_name', 'is_core'],
            'columns' => [
                ['name' => 'class_name',       'required' => true,  'valid' => 'Must match existing class',  'description' => 'Class the subject belongs to. Must exist in the system.',            'example' => 'JSS 1'],
                ['name' => 'name',             'required' => true,  'valid' => 'Text',                       'description' => 'Subject name.',                                                      'example' => 'Mathematics'],
                ['name' => 'code',            'required' => false, 'valid' => 'Any unique text',            'description' => 'Subject code. Must not duplicate an existing code in your school.',  'example' => 'MATH'],
                ['name' => 'type',            'required' => false, 'valid' => 'theory OR practical',        'description' => 'Type of subject. Default: theory.',                                  'example' => 'theory'],
                ['name' => 'full_marks',       'required' => false, 'valid' => 'Whole number',               'description' => 'Maximum marks for the subject.',                                     'example' => '100'],
                ['name' => 'pass_marks',       'required' => false, 'valid' => 'Whole number',               'description' => 'Minimum marks required to pass.',                                    'example' => '33'],
                ['name' => 'department_name',  'required' => false, 'valid' => 'Must match existing dept',   'description' => 'Department (only for Senior Secondary / SSS subjects).',            'example' => 'Science'],
                ['name' => 'is_core',          'required' => false, 'valid' => 'yes OR no',                  'description' => 'Whether the subject is a core subject. Default: yes.',              'example' => 'yes'],
            ],
        ];
    }

    private static function subjectSamples(): array
    {
        return [
            ['JSS 1', 'Mathematics', 'MATH', 'theory', '100', '33', '', 'yes'],
            ['JSS 1', 'Basic Science', 'BSCI', 'theory', '100', '33', '', 'yes'],
            ['JSS 2', 'Agricultural Science', 'AGRI', 'practical', '100', '40', '', 'no'],
            ['SSS 1', 'Physics', 'PHY', 'theory', '100', '40', 'Science', 'yes'],
            ['JSS 1', 'French', '', 'theory', '', '', '', 'no'],
        ];
    }

    private static function studentInstructions(): array
    {
        return [
            'description' => 'Fill in the Sample Data sheet with your student data. Then save the file and upload it. Classes and sections must already exist in the system.',
            'rules' => [
                'first_name, last_name, gender, and class_name are REQUIRED.',
                'gender must be exactly "male" or "female" (lowercase, no extra spaces).',
                'class_name must match an existing class in your school exactly (case-insensitive).',
                'section_name is optional but must match an existing section for that class.',
                'student_id_no is auto-generated if left blank.',
                'parent info is optional. If parent_name is provided, a parent account is created and linked.',
                'date_of_birth must be in YYYY-MM-DD format (e.g. 2010-05-15).',
                'email must be a valid email address if provided.',
            ],
            'headers' => ['student_id_no', 'first_name', 'last_name', 'gender', 'date_of_birth', 'class_name', 'section_name', 'phone', 'email', 'parent_name', 'parent_phone', 'parent_email', 'parent_occupation', 'parent_address'],
            'columns' => [
                ['name' => 'student_id_no',      'required' => false, 'valid' => 'Any unique text',            'description' => 'Unique student ID. Leave blank to auto-generate.',                    'example' => 'STU001'],
                ['name' => 'first_name',          'required' => true,  'valid' => 'Text',                       'description' => 'Student first name.',                                                  'example' => 'John'],
                ['name' => 'last_name',           'required' => true,  'valid' => 'Text',                       'description' => 'Student last name / surname.',                                         'example' => 'Kamara'],
                ['name' => 'gender',              'required' => true,  'valid' => 'male OR female',             'description' => 'Must be exactly "male" or "female" (lowercase).',                      'example' => 'male'],
                ['name' => 'date_of_birth',       'required' => false, 'valid' => 'YYYY-MM-DD',                'description' => 'Date of birth. Example: 15 May 2010 = 2010-05-15.',                    'example' => '2010-05-15'],
                ['name' => 'class_name',          'required' => true,  'valid' => 'Must match existing class',  'description' => 'Must exactly match a class name in the system (case-insensitive).',     'example' => 'JSS 1'],
                ['name' => 'section_name',        'required' => false, 'valid' => 'Must match existing section','description' => 'Section/stream within the class. Must exist for that class.',           'example' => 'A'],
                ['name' => 'phone',               'required' => false, 'valid' => 'Phone number',              'description' => 'Student phone number.',                                                'example' => '+23276123456'],
                ['name' => 'email',               'required' => false, 'valid' => 'Valid email address',        'description' => 'Student email address.',                                               'example' => ''],
                ['name' => 'parent_name',         'required' => false, 'valid' => 'Text',                      'description' => 'Parent/guardian full name. If provided, a parent account is created.',  'example' => 'Mary Kamara'],
                ['name' => 'parent_phone',        'required' => false, 'valid' => 'Phone number',              'description' => 'Parent phone number.',                                                 'example' => '+23276123457'],
                ['name' => 'parent_email',        'required' => false, 'valid' => 'Valid email address',        'description' => 'Parent email address.',                                                'example' => ''],
                ['name' => 'parent_occupation',   'required' => false, 'valid' => 'Text',                      'description' => 'Parent occupation.',                                                   'example' => 'Teacher'],
                ['name' => 'parent_address',      'required' => false, 'valid' => 'Text',                      'description' => 'Parent address.',                                                      'example' => 'Freetown'],
            ],
        ];
    }

    private static function studentSamples(): array
    {
        return [
            ['STU001', 'John', 'Kamara', 'male', '2010-05-15', 'JSS 1', 'A', '+23276123456', '', 'Mary Kamara', '+23276123457', '', 'Teacher', 'Freetown'],
            ['STU002', 'Fatima', 'Bangura', 'female', '2011-08-22', 'JSS 1', 'A', '+23276123458', 'fatima@example.com', 'Ibrahim Bangura', '+23276123459', 'ibrahim@example.com', 'Engineer', 'Bo'],
            ['STU003', 'Ibrahim', 'Sesay', 'male', '2009-01-10', 'JSS 2', 'B', '', '', '', '', '', '', ''],
            ['', 'Aisha', 'Mansaray', 'female', '2012-03-05', 'JSS 1', '', '+23276123460', '', 'Fatima Mansaray', '+23276123461', '', 'Nurse', 'Freetown'],
        ];
    }

    private static function staffInstructions(): array
    {
        return [
            'description' => 'Fill in the Sample Data sheet with your staff data. Departments and designations must already exist in the system.',
            'rules' => [
                'emp_id, first_name, last_name, and gender are REQUIRED.',
                'gender must be exactly "male" or "female" (lowercase).',
                'teacher_type must be one of: subject_teacher, form_master, both, non_teaching (lowercase with underscores).',
                'department_name and designation_name are optional but must match existing records if provided.',
                'email must be valid if provided.',
            ],
            'headers' => ['emp_id', 'first_name', 'last_name', 'gender', 'date_of_birth', 'phone', 'email', 'department_name', 'designation_name', 'teacher_type'],
            'columns' => [
                ['name' => 'emp_id',            'required' => true,  'valid' => 'Any unique text',            'description' => 'Unique staff ID.',                                                     'example' => 'TCH001'],
                ['name' => 'first_name',         'required' => true,  'valid' => 'Text',                       'description' => 'Staff first name.',                                                   'example' => 'Sarah'],
                ['name' => 'last_name',          'required' => true,  'valid' => 'Text',                       'description' => 'Staff last name / surname.',                                          'example' => 'Conteh'],
                ['name' => 'gender',            'required' => true,  'valid' => 'male OR female',             'description' => 'Must be exactly "male" or "female" (lowercase).',                      'example' => 'female'],
                ['name' => 'date_of_birth',     'required' => false, 'valid' => 'YYYY-MM-DD',                'description' => 'Date of birth.',                                                      'example' => '1990-03-20'],
                ['name' => 'phone',             'required' => false, 'valid' => 'Phone number',              'description' => 'Phone number.',                                                       'example' => '+23276123458'],
                ['name' => 'email',             'required' => false, 'valid' => 'Valid email address',        'description' => 'Email address.',                                                      'example' => ''],
                ['name' => 'department_name',   'required' => false, 'valid' => 'Must match existing dept',   'description' => 'Department name. Must exist in the system.',                            'example' => 'Mathematics'],
                ['name' => 'designation_name',  'required' => false, 'valid' => 'Must match existing desig',  'description' => 'Designation/title. Must exist in the system.',                          'example' => 'Senior Teacher'],
                ['name' => 'teacher_type',      'required' => false, 'valid' => 'subject_teacher, form_master, both, or non_teaching', 'description' => 'Type of teacher. Default: non_teaching.',             'example' => 'subject_teacher'],
            ],
        ];
    }

    private static function staffSamples(): array
    {
        return [
            ['TCH001', 'Sarah', 'Conteh', 'female', '1990-03-20', '+23276123458', '', 'Mathematics', 'Senior Teacher', 'subject_teacher'],
            ['TCH002', 'James', 'Koroma', 'male', '1985-07-11', '+23276123459', 'james@example.com', 'English', 'Form Master', 'form_master'],
            ['TCH003', 'Grace', 'Williams', 'female', '1992-11-01', '', '', 'Science', 'Lab Technician', 'non_teaching'],
            ['TCH004', 'Mohamed', 'Turay', 'male', '1988-05-30', '+23276123460', '', 'Mathematics', 'Head of Department', 'both'],
        ];
    }

    private static function parentInstructions(): array
    {
        return [
            'description' => 'Fill in the Sample Data sheet with parent/guardian data. Each row links one parent to one student. Parents are never duplicated: rows with the same email or phone are merged into one parent record.',
            'rules' => [
                'Student ID, Parent Full Name, Relationship, Email, and Phone are REQUIRED.',
                'Student ID accepts the student\'s Student ID or Admission Number (must already exist in this school).',
                'Relationship must be exactly one of: father, mother, guardian, uncle, aunt, sibling, other (lowercase).',
                'Email must be a valid email address.',
                'Primary Contact is optional: use "email" or "phone" to indicate the preferred contact method (default: email).',
                'If the same parent (same email or phone) appears on multiple rows, they are reused — never duplicated. All children get linked to the same parent record.',
                'Duplicate links (same parent + same child + same relationship) are skipped with a reason.',
                'Rows with errors do not block other rows. A row-level error report is shown after validation.',
                'Importing parents does NOT create portal accounts. Parents register themselves via the registration page using their email and phone.',
            ],
            'headers' => ['student_id', 'parent_full_name', 'relationship', 'email', 'phone', 'alt_phone', 'address', 'primary_contact'],
            'columns' => [
                ['name' => 'student_id',       'required' => true,  'valid' => 'Existing Student ID or Admission Number', 'description' => 'The child this parent should be linked to.',   'example' => 'STU001'],
                ['name' => 'parent_full_name', 'required' => true,  'valid' => 'Text',                                    'description' => 'Full name of the parent/guardian.',            'example' => 'Mary Kamara'],
                ['name' => 'relationship',     'required' => true,  'valid' => 'father, mother, guardian, uncle, aunt, sibling, other', 'description' => 'Relationship to the student.',   'example' => 'mother'],
                ['name' => 'email',            'required' => true,  'valid' => 'Valid email address',                     'description' => 'Parent email address. Used for identity matching and portal registration.', 'example' => 'mary@example.com'],
                ['name' => 'phone',            'required' => true,  'valid' => 'Phone number',                            'description' => 'Parent phone number. Used for identity matching.', 'example' => '+23276123456'],
                ['name' => 'alt_phone',        'required' => false, 'valid' => 'Phone number',                            'description' => 'Alternative phone number.',                    'example' => '+23276123457'],
                ['name' => 'address',          'required' => false, 'valid' => 'Text',                                    'description' => 'Home address.',                                'example' => 'Freetown'],
                ['name' => 'primary_contact',  'required' => false, 'valid' => 'email or phone',                          'description' => 'Preferred contact method. Default: email.',    'example' => 'phone'],
            ],
        ];
    }

    private static function parentSamples(): array
    {
        return [
            ['STU001', 'Mary Kamara', 'mother', 'mary.kamara@example.com', '+23276123456', '', '15 Beach Road, Freetown', 'phone'],
            ['STU002', 'Ibrahim Bangura', 'father', 'ibrahim.bangura@example.com', '+23276123459', '+23276123460', '12 Kissy Road, Freetown', 'email'],
            ['STU001', 'Ibrahim Bangura', 'father', 'ibrahim.bangura@example.com', '+23276123459', '', '', ''],
            ['STU003', 'Fatima Mansaray', 'guardian', 'fatima.mansaray@example.com', '+23276123461', '', 'Bo Town, Bo', 'phone'],
            ['STU004', 'Hassan Kamara', 'uncle', 'hassan.kamara@example.com', '+23276123462', '', 'Makeni', 'email'],
        ];
    }

    private static function curriculumInstructions(): array
    {
        return [
            'description' => 'Fill in the Sample Data sheet with your curriculum/subject offerings. Academic years, classes, sections, and departments must already exist.',
            'rules' => [
                'academic_year, class_name, subject_code, and subject_type are REQUIRED.',
                'class_name must match an existing class in the system (case-insensitive).',
                'subject_type must be exactly one of: compulsory, elective, selective (lowercase).',
                'stream must match an existing section for the given class.',
                'department must match an existing department if provided.',
                'is_required must be "yes" or "no" (default: yes).',
                'min_selection and max_selection must be numbers. max must be >= min.',
                'Each subject_code must be unique within the same class/stream/year.',
            ],
            'headers' => ['academic_year', 'level', 'class_name', 'stream', 'department', 'subject_code', 'subject_name', 'subject_type', 'selection_group', 'is_required', 'min_selection', 'max_selection'],
            'columns' => [
                ['name' => 'academic_year',    'required' => true,  'valid' => 'Must match existing year',  'description' => 'Academic year name (must exist in the system).',                         'example' => '2026'],
                ['name' => 'level',            'required' => false, 'valid' => 'Text',                      'description' => 'School level (e.g. junior, senior).',                                   'example' => 'junior'],
                ['name' => 'class_name',       'required' => true,  'valid' => 'Must match existing class', 'description' => 'Class name exactly as in the system (case-insensitive).',                  'example' => 'JSS 1'],
                ['name' => 'stream',           'required' => false, 'valid' => 'Must match existing section','description' => 'Section/stream within the class. Must exist.',                            'example' => 'A'],
                ['name' => 'department',       'required' => false, 'valid' => 'Must match existing dept',  'description' => 'Department name. Must exist in the system.',                              'example' => 'Mathematics'],
                ['name' => 'subject_code',     'required' => true,  'valid' => 'Any unique code',           'description' => 'Unique code for the subject (unique per class/stream/year).',             'example' => 'ENG01'],
                ['name' => 'subject_name',     'required' => false, 'valid' => 'Text',                      'description' => 'Full subject name.',                                                    'example' => 'English Language'],
                ['name' => 'subject_type',     'required' => true,  'valid' => 'compulsory, elective, or selective', 'description' => 'Whether the subject is compulsory, elective, or selective.',   'example' => 'compulsory'],
                ['name' => 'selection_group',  'required' => false, 'valid' => 'Text',                      'description' => 'Group name for elective selection constraints.',                         'example' => ''],
                ['name' => 'is_required',      'required' => false, 'valid' => 'yes or no',                 'description' => 'Is this subject required? Default: yes.',                                'example' => 'yes'],
                ['name' => 'min_selection',    'required' => false, 'valid' => 'Number >= 0',               'description' => 'Minimum subjects to select from this group. Default: 1.',                 'example' => '1'],
                ['name' => 'max_selection',    'required' => false, 'valid' => 'Number >= min_selection',   'description' => 'Maximum subjects to select from this group. Default: 1.',                 'example' => '1'],
            ],
        ];
    }

    private static function curriculumSamples(): array
    {
        return [
            ['2026', 'junior', 'JSS 1', 'A', '', 'ENG01', 'English Language', 'compulsory', '', 'yes', '1', '1'],
            ['2026', 'junior', 'JSS 1', 'A', 'Mathematics', 'MTH01', 'Mathematics', 'compulsory', '', 'yes', '1', '1'],
            ['2026', 'junior', 'JSS 1', 'A', 'Science', 'SCI01', 'Basic Science', 'compulsory', '', 'yes', '1', '1'],
            ['2026', 'junior', 'JSS 1', 'A', '', 'ART01', 'Fine Art', 'elective', 'arts_group', 'no', '2', '3'],
            ['2026', 'junior', 'JSS 1', 'A', '', 'MUS01', 'Music', 'elective', 'arts_group', 'no', '2', '3'],
            ['2026', 'junior', 'JSS 2', 'B', 'English', 'ENG02', 'English Language II', 'compulsory', '', 'yes', '1', '1'],
        ];
    }

    private static function timetableInstructions(): array
    {
        return [
            'description' => 'Fill in the Sample Data sheet with your timetable data. Classes, subjects, and teachers must already exist in the system.',
            'rules' => [
                'day, start_time, end_time, class_name, and subject_name are REQUIRED.',
                'day must be exactly one of: monday, tuesday, wednesday, thursday, friday, saturday, sunday (lowercase).',
                'start_time and end_time must be in HH:MM format (24-hour clock, e.g. 07:30, 14:15).',
                'class_name must match an existing class (case-insensitive).',
                'subject_name must match an existing subject for that class.',
                'teacher_name must be "FirstName LastName" matching an existing staff member.',
                'section_name is optional but must match an existing section for the class.',
            ],
            'headers' => ['academic_year', 'day', 'start_time', 'end_time', 'class_name', 'section_name', 'subject_name', 'teacher_name', 'room', 'lesson_type'],
            'columns' => [
                ['name' => 'academic_year',  'required' => false, 'valid' => 'Must match existing year',     'description' => 'Academic year name (must exist in the system).',                  'example' => '2026'],
                ['name' => 'day',            'required' => true,  'valid' => 'monday, tuesday, ..., sunday', 'description' => 'Day of the week (lowercase, no abbreviations).',                'example' => 'monday'],
                ['name' => 'start_time',     'required' => true,  'valid' => 'HH:MM (24h format)',          'description' => 'Lesson start time in 24-hour format.',                         'example' => '07:30'],
                ['name' => 'end_time',       'required' => true,  'valid' => 'HH:MM (24h format)',          'description' => 'Lesson end time in 24-hour format.',                           'example' => '08:15'],
                ['name' => 'class_name',     'required' => true,  'valid' => 'Must match existing class',   'description' => 'Class name exactly as in the system.',                          'example' => 'JSS 1'],
                ['name' => 'section_name',   'required' => false, 'valid' => 'Must match existing section', 'description' => 'Section/stream within the class.',                              'example' => 'A'],
                ['name' => 'subject_name',   'required' => true,  'valid' => 'Must match existing subject', 'description' => 'Subject name as in the system (must belong to the class).',     'example' => 'English Language'],
                ['name' => 'teacher_name',   'required' => false, 'valid' => 'FirstName LastName',           'description' => 'Teacher full name. Must match existing staff (first + last).', 'example' => 'John Kamara'],
                ['name' => 'room',           'required' => false, 'valid' => 'Text',                        'description' => 'Room or location identifier.',                                'example' => 'Room 101'],
                ['name' => 'lesson_type',    'required' => false, 'valid' => 'Text',                        'description' => 'Type of lesson (e.g. lecture, lab, practical).',              'example' => ''],
            ],
        ];
    }

    private static function timetableSamples(): array
    {
        return [
            ['2026', 'monday', '07:30', '08:15', 'JSS 1', 'A', 'English Language', 'John Kamara', 'Room 101', ''],
            ['2026', 'monday', '08:20', '09:05', 'JSS 1', 'A', 'Mathematics', 'Sarah Conteh', 'Room 101', ''],
            ['2026', 'monday', '09:10', '09:55', 'JSS 1', 'A', 'Basic Science', 'Grace Williams', 'Lab 1', 'practical'],
            ['2026', 'monday', '07:30', '08:15', 'JSS 2', 'B', 'English Language', 'John Kamara', 'Room 102', ''],
            ['2026', 'tuesday', '07:30', '08:15', 'JSS 1', 'A', 'Mathematics', 'Sarah Conteh', 'Room 101', ''],
            ['2026', 'tuesday', '08:20', '09:05', 'JSS 1', 'B', 'English Language', 'James Koroma', 'Room 103', ''],
        ];
    }
}
