<?php

namespace App\Http\Controllers\SchoolAdmin;

use App\Http\Controllers\Controller;
use App\Models\AcademicTerm;
use App\Models\AcademicYear;
use App\Models\AssessmentType;
use App\Models\Department;
use App\Models\Designation;
use App\Models\GradeScale;
use App\Models\School;
use App\Models\SchoolAssessmentConfig;
use App\Models\SchoolClass;
use App\Models\Section;
use App\Models\Staff;
use App\Models\Subject;
use App\Models\Timetable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SchoolSetupController extends Controller
{
    /**
     * GET /school/school-setup
     */
    public function index(): Response
    {
        return Inertia::render('SchoolAdmin/SchoolSetup/Index');
    }
    /**
     * Ordered setup steps. Each step has:
     *  - id: unique key
     *  - label / description / icon
     *  - href: link to the config page
     *  - required: if true, must be completed before progressing
     *  - check: closure returning bool (is this step done?)
     */
    private function getSteps(): array
    {
        $schoolId = $this->getSchoolId();
        $school   = School::withoutGlobalScopes()->find($schoolId);

        return [
            [
                'id'          => 'school_identity',
                'label'       => 'School Identity',
                'description' => 'School name, type, level, motto, contact details, logo',
                'href'        => '/school/school-identity',
                'icon'        => 'Fingerprint',
                'color'       => 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400',
                'required'    => true,
                'completed'   => $school && $school->name && $school->school_type && $school->school_level,
            ],
            [
                'id'          => 'academic_year',
                'label'       => 'Academic Year & Terms',
                'description' => 'Create an academic year and at least one term with dates',
                'href'        => '/school/academic-terms',
                'icon'        => 'CalendarDays',
                'color'       => 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400',
                'required'    => true,
                'completed'   => AcademicYear::where('school_id', $schoolId)->where('is_current', true)->exists()
                    && AcademicTerm::where('school_id', $schoolId)->where('is_current', true)->exists(),
            ],
            [
                'id'          => 'classes',
                'label'       => 'Classes',
                'description' => 'Define classes with levels, capacity, and class teachers',
                'href'        => '/school/classes',
                'icon'        => 'GraduationCap',
                'color'       => 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400',
                'required'    => true,
                'completed'   => SchoolClass::where('school_id', $schoolId)->exists(),
            ],
            [
                'id'          => 'subjects',
                'label'       => 'Subjects',
                'description' => 'Add subjects, assign codes and link to classes',
                'href'        => '/school/subjects',
                'icon'        => 'BookOpen',
                'color'       => 'bg-cyan-50 text-cyan-600 dark:bg-cyan-950/40 dark:text-cyan-400',
                'required'    => true,
                'completed'   => Subject::where('school_id', $schoolId)->exists(),
            ],
            [
                'id'          => 'teachers',
                'label'       => 'Teachers & Staff',
                'description' => 'Add staff members and assign teacher roles',
                'href'        => '/school/staff',
                'icon'        => 'Users',
                'color'       => 'bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400',
                'required'    => true,
                'completed'   => Staff::where('school_id', $schoolId)->whereNotNull('teacher_type')
                    ->where('teacher_type', '!=', 'non_teaching')->exists(),
            ],
            [
                'id'          => 'grade_scales',
                'label'       => 'Grade Scales',
                'description' => 'Configure grading system, marks range and GPA mapping',
                'href'        => '/school/grade-scales',
                'icon'        => 'BarChart3',
                'color'       => 'bg-lime-50 text-lime-600 dark:bg-lime-950/40 dark:text-lime-400',
                'required'    => true,
                'completed'   => GradeScale::where('school_id', $schoolId)->exists(),
            ],
            [
                'id'          => 'assessment_config',
                'label'       => 'Assessment Config',
                'description' => 'Set coursework vs examination weight percentages',
                'href'        => '/school/assessment-config',
                'icon'        => 'Settings',
                'color'       => 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400',
                'required'    => true,
                'completed'   => AssessmentType::where('school_id', $schoolId)->where('is_active', true)->exists(),
            ],
            // ── Optional steps below ──
            [
                'id'          => 'sections',
                'label'       => 'Sections',
                'description' => 'Split classes into sections (A, B, C) with form masters',
                'href'        => '/school/sections',
                'icon'        => 'Layers',
                'color'       => 'bg-teal-50 text-teal-600 dark:bg-teal-950/40 dark:text-teal-400',
                'required'    => false,
                'completed'   => Section::where('school_id', $schoolId)->exists(),
            ],
            [
                'id'          => 'departments',
                'label'       => 'Departments',
                'description' => 'Organize staff and subjects into departments',
                'href'        => '/school/departments',
                'icon'        => 'Building2',
                'color'       => 'bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400',
                'required'    => false,
                'completed'   => Department::where('school_id', $schoolId)->exists(),
            ],
            [
                'id'          => 'designations',
                'label'       => 'Designations',
                'description' => 'Staff roles and designation levels',
                'href'        => '/school/designations',
                'icon'        => 'BadgeCheck',
                'color'       => 'bg-pink-50 text-pink-600 dark:bg-pink-950/40 dark:text-pink-400',
                'required'    => false,
                'completed'   => Designation::where('school_id', $schoolId)->exists(),
            ],
            [
                'id'          => 'school_preferences',
                'label'       => 'School Preferences',
                'description' => 'Working days, school hours, branding, result display settings',
                'href'        => '/school/settings',
                'icon'        => 'SlidersHorizontal',
                'color'       => 'bg-gray-50 text-gray-600 dark:bg-gray-950/40 dark:text-gray-400',
                'required'    => false,
                'completed'   => $school && $school->working_days && $school->school_opening_time,
            ],
            [
                'id'          => 'timetable',
                'label'       => 'Timetable',
                'description' => 'Build class timetable with periods and teacher assignments',
                'href'        => '/school/timetable',
                'icon'        => 'CalendarClock',
                'color'       => 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400',
                'required'    => false,
                'completed'   => Timetable::where('school_id', $schoolId)->exists(),
            ],
            [
                'id'          => 'sierra_leone',
                'label'       => 'Sierra Leone Config',
                'description' => 'National grading system, education level, exam centres',
                'href'        => '/school/settings/sierra-leone',
                'icon'        => 'Landmark',
                'color'       => 'bg-sky-50 text-sky-600 dark:bg-sky-950/40 dark:text-sky-400',
                'required'    => false,
                'completed'   => \App\Models\SchoolSetting::where('school_id', $schoolId)
                    ->where('group', 'sierra_leone')->exists(),
            ],
            [
                'id'          => 'integrations',
                'label'       => 'Integrations',
                'description' => 'SMTP email, SMS gateway, payment gateway configuration',
                'href'        => '/school/settings/integrations',
                'icon'        => 'Plug',
                'color'       => 'bg-fuchsia-50 text-fuchsia-600 dark:bg-fuchsia-950/40 dark:text-fuchsia-400',
                'required'    => false,
                'completed'   => \App\Models\SchoolSetting::where('school_id', $schoolId)
                    ->whereIn('group', ['smtp', 'sms'])->exists(),
            ],
        ];
    }

    /**
     * GET /school/setup/progress
     *
     * Returns ordered steps with completion status + overall progress.
     */
    public function progress(): JsonResponse
    {
        $steps = $this->getSteps();

        $requiredTotal    = collect($steps)->where('required', true)->count();
        $requiredDone     = collect($steps)->where('required', true)->where('completed', true)->count();
        $optionalTotal    = collect($steps)->where('required', false)->count();
        $optionalDone     = collect($steps)->where('required', false)->where('completed', true)->count();

        $school = School::withoutGlobalScopes()->find($this->getSchoolId());

        return response()->json([
            'steps'           => $steps,
            'required_total'  => $requiredTotal,
            'required_done'   => $requiredDone,
            'optional_total'  => $optionalTotal,
            'optional_done'   => $optionalDone,
            'all_required'    => $requiredDone === $requiredTotal,
            'is_configured'   => $school?->is_configured ?? false,
        ]);
    }

    /**
     * POST /school/setup/complete
     *
     * Marks the school as configured (all required steps done).
     */
    public function markComplete(): RedirectResponse
    {
        $steps    = $this->getSteps();
        $allDone  = collect($steps)->where('required', true)->every('completed', true);

        if (! $allDone) {
            return back()->with('error', 'Please complete all required setup steps first.');
        }

        School::withoutGlobalScopes()->where('id', $this->getSchoolId())->update(['is_configured' => true]);

        return back()->with('success', 'School setup completed! You can now use all modules.');
    }
}
