<?php

namespace Database\Seeders;

use App\Support\SierraLeoneEducation;
use App\Models\AcademicTerm;
use App\Models\AssessmentType;
use App\Models\Department;
use App\Models\GradeScale;
use App\Models\School;
use App\Models\SchoolSetting;
use Illuminate\Database\Seeder;

class SierraLeoneSetupSeeder extends Seeder
{
    public function run(): void
    {
        $schools = School::all();

        if ($schools->isEmpty()) {
            $this->command->info('No schools found — Sierra Leone setup skipped (schools get configured on registration).');
            return;
        }

        foreach ($schools as $school) {
            $sid = $school->id;

            $school->update([
                'country'         => 'SL',
                'timezone'        => 'Africa/Freetown',
                'currency'        => 'SLL',
                'currency_symbol' => 'Le',
            ]);

            foreach (SierraLeoneEducation::SSS_DEPARTMENTS as $dept) {
                Department::firstOrCreate(
                    ['school_id' => $sid, 'name' => $dept['name']],
                    [
                        'code'        => $dept['code'],
                        'description' => $dept['description'],
                        'type'        => 'academic',
                        'is_active'   => true,
                    ]
                );
            }

            GradeScale::where('school_id', $sid)->delete();
            foreach (SierraLeoneEducation::WASSCE_GRADE_SCALE as $i => $gs) {
                GradeScale::create([
                    'school_id'  => $sid,
                    'grade'      => $gs['grade'],
                    'gpa'        => $gs['gpa'],
                    'min_marks'  => $gs['min'],
                    'max_marks'  => $gs['max'],
                    'remarks'    => $gs['remark'],
                    'sort_order' => $i,
                ]);
            }

            AssessmentType::where('school_id', $sid)->delete();
            foreach (SierraLeoneEducation::DEFAULT_ASSESSMENT_TYPES as $i => $at) {
                AssessmentType::create([
                    'school_id'  => $sid,
                    'name'       => $at['name'],
                    'category'   => $at['category'],
                    'weight'     => $at['weight'],
                    'is_active'  => true,
                    'sort_order' => $i,
                ]);
            }

            $currentYear = $school->currentAcademicYear();
            if ($currentYear) {
                $termNames = [
                    ['name' => 'Term 1', 'start' => '2026-01-05', 'end' => '2026-04-10', 'mid_start' => '2026-02-23', 'mid_end' => '2026-02-27'],
                    ['name' => 'Term 2', 'start' => '2026-04-20', 'end' => '2026-07-17', 'mid_start' => '2026-06-01', 'mid_end' => '2026-06-05'],
                    ['name' => 'Term 3', 'start' => '2026-09-07', 'end' => '2026-12-18', 'mid_start' => '2026-10-26', 'mid_end' => '2026-10-30'],
                ];

                foreach ($termNames as $tn) {
                    AcademicTerm::firstOrCreate(
                        ['school_id' => $sid, 'academic_year_id' => $currentYear->id, 'name' => $tn['name']],
                        [
                            'start_date'     => $tn['start'],
                            'end_date'       => $tn['end'],
                            'mid_term_start' => $tn['mid_start'],
                            'mid_term_end'   => $tn['mid_end'],
                            'is_current'     => $tn['name'] === 'Term 1',
                        ]
                    );
                }
            }

            $settings = [
                'country_code'           => 'SL',
                'education_system'       => 'sierra_leone',
                'terms_per_year'         => '3',
                'ca_weight'              => (string) SierraLeoneEducation::DEFAULT_CA_WEIGHT,
                'exam_weight'            => (string) SierraLeoneEducation::DEFAULT_EXAM_WEIGHT,
                'grading_system'         => 'wassce',
                'pass_mark'              => '50',
                'enable_ece'             => '1',
                'enable_primary'         => '1',
                'enable_jss'             => '1',
                'enable_sss'             => '1',
                'national_exam_npse'     => '1',
                'national_exam_bece'     => '1',
                'national_exam_wassce'   => '1',
                'section_format'         => 'letter',
                'currency_display'       => 'symbol',
            ];

            foreach ($settings as $key => $value) {
                SchoolSetting::set($sid, $key, $value, 'sierra_leone');
            }

            $this->command->info("Sierra Leone setup completed for school: {$school->name}");
        }
    }
}
