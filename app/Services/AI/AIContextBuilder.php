<?php

namespace App\Services\AI;

use App\Models\AcademicTerm;
use App\Models\Department;
use App\Models\School;
use App\Models\SchoolSetting;
use App\Models\SubjectOffering;
use App\Support\SierraLeoneEducation;

/**
 * Assembles the real, tenant-owned data a feature prompt may use. Nothing here
 * is fabricated; timetables, grades, fee balances and school-approval states
 * are deliberately forbidden as AI inputs (deterministic systems only).
 */
class AIContextBuilder
{
    /** Level aliases a school may have stored, mapped to canonical SL labels. */
    public const LEVEL_LABELS = [
        'early_childhood'  => 'Early Childhood Education',
        'nursery'          => 'Pre-Primary (Nursery)',
        'preprimary'       => 'Pre-Primary',
        'primary'          => 'Primary Education',
        'junior_secondary' => 'Junior Secondary School (JSS)',
        'senior_secondary' => 'Senior Secondary School (SSS)',
    ];

    public function homepage(School $school): array
    {
        $settings = SchoolSetting::allFor($school->id);

        return [
            'school' => [
                'name'             => $school->name,
                'short_name'       => $school->short_name,
                'motto'            => $school->motto,
                'tagline'          => $settings['tagline'] ?? null,
                'about_school'     => $school->about_school,
                'mission'          => $school->school_mission,
                'vision'           => $school->school_vision,
                'year_established'=> $school->year_established,
                'school_level'     => $school->school_level,
                'city'             => $school->city,
                'state'            => $school->state ?? $school->province,
                'country'          => $school->country ?: 'Sierra Leone',
                'phone'            => $school->phone,
                'email'            => $school->email,
                'address'          => $school->address ?? $school->postal_address,
                'website'          => $school->website,
                'primary_color'    => $school->primary_color,
            ],
            'level_labels' => $this->levelLabels($school),
            'departments'  => Department::query()
                ->where('school_id', $school->id)
                ->active()
                ->orderBy('name')
                ->limit(15)
                ->pluck('name')
                ->all(),
            'subjects'     => SubjectOffering::query()
                ->where('school_id', $school->id)
                ->where('is_active', true)
                ->distinct()
                ->pluck('subject_name')
                ->filter()
                ->unique()
                ->sort()
                ->take(40)
                ->values()
                ->all(),
            'academic_terms' => $this->academicTermNames($school),
        ];
    }

    public function announcement(School $school): array
    {
        return [
            'school_name' => $school->name,
            'academic_terms' => $this->academicTermNames($school),
        ];
    }

    public function lessonPlan(School $school): array
    {
        return [
            'school_name'     => $school->name,
            'academic_terms'  => $this->academicTermNames($school),
            'subjects'        => SubjectOffering::query()
                ->where('school_id', $school->id)
                ->where('is_active', true)
                ->pluck('subject_name')
                ->filter()
                ->unique()
                ->sort()
                ->take(60)
                ->values()
                ->all(),
        ];
    }

    private function levelLabels(School $school): array
    {
        $raw = is_array($school->school_level) ? $school->school_level : explode(',', (string) $school->school_level);

        $labels = [];
        foreach ($raw as $level) {
            $level = trim((string) $level);
            if ($level === '') {
                continue;
            }
            $labels[] = self::LEVEL_LABELS[$level]
                ?? SierraLeoneEducation::SCHOOL_LEVELS[$level]['label']
                ?? $level;
        }

        return array_values(array_unique(array_filter($labels)));
    }

    private function academicTermNames(School $school): array
    {
        return AcademicTerm::query()
            ->where('school_id', $school->id)
            ->where('is_current', true)
            ->orderBy('start_date')
            ->pluck('name')
            ->all();
    }
}