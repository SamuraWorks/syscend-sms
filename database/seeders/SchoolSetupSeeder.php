<?php

namespace Database\Seeders;

use App\Support\SierraLeoneEducation;
use App\Models\Department;
use App\Models\Holiday;
use App\Models\School;
use App\Models\SchoolClass;
use App\Models\Section;
use App\Models\Shift;
use App\Models\Subject;
use Illuminate\Database\Seeder;

class SchoolSetupSeeder extends Seeder
{
    public function run(): void
    {
        $school = School::where('slug', 'greenfield-academy')->firstOrFail();
        $sid    = $school->id;

        // Update school to Sierra Leone defaults
        $school->update([
            'country'         => 'SL',
            'timezone'        => 'Africa/Freetown',
            'currency'        => 'SLL',
            'currency_symbol' => 'Le',
        ]);

        // Get SSS departments (academic type)
        $sciDept = Department::firstOrCreate(
            ['school_id' => $sid, 'name' => 'Science'],
            ['code' => 'SCI', 'type' => 'academic', 'is_active' => true]
        );
        $artDept = Department::firstOrCreate(
            ['school_id' => $sid, 'name' => 'Arts'],
            ['code' => 'ART', 'type' => 'academic', 'is_active' => true]
        );
        $comDept = Department::firstOrCreate(
            ['school_id' => $sid, 'name' => 'Commercial'],
            ['code' => 'COM', 'type' => 'academic', 'is_active' => true]
        );

        // ── Sierra Leone School Classes ──────────────────────────────
        $classDefinitions = [];
        $order = 0;

        foreach (SierraLeoneEducation::SCHOOL_LEVELS as $levelKey => $level) {
            foreach ($level['classes'] as $className) {
                $order++;
                $classDefinitions[] = [
                    'name'         => $className,
                    'numeric_name' => $order,
                    'school_level' => $levelKey,
                    'level_order'  => $order,
                    'capacity'     => in_array($levelKey, ['early_childhood']) ? 35 : 45,
                    'department_id' => null,
                ];
            }
        }

        $classes = [];
        foreach ($classDefinitions as $row) {
            $classes[$row['numeric_name']] = SchoolClass::firstOrCreate(
                ['school_id' => $sid, 'name' => $row['name']],
                [
                    'numeric_name'  => $row['numeric_name'],
                    'school_level'  => $row['school_level'],
                    'level_order'   => $row['level_order'],
                    'capacity'      => $row['capacity'],
                    'department_id' => $row['department_id'],
                ]
            );
        }

        // Add departments to SSS classes
        $sssDeptMap = ['SSS 1' => $sciDept, 'SSS 2' => $sciDept, 'SSS 3' => $sciDept];
        foreach ($sssDeptMap as $className => $dept) {
            if (isset($classes[$className])) {
                $classes[$className]->update(['department_id' => $dept->id]);
            }
        }

        // ── Sections ──────────────────────────────────────────────────
        $sectionNames = ['A', 'B', 'C'];
        foreach ($classes as $num => $class) {
            foreach ($sectionNames as $name) {
                Section::firstOrCreate(
                    ['school_id' => $sid, 'class_id' => $class->id, 'name' => $name],
                    ['capacity' => (int) ($class->capacity / count($sectionNames))]
                );
            }
        }

        // ── Subjects (Sierra Leone curriculum) ────────────────────────
        $eceSubjects = [
            ['name' => 'Literacy',            'code' => 'LIT', 'type' => 'theory'],
            ['name' => 'Numeracy',            'code' => 'NUM', 'type' => 'theory'],
            ['name' => 'Creative Activities', 'code' => 'CRE', 'type' => 'practical'],
            ['name' => 'Social Studies',      'code' => 'SST', 'type' => 'theory'],
            ['name' => 'Physical Education',  'code' => 'PE',  'type' => 'practical'],
        ];

        $primarySubjects = [
            ['name' => 'English Language',    'code' => 'ENG', 'type' => 'theory'],
            ['name' => 'Mathematics',         'code' => 'MAT', 'type' => 'theory'],
            ['name' => 'Science',             'code' => 'SCI', 'type' => 'theory'],
            ['name' => 'Social Studies',      'code' => 'SST', 'type' => 'theory'],
            ['name' => 'Agric Science',       'code' => 'AGR', 'type' => 'theory'],
            ['name' => 'Religious Studies',   'code' => 'REL', 'type' => 'theory'],
            ['name' => 'Home Economics',      'code' => 'HEC', 'type' => 'practical'],
            ['name' => 'Physical Education',  'code' => 'PE',  'type' => 'practical'],
        ];

        $jssSubjects = [
            ['name' => 'English Language',    'code' => 'ENG', 'type' => 'theory'],
            ['name' => 'Mathematics',         'code' => 'MAT', 'type' => 'theory'],
            ['name' => 'Science',             'code' => 'SCI', 'type' => 'theory'],
            ['name' => 'Social Studies',      'code' => 'SST', 'type' => 'theory'],
            ['name' => 'Agric Science',       'code' => 'AGR', 'type' => 'theory'],
            ['name' => 'Religious Studies',   'code' => 'REL', 'type' => 'theory'],
            ['name' => 'French',              'code' => 'FRE', 'type' => 'theory'],
            ['name' => 'Computer Studies',    'code' => 'ICT', 'type' => 'practical'],
            ['name' => 'Physical Education',  'code' => 'PE',  'type' => 'practical'],
        ];

        $sssCoreSubjects = [
            ['name' => 'English Language',    'code' => 'ENG', 'type' => 'theory'],
            ['name' => 'Mathematics',         'code' => 'MAT', 'type' => 'theory'],
        ];

        $sssSciSubjects = [
            ['name' => 'Physics',    'code' => 'PHY', 'type' => 'theory'],
            ['name' => 'Chemistry',  'code' => 'CHE', 'type' => 'theory'],
            ['name' => 'Biology',    'code' => 'BIO', 'type' => 'theory'],
            ['name' => 'Agric Science', 'code' => 'AGR', 'type' => 'theory'],
        ];

        $sssArtSubjects = [
            ['name' => 'Literature in English', 'code' => 'LIT', 'type' => 'theory'],
            ['name' => 'Government',            'code' => 'GOV', 'type' => 'theory'],
            ['name' => 'History',               'code' => 'HIS', 'type' => 'theory'],
            ['name' => 'Geography',             'code' => 'GEO', 'type' => 'theory'],
        ];

        $sssComSubjects = [
            ['name' => 'Principles of Accounting', 'code' => 'ACC', 'type' => 'theory'],
            ['name' => 'Business Studies',          'code' => 'BUS', 'type' => 'theory'],
            ['name' => 'Economics',                 'code' => 'ECO', 'type' => 'theory'],
            ['name' => 'Commerce',                  'code' => 'CMR', 'type' => 'theory'],
        ];

        foreach ($classes as $num => $class) {
            $level = $class->school_level;

            $subjects = match($level) {
                'early_childhood'  => $eceSubjects,
                'primary'          => $primarySubjects,
                'junior_secondary' => $jssSubjects,
                default            => $sssCoreSubjects,
            };

            // For SSS, add department-specific subjects
            if ($level === 'senior_secondary') {
                $subjects = array_merge($subjects, $sssSciSubjects, $sssArtSubjects, $sssComSubjects);
            }

            foreach ($subjects as $sub) {
                Subject::firstOrCreate(
                    ['school_id' => $sid, 'class_id' => $class->id, 'name' => $sub['name']],
                    [
                        'code'        => $sub['code'],
                        'type'        => $sub['type'],
                        'full_marks'  => 100,
                        'pass_marks'  => 50,
                        'school_level' => $level,
                        'is_core'     => in_array($sub['name'], ['English Language', 'Mathematics']),
                    ]
                );
            }
        }

        // ── Shifts ────────────────────────────────────────────────────
        $shifts = [
            ['name' => 'Morning Shift', 'start_time' => '07:30', 'end_time' => '12:30'],
            ['name' => 'Day Shift',     'start_time' => '08:00', 'end_time' => '14:00'],
        ];
        foreach ($shifts as $shift) {
            Shift::firstOrCreate(['school_id' => $sid, 'name' => $shift['name']], $shift);
        }

        // ── Holidays (Sierra Leone) ──────────────────────────────────
        $holidays = [
            ['name' => 'New Year\'s Day',             'date' => '2026-01-01', 'description' => 'National holiday'],
            ['name' => 'International Women\'s Day',   'date' => '2026-03-08', 'description' => 'International holiday'],
            ['name' => 'National Independence Day',    'date' => '2026-04-27', 'description' => 'Republic Day / Independence Day'],
            ['name' => 'Good Friday',                  'date' => '2026-04-03', 'description' => 'Religious holiday'],
            ['name' => 'Easter Monday',                'date' => '2026-04-06', 'description' => 'Religious holiday'],
            ['name' => 'Eid-ul-Fitr',                  'date' => '2026-03-30', 'description' => 'Religious holiday'],
            ['name' => 'Eid-ul-Adha',                  'date' => '2026-06-07', 'description' => 'Religious holiday'],
            ['name' => 'Africa Day',                   'date' => '2026-05-25', 'description' => 'AU celebration day'],
            ['name' => 'Independence Day (observed)',   'date' => '2026-04-28', 'description' => 'Compensatory holiday'],
            ['name' => 'Christmas Day',                'date' => '2026-12-25', 'description' => 'Religious holiday'],
            ['name' => 'Boxing Day',                   'date' => '2026-12-26', 'description' => 'Religious holiday'],
        ];
        foreach ($holidays as $h) {
            Holiday::firstOrCreate(['school_id' => $sid, 'date' => $h['date']], $h);
        }

        $this->command->info('Sierra Leone school setup seeded: 16 classes across 4 levels, sections, subjects, holidays.');
    }
}
