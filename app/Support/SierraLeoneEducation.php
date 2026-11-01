<?php

namespace App\Support;

class SierraLeoneEducation
{
    public const SCHOOL_LEVELS = [
        'early_childhood'  => [
            'label'      => 'Early Childhood Education',
            'short_label' => 'ECE',
            'order'      => 1,
            'classes'    => ['Nursery 1', 'Nursery 2', 'Nursery 3'],
        ],
        'primary' => [
            'label'      => 'Primary Education',
            'short_label' => 'Primary',
            'order'      => 2,
            'classes'    => ['Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6'],
        ],
        'junior_secondary' => [
            'label'      => 'Junior Secondary School',
            'short_label' => 'JSS',
            'order'      => 3,
            'classes'    => ['JSS 1', 'JSS 2', 'JSS 3'],
        ],
        'senior_secondary' => [
            'label'      => 'Senior Secondary School',
            'short_label' => 'SSS',
            'order'      => 4,
            'classes'    => ['SSS 1', 'SSS 2', 'SSS 3'],
        ],
    ];

    public const SSS_DEPARTMENTS = [
        ['name' => 'Science',      'code' => 'SCI', 'description' => 'Science Department'],
        ['name' => 'Arts',         'code' => 'ART', 'description' => 'Arts Department'],
        ['name' => 'Commercial',   'code' => 'COM', 'description' => 'Commercial Department'],
        ['name' => 'Engineering',  'code' => 'ENG', 'description' => 'Engineering Department'],
    ];

    public const NATIONAL_EXAMINATIONS = [
        'npse'   => [
            'label'       => 'National Primary School Examination',
            'short_label' => 'NPSE',
            'level'       => 'primary',
            'class'       => 'Class 6',
            'description' => 'Conducted by NPPEB for primary school completers',
        ],
        'bece'   => [
            'label'       => 'Basic Education Certificate Examination',
            'short_label' => 'BECE',
            'level'       => 'junior_secondary',
            'class'       => 'JSS 3',
            'description' => 'Conducted by WAEC for junior secondary completers',
        ],
        'wassce' => [
            'label'       => 'West African Senior School Certificate Examination',
            'short_label' => 'WASSCE',
            'level'       => 'senior_secondary',
            'class'       => 'SSS 3',
            'description' => 'Conducted by WAEC for senior secondary completers',
        ],
    ];

    public const WASSCE_GRADE_SCALE = [
        ['grade' => 'A1', 'gpa' => 1.0, 'min' => 75, 'max' => 100, 'remark' => 'Excellent',        'interpretation' => 'Excellent'],
        ['grade' => 'B2', 'gpa' => 2.0, 'min' => 70, 'max' => 74,  'remark' => 'Very Good',        'interpretation' => 'Very Good'],
        ['grade' => 'B3', 'gpa' => 3.0, 'min' => 65, 'max' => 69,  'remark' => 'Good',             'interpretation' => 'Good'],
        ['grade' => 'C4', 'gpa' => 4.0, 'min' => 60, 'max' => 64,  'remark' => 'Credit',           'interpretation' => 'Credit'],
        ['grade' => 'C5', 'gpa' => 5.0, 'min' => 55, 'max' => 59,  'remark' => 'Credit',           'interpretation' => 'Credit'],
        ['grade' => 'C6', 'gpa' => 6.0, 'min' => 50, 'max' => 54,  'remark' => 'Credit',           'interpretation' => 'Credit'],
        ['grade' => 'D7', 'gpa' => 7.0, 'min' => 45, 'max' => 49,  'remark' => 'Pass',             'interpretation' => 'Pass'],
        ['grade' => 'E8', 'gpa' => 8.0, 'min' => 40, 'max' => 44,  'remark' => 'Pass',             'interpretation' => 'Pass'],
        ['grade' => 'F9', 'gpa' => 9.0, 'min' => 0,  'max' => 39,  'remark' => 'Fail',             'interpretation' => 'Fail'],
    ];

    public const NPSE_GRADE_SCALE = [
        ['grade' => 'A',  'min' => 75, 'max' => 100, 'remark' => 'Excellent'],
        ['grade' => 'B',  'min' => 65, 'max' => 74,  'remark' => 'Very Good'],
        ['grade' => 'C',  'min' => 55, 'max' => 64,  'remark' => 'Good'],
        ['grade' => 'D',  'min' => 45, 'max' => 54,  'remark' => 'Satisfactory'],
        ['grade' => 'E',  'min' => 35, 'max' => 44,  'remark' => 'Pass'],
        ['grade' => 'F',  'min' => 0,  'max' => 34,  'remark' => 'Fail'],
    ];

    public const CORE_SUBJECTS = [
        'early_childhood' => ['Literacy', 'Numeracy', 'Creative Activities', 'Social Studies'],
        'primary'         => ['English Language', 'Mathematics', 'Science', 'Social Studies', 'Agric Science', 'Religious Studies', 'Home Economics'],
        'junior_secondary' => ['English Language', 'Mathematics', 'Science', 'Social Studies', 'Agric Science', 'Religious Studies', 'French', 'Computer Studies'],
        'senior_secondary' => ['English Language', 'Mathematics'],
    ];

    public const DEFAULT_ATTENDANCE_STATUSES = [
        'present',
        'absent',
        'late',
        'excused',
        'half_day',
    ];

    public const DEFAULT_ASSESSMENT_TYPES = [
        // Continuous Assessment
        ['name' => 'Assignment',       'category' => 'continuous_assessment', 'weight' => 10.00],
        ['name' => 'Class Test 1',     'category' => 'continuous_assessment', 'weight' => 15.00],
        ['name' => 'Class Test 2',     'category' => 'continuous_assessment', 'weight' => 15.00],
        ['name' => 'Practical',        'category' => 'continuous_assessment', 'weight' => 10.00],
        // Summative Assessment
        ['name' => 'Mid-Term Exam',    'category' => 'summative',            'weight' => 25.00],
        ['name' => 'End-of-Term Exam', 'category' => 'summative',            'weight' => 25.00],
    ];

    public const DEFAULT_CA_WEIGHT = 40.00;
    public const DEFAULT_EXAM_WEIGHT = 60.00;

    public const CA_COMPONENTS = [
        ['slug' => 'assignment',  'label' => 'Assignment',    'category' => 'continuous_assessment', 'default_max' => 20, 'default_weight' => 10.00],
        ['slug' => 'class_test',  'label' => 'Class Test',    'category' => 'continuous_assessment', 'default_max' => 30, 'default_weight' => 15.00],
        ['slug' => 'practical',   'label' => 'Practical',     'category' => 'continuous_assessment', 'default_max' => 20, 'default_weight' => 10.00],
        ['slug' => 'project',     'label' => 'Project',       'category' => 'continuous_assessment', 'default_max' => 30, 'default_weight' => 5.00],
    ];

    public const ATTENDANCE_SESSIONS = [
        ['name' => 'Morning Session',  'slug' => 'morning',   'start_time' => '08:00', 'end_time' => '12:00', 'sort_order' => 1],
        ['name' => 'Afternoon Session', 'slug' => 'afternoon', 'start_time' => '13:00', 'end_time' => '16:00', 'sort_order' => 2],
    ];

    public const ASSESSMENT_MODELS = [
        'ca_test_final' => [
            'label'       => 'CA + Test + Final Exam',
            'description' => 'Continuous Assessment + Class Test + Final Examination',
            'components'  => ['ca', 'class_test', 'final_exam'],
        ],
        'ca_final' => [
            'label'       => 'CA + Final Exam',
            'description' => 'Continuous Assessment + Final Examination',
            'components'  => ['ca', 'final_exam'],
        ],
        'test_final' => [
            'label'       => 'Test + Final Exam',
            'description' => 'Class Test + Final Examination',
            'components'  => ['class_test', 'final_exam'],
        ],
        'final_only' => [
            'label'       => 'Final Exam Only',
            'description' => 'Final Examination only',
            'components'  => ['final_exam'],
        ],
        'custom' => [
            'label'       => 'Custom',
            'description' => 'Custom assessment model',
            'components'  => [],
        ],
    ];

    public const SCHOOL_TERMS = [
        ['name' => 'Term 1', 'order' => 1],
        ['name' => 'Term 2', 'order' => 2],
        ['name' => 'Term 3', 'order' => 3],
    ];

    public const FEE_CATEGORIES = [
        ['name' => 'Tuition Fees',       'type' => 'tuition',     'description' => 'Academic tuition fees'],
        ['name' => 'Development Fees',    'type' => 'other',       'description' => 'School development levy'],
        ['name' => 'Examination Fees',    'type' => 'exam',        'description' => 'Internal and external exam fees'],
        ['name' => 'Uniform Fees',        'type' => 'other',       'description' => 'School uniform fees'],
        ['name' => 'Transport Fees',      'type' => 'transport',   'description' => 'School bus/transport fees'],
        ['name' => 'Library Fees',        'type' => 'library',     'description' => 'Library membership and usage'],
        ['name' => 'Science Lab Fees',    'type' => 'other',       'description' => 'Science laboratory fees'],
        ['name' => 'ICT Fees',            'type' => 'other',       'description' => 'Computer/ICT lab fees'],
        ['name' => 'Sports Fees',         'type' => 'sports',      'description' => 'Sports and physical education'],
        ['name' => 'PTA Levies',          'type' => 'other',       'description' => 'Parent-Teacher Association levies'],
    ];

    public static function getLevelOrder(string $level): int
    {
        return self::SCHOOL_LEVELS[$level]['order'] ?? 0;
    }

    public static function getClassNamesForLevel(string $level): array
    {
        return self::SCHOOL_LEVELS[$level]['classes'] ?? [];
    }

    public static function getGradeForScore(string $examType, float $score): ?array
    {
        $scale = match($examType) {
            'wassce' => self::WASSCE_GRADE_SCALE,
            'npse'   => self::NPSE_GRADE_SCALE,
            default  => self::WASSCE_GRADE_SCALE,
        };

        foreach ($scale as $grade) {
            if ($score >= $grade['min'] && $score <= $grade['max']) {
                return $grade;
            }
        }

        return end($scale);
    }
}
