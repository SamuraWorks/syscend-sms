<?php

namespace App\Http\Controllers\SchoolAdmin;

use App\Http\Controllers\Controller;
use App\Models\AcademicTerm;
use App\Models\AcademicYear;
use App\Models\AssessmentComponent;
use App\Models\AssessmentType;
use App\Models\Department;
use App\Models\GradeScale;
use App\Models\School;
use App\Models\SchoolAssessmentConfig;
use App\Models\SchoolClass;
use App\Models\SchoolSetting;
use App\Models\SchoolSetupProgress;
use App\Models\Section;
use App\Models\Subject;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Inertia;

class SetupWizardController extends Controller
{
    private const STEPS = [
        'profile'             => ['label' => 'School Profile',              'required' => true,  'order' => 1],
        'academic_structure'  => ['label' => 'Academic Structure',          'required' => true,  'order' => 2],
        'streams'             => ['label' => 'Streams & Sections',          'required' => false, 'order' => 3],
        'academic_year'       => ['label' => 'Academic Year & Terms',       'required' => true,  'order' => 4],
        'assessment'          => ['label' => 'Assessment Setup',            'required' => true,  'order' => 5],
        'subjects'            => ['label' => 'Subjects',                    'required' => false, 'order' => 6],
        'grading'             => ['label' => 'Grading & Promotion',        'required' => true,  'order' => 7],
        'branding'            => ['label' => 'Branding & Documents',       'required' => false, 'order' => 8],
        'ready'               => ['label' => 'School Ready',               'required' => false, 'order' => 9],
    ];

    public function index()
    {
        return Inertia::render('SchoolSetupWizard/Index');
    }

    public function progress(): JsonResponse
    {
        $sid = $this->getSchoolId();
        $completed = SchoolSetupProgress::getCompletedSteps($sid);
        $school = School::withoutGlobalScopes()->find($sid);

        $steps = collect(self::STEPS)->map(fn ($cfg, $key) => [
            'id'         => $key,
            'label'      => $cfg['label'],
            'required'   => $cfg['required'],
            'order'      => $cfg['order'],
            'completed'  => in_array($key, $completed),
        ])->sortBy('order')->values();

        $requiredSteps   = $steps->where('required', true);
        $requiredDone    = $requiredSteps->where('completed', true)->count();
        $allRequiredDone = $requiredDone === $requiredSteps->count();

        return response()->json([
            'steps'            => $steps,
            'required_total'   => $requiredSteps->count(),
            'required_done'    => $requiredDone,
            'all_required'     => $allRequiredDone,
            'is_configured'    => $school?->is_configured ?? false,
            'current_step'     => $this->getNextStep($sid),
        ]);
    }

    private function getNextStep(int $sid): ?string
    {
        $completed = SchoolSetupProgress::getCompletedSteps($sid);
        foreach (self::STEPS as $key => $cfg) {
            if (! in_array($key, $completed)) return $key;
        }
        return null;
    }

    // ── Step dispatcher ────────────────────────────────────────────
    private const STEP_METHODS = [
        'profile'            => ['get' => 'getProfile',            'save' => 'saveProfile'],
        'academic_structure' => ['get' => 'getAcademicStructure',  'save' => 'saveAcademicStructure'],
        'streams'            => ['get' => 'getStreams',             'save' => 'saveStreams'],
        'academic_year'      => ['get' => 'getAcademicYear',       'save' => 'saveAcademicYear'],
        'assessment'         => ['get' => 'getAssessment',         'save' => 'saveAssessment'],
        'subjects'           => ['get' => 'getSubjects',           'save' => 'saveSubjects'],
        'grading'            => ['get' => 'getGrading',            'save' => 'saveGrading'],
        'branding'           => ['get' => 'getBranding',           'save' => 'saveBranding'],
    ];

    public function showStep(string $step): JsonResponse
    {
        if (!isset(self::STEP_METHODS[$step])) {
            return response()->json(['message' => 'Invalid step.'], 404);
        }
        return $this->{self::STEP_METHODS[$step]['get']}();
    }

    public function saveStep(Request $request, string $step): JsonResponse
    {
        if (!isset(self::STEP_METHODS[$step])) {
            return response()->json(['message' => 'Invalid step.'], 404);
        }
        return $this->{self::STEP_METHODS[$step]['save']}($request);
    }

    // ── Step 1: School Profile ────────────────────────────────────
    public function getProfile(): JsonResponse
    {
        $sid = $this->getSchoolId();
        $school = School::withoutGlobalScopes()->find($sid);

        return response()->json([
            'data' => $school ? [
                'name'             => $school->name,
                'short_name'       => $school->short_name,
                'motto'            => $school->motto,
                'school_type'      => $school->school_type,
                'school_level'     => $school->school_level,
                'district_name'    => $school->district_name,
                'chiefdom'         => $school->chiefdom,
                'province'         => $school->province,
                'city'             => $school->city,
                'address'          => $school->address,
                'country'          => $school->country ?? 'SL',
                'phone'            => $school->phone,
                'email'            => $school->email,
                'website'          => $school->website,
                'emis_code'        => $school->emis_code,
                'gps_latitude'     => $school->gps_latitude,
                'gps_longitude'    => $school->gps_longitude,
                'whatsapp_number'  => $school->whatsapp_number,
                'about_school'     => $school->about_school,
                'school_mission'   => $school->school_mission,
                'school_vision'    => $school->school_vision,
                'working_days'     => $school->working_days,
                'school_opening_time' => $school->school_opening_time,
                'school_closing_time' => $school->school_closing_time,
            ] : [],
            'defaults' => [
                'country'    => 'SL',
                'timezone'   => 'Africa/Freetown',
                'currency'   => 'SLE',
                'phone_code' => '+232',
            ],
        ]);
    }

    public function saveProfile(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name'              => 'required|string|max:200',
            'short_name'        => 'nullable|string|max:50',
            'motto'             => 'nullable|string|max:300',
            'school_type'       => 'required|in:government,government_assisted,private,community,faith_based',
            'school_level'      => 'required|in:nursery,primary,junior_secondary,senior_secondary,combined',
            'district_name'     => 'nullable|string|max:100',
            'chiefdom'          => 'nullable|string|max:100',
            'province'          => 'nullable|string|max:100',
            'city'              => 'nullable|string|max:100',
            'address'           => 'nullable|string|max:300',
            'country'           => 'nullable|string|max:5',
            'phone'             => 'nullable|string|max:30',
            'email'             => 'nullable|email|max:200',
            'website'           => 'nullable|url|max:200',
            'emis_code'         => 'nullable|string|max:50',
            'gps_latitude'      => 'nullable|numeric|between:-90,90',
            'gps_longitude'     => 'nullable|numeric|between:-180,180',
            'whatsapp_number'   => 'nullable|string|max:30',
            'about_school'      => 'nullable|string|max:2000',
            'school_mission'    => 'nullable|string|max:1000',
            'school_vision'     => 'nullable|string|max:1000',
            'working_days'      => 'nullable|string|max:50',
            'school_opening_time' => 'nullable|date_format:H:i',
            'school_closing_time' => 'nullable|date_format:H:i',
        ]);

        $sid = $this->getSchoolId();
        $school = School::withoutGlobalScopes()->find($sid);
        $school->update($data);

        SchoolSetupProgress::markComplete($sid, 'profile', $data);

        return response()->json(['success' => true, 'message' => 'School profile saved.']);
    }

    // ── Step 2: Academic Structure ────────────────────────────────
    public function getAcademicStructure(): JsonResponse
    {
        $sid = $this->getSchoolId();
        $school = School::withoutGlobalScopes()->find($sid);
        $selectedLevels = $this->detectLevels($school);
        $existingClasses = SchoolClass::where('school_id', $sid)
            ->orderBy('school_level')->orderBy('level_order')
            ->get(['id', 'name', 'short_name', 'numeric_name', 'school_level', 'level_order', 'is_active']);

        return response()->json([
            'selected_levels'  => $selectedLevels,
            'existing_classes' => $existingClasses,
            'defaults'         => $this->getLevelDefaults(),
        ]);
    }

    public function saveAcademicStructure(Request $request): JsonResponse
    {
        $data = $request->validate([
            'levels'              => 'required|array|min:1',
            'levels.*'            => 'string|in:nursery,primary,junior_secondary,senior_secondary',
            'classes'             => 'required|array|min:1',
            'classes.*.name'      => 'required|string|max:50',
            'classes.*.short_name'=> 'nullable|string|max:20',
            'classes.*.school_level'   => 'required|string',
            'classes.*.level_order'    => 'required|integer|min:0',
            'classes.*.numeric_name'   => 'nullable|integer|min:0',
        ]);

        $sid = $this->getSchoolId();

        DB::transaction(function () use ($data, $sid) {
            $existingIds = SchoolClass::where('school_id', $sid)->pluck('id')->toArray();
            $incomingIds = [];

            foreach ($data['classes'] as $idx => $cls) {
                $cls['school_id'] = $sid;
                $cls['numeric_name'] = $cls['numeric_name'] ?? ($idx + 1) * 10;
                $cls['level_order'] = $cls['level_order'] ?? $idx;
                $cls['short_name'] = $cls['short_name'] ?? $cls['name'];

                if (!empty($cls['id'])) {
                    $incomingIds[] = $cls['id'];
                    SchoolClass::where('id', $cls['id'])->where('school_id', $sid)->update(
                        collect($cls)->except(['id', 'school_id'])->toArray()
                    );
                } else {
                    $created = SchoolClass::create($cls);
                    $incomingIds[] = $created->id;
                }
            }

            $toDelete = array_diff($existingIds, $incomingIds);
            if ($toDelete) {
                SchoolClass::whereIn('id', $toDelete)->where('school_id', $sid)->delete();
            }
        });

        if (!empty($data['levels'])) {
            School::withoutGlobalScopes()->where('id', $sid)->update([
                'school_level' => $data['levels'][0] === 'nursery' && count($data['levels']) === 1
                    ? 'nursery'
                    : (count($data['levels']) > 1 ? 'combined' : $data['levels'][0]),
            ]);
        }

        SchoolSetupProgress::markComplete($sid, 'academic_structure', $data);

        return response()->json(['success' => true, 'message' => 'Academic structure saved.']);
    }

    // ── Step 3: Streams & Sections ────────────────────────────────
    public function getStreams(): JsonResponse
    {
        $sid = $this->getSchoolId();
        $departments = Department::where('school_id', $sid)->academic()->get();
        $sections = Section::where('school_id', $sid)->with('schoolClass:id,name')->get();
        $classes = SchoolClass::where('school_id', $sid)->where('school_level', 'senior_secondary')->get(['id', 'name']);

        return response()->json([
            'departments' => $departments,
            'sections'    => $sections,
            'sss_classes' => $classes,
            'defaults'    => [
                'departments' => ['Science', 'Arts', 'Commercial'],
                'sections'    => ['A', 'B', 'C'],
            ],
        ]);
    }

    public function saveStreams(Request $request): JsonResponse
    {
        $data = $request->validate([
            'departments'              => 'nullable|array',
            'departments.*.name'       => 'required|string|max:100',
            'departments.*.code'       => 'nullable|string|max:20',
            'departments.*.id'         => 'nullable|integer',
            'sections'                 => 'nullable|array',
            'sections.*.name'          => 'required|string|max:100',
            'sections.*.class_id'      => 'required|integer|exists:classes,id',
            'sections.*.section_code'  => 'nullable|string|max:20',
            'sections.*.id'            => 'nullable|integer',
        ]);

        $sid = $this->getSchoolId();

        DB::transaction(function () use ($data, $sid) {
            if (!empty($data['departments'])) {
                $existingDeptIds = Department::where('school_id', $sid)->academic()->pluck('id')->toArray();
                $incomingDeptIds = [];

                foreach ($data['departments'] as $dept) {
                    $deptData = [
                        'school_id' => $sid,
                        'name'      => $dept['name'],
                        'code'      => $dept['code'] ?? null,
                        'type'      => 'academic',
                        'is_active' => true,
                    ];

                    if (!empty($dept['id'])) {
                        $incomingDeptIds[] = $dept['id'];
                        Department::where('id', $dept['id'])->where('school_id', $sid)->update($deptData);
                    } else {
                        $created = Department::create($deptData);
                        $incomingDeptIds[] = $created->id;
                    }
                }

                $toDelete = array_diff($existingDeptIds, $incomingDeptIds);
                if ($toDelete) Department::whereIn('id', $toDelete)->where('school_id', $sid)->delete();
            }

            if (!empty($data['sections'])) {
                $existingSecIds = Section::where('school_id', $sid)->pluck('id')->toArray();
                $incomingSecIds = [];

                foreach ($data['sections'] as $sec) {
                    $secData = [
                        'school_id'    => $sid,
                        'class_id'     => $sec['class_id'],
                        'name'         => $sec['name'],
                        'section_code' => $sec['section_code'] ?? null,
                        'is_active'    => true,
                    ];

                    if (!empty($sec['id'])) {
                        $incomingSecIds[] = $sec['id'];
                        Section::where('id', $sec['id'])->where('school_id', $sid)->update($secData);
                    } else {
                        $created = Section::create($secData);
                        $incomingSecIds[] = $created->id;
                    }
                }

                $toDelete = array_diff($existingSecIds, $incomingSecIds);
                if ($toDelete) Section::whereIn('id', $toDelete)->where('school_id', $sid)->delete();
            }
        });

        SchoolSetupProgress::markComplete($sid, 'streams');

        return response()->json(['success' => true, 'message' => 'Streams and sections saved.']);
    }

    // ── Step 4: Academic Year & Terms ─────────────────────────────
    public function getAcademicYear(): JsonResponse
    {
        $sid = $this->getSchoolId();
        $currentYear = AcademicYear::where('school_id', $sid)->where('is_current', true)->first();
        $terms = $currentYear
            ? AcademicTerm::where('school_id', $sid)->where('academic_year_id', $currentYear->id)->orderBy('start_date')->get()
            : collect();

        $allYears = AcademicYear::where('school_id', $sid)->orderByDesc('start_date')->get();

        $year = date('Y');
        return response()->json([
            'current_year' => $currentYear,
            'terms'        => $terms,
            'all_years'    => $allYears,
            'defaults'     => [
                'year_name'   => "$year/" . ($year + 1),
                'start_date'  => "$year-09-01",
                'end_date'    => ($year + 1) . "-07-31",
                'terms'       => [
                    ['name' => 'First Term',  'start_date' => "$year-09-08", 'end_date' => "$year-12-15"],
                    ['name' => 'Second Term', 'start_date' => "$year-01-06", 'end_date' => "$year-03-31"],
                    ['name' => 'Third Term',  'start_date' => "$year-04-14", 'end_date' => "$year-07-10"],
                ],
            ],
        ]);
    }

    public function saveAcademicYear(Request $request): JsonResponse
    {
        $data = $request->validate([
            'year_name'              => 'required|string|max:50',
            'start_date'             => 'required|date',
            'end_date'               => 'required|date|after:start_date',
            'terms'                  => 'required|array|min:1',
            'terms.*.name'           => 'required|string|max:50',
            'terms.*.start_date'     => 'required|date',
            'terms.*.end_date'       => 'required|date|after:terms.*.start_date',
            'terms.*.id'             => 'nullable|integer',
        ]);

        $sid = $this->getSchoolId();

        DB::transaction(function () use ($data, $sid) {
            AcademicYear::where('school_id', $sid)->update(['is_current' => false]);
            $year = AcademicYear::updateOrCreate(
                ['school_id' => $sid, 'name' => $data['year_name']],
                [
                    'start_date' => $data['start_date'],
                    'end_date'   => $data['end_date'],
                    'is_current' => true,
                ]
            );

            $existingTermIds = AcademicTerm::where('school_id', $sid)
                ->where('academic_year_id', $year->id)->pluck('id')->toArray();
            $incomingTermIds = [];

            foreach ($data['terms'] as $idx => $term) {
                $termData = [
                    'school_id'        => $sid,
                    'academic_year_id' => $year->id,
                    'name'             => $term['name'],
                    'start_date'       => $term['start_date'],
                    'end_date'         => $term['end_date'],
                    'is_current'       => $idx === 0,
                ];

                if (!empty($term['id'])) {
                    $incomingTermIds[] = $term['id'];
                    AcademicTerm::where('id', $term['id'])->update($termData);
                } else {
                    $created = AcademicTerm::create($termData);
                    $incomingTermIds[] = $created->id;
                }
            }

            $toDelete = array_diff($existingTermIds, $incomingTermIds);
            if ($toDelete) AcademicTerm::whereIn('id', $toDelete)->delete();
        });

        SchoolSetupProgress::markComplete($sid, 'academic_year', $data);

        return response()->json(['success' => true, 'message' => 'Academic year and terms saved.']);
    }

    // ── Step 5: Assessment Setup ──────────────────────────────────
    public function getAssessment(): JsonResponse
    {
        $sid = $this->getSchoolId();
        $year = AcademicYear::where('school_id', $sid)->where('is_current', true)->first();
        $components = $year
            ? AssessmentComponent::where('school_id', $sid)
                ->where('academic_year_id', $year->id)
                ->orderBy('sort_order')->get()
            : collect();
        $config = $year
            ? SchoolAssessmentConfig::where('school_id', $sid)
                ->where('academic_year_id', $year->id)->first()
            : null;

        return response()->json([
            'components' => $components,
            'config'     => $config,
            'has_year'   => $year !== null,
            'defaults'   => [
                'components' => [
                    ['name' => 'Test 1',           'category' => 'coursework',     'weight_percentage' => 15, 'max_marks' => 20],
                    ['name' => 'Test 2',           'category' => 'coursework',     'weight_percentage' => 15, 'max_marks' => 20],
                    ['name' => 'Assignment',       'category' => 'coursework',     'weight_percentage' => 10, 'max_marks' => 10],
                    ['name' => 'Final Examination','category' => 'examination',    'weight_percentage' => 60, 'max_marks' => 100],
                ],
                'total_coursework_weight'    => 40,
                'total_examination_weight'   => 60,
            ],
        ]);
    }

    public function saveAssessment(Request $request): JsonResponse
    {
        $data = $request->validate([
            'components'                     => 'required|array|min:1',
            'components.*.name'              => 'required|string|max:100',
            'components.*.category'          => 'required|in:coursework,examination',
            'components.*.weight_percentage' => 'required|numeric|between:0,100',
            'components.*.max_marks'         => 'required|numeric|min:1',
            'components.*.sort_order'        => 'nullable|integer|min:0',
            'components.*.id'                => 'nullable|integer',
            'total_coursework_weight'        => 'required|numeric|between:0,100',
            'total_examination_weight'       => 'required|numeric|between:0,100',
            'config_name'                    => 'nullable|string|max:100',
        ]);

        $totalWeight = collect($data['components'])->sum('weight_percentage');
        if (abs($totalWeight - 100) > 0.01) {
            return response()->json(['message' => 'Total assessment weight must equal 100%. Current: ' . round($totalWeight, 1) . '%'], 422);
        }

        $sid = $this->getSchoolId();
        $year = AcademicYear::where('school_id', $sid)->where('is_current', true)->first();

        if (!$year) {
            return response()->json(['message' => 'Please set up an academic year first.'], 422);
        }

        DB::transaction(function () use ($data, $sid, $year) {
            $existingIds = AssessmentComponent::where('school_id', $sid)
                ->where('academic_year_id', $year->id)->pluck('id')->toArray();
            $incomingIds = [];

            foreach ($data['components'] as $idx => $comp) {
                $compData = [
                    'school_id'         => $sid,
                    'academic_year_id'  => $year->id,
                    'name'              => $comp['name'],
                    'slug'              => Str::slug($comp['name']),
                    'category'          => $comp['category'],
                    'weight_percentage' => $comp['weight_percentage'],
                    'max_marks'         => $comp['max_marks'],
                    'sort_order'        => $comp['sort_order'] ?? $idx,
                    'is_active'         => true,
                ];

                if (!empty($comp['id'])) {
                    $incomingIds[] = $comp['id'];
                    AssessmentComponent::where('id', $comp['id'])->update($compData);
                } else {
                    $created = AssessmentComponent::create($compData);
                    $incomingIds[] = $created->id;
                }
            }

            $toDelete = array_diff($existingIds, $incomingIds);
            if ($toDelete) AssessmentComponent::whereIn('id', $toDelete)->delete();

            SchoolAssessmentConfig::updateOrCreate(
                ['school_id' => $sid, 'academic_year_id' => $year->id],
                [
                    'name'                       => $data['config_name'] ?? 'Default Configuration',
                    'is_default'                 => true,
                    'total_coursework_weight'    => $data['total_coursework_weight'],
                    'total_examination_weight'   => $data['total_examination_weight'],
                    'config_data'                => $data['components'],
                ]
            );
        });

        SchoolSetupProgress::markComplete($sid, 'assessment', $data);

        return response()->json(['success' => true, 'message' => 'Assessment setup saved.']);
    }

    // ── Step 6: Subjects ──────────────────────────────────────────
    public function getSubjects(): JsonResponse
    {
        $sid = $this->getSchoolId();
        $classes = SchoolClass::where('school_id', $sid)->orderBy('level_order')->get(['id', 'name', 'school_level']);
        $subjects = Subject::where('school_id', $sid)->with('schoolClass:id,name')->get();
        $departments = Department::where('school_id', $sid)->academic()->get(['id', 'name']);

        return response()->json([
            'classes'     => $classes,
            'subjects'    => $subjects,
            'departments' => $departments,
            'defaults'    => $this->getSubjectDefaults(),
        ]);
    }

    public function saveSubjects(Request $request): JsonResponse
    {
        $data = $request->validate([
            'subjects'             => 'required|array',
            'subjects.*.name'      => 'required|string|max:100',
            'subjects.*.code'      => 'nullable|string|max:20',
            'subjects.*.class_id'  => 'required|integer|exists:classes,id',
            'subjects.*.is_core'   => 'nullable|boolean',
            'subjects.*.school_level'    => 'nullable|string',
            'subjects.*.department_id'   => 'nullable|integer',
            'subjects.*.id'        => 'nullable|integer',
        ]);

        $sid = $this->getSchoolId();

        DB::transaction(function () use ($data, $sid) {
            $existingIds = Subject::where('school_id', $sid)->pluck('id')->toArray();
            $incomingIds = [];

            foreach ($data['subjects'] as $sub) {
                $subData = [
                    'school_id'     => $sid,
                    'class_id'      => $sub['class_id'],
                    'name'          => $sub['name'],
                    'code'          => $sub['code'] ?? null,
                    'is_core'       => $sub['is_core'] ?? true,
                    'school_level'  => $sub['school_level'] ?? null,
                    'department_id' => $sub['department_id'] ?? null,
                ];

                if (!empty($sub['id'])) {
                    $incomingIds[] = $sub['id'];
                    Subject::where('id', $sub['id'])->where('school_id', $sid)->update($subData);
                } else {
                    $created = Subject::create($subData);
                    $incomingIds[] = $created->id;
                }
            }

            $toDelete = array_diff($existingIds, $incomingIds);
            if ($toDelete) Subject::whereIn('id', $toDelete)->where('school_id', $sid)->delete();
        });

        SchoolSetupProgress::markComplete($sid, 'subjects', $data);

        return response()->json(['success' => true, 'message' => 'Subjects saved.']);
    }

    // ── Step 7: Grading & Promotion ───────────────────────────────
    public function getGrading(): JsonResponse
    {
        $sid = $this->getSchoolId();
        $school = School::withoutGlobalScopes()->find($sid);
        $gradeScales = GradeScale::where('school_id', $sid)->orderBy('min_marks')->get();

        return response()->json([
            'grade_scales' => $gradeScales,
            'school_level' => $school?->school_level,
            'ca_weight'    => $school?->ca_weight,
            'exam_weight'  => $school?->exam_weight,
            'defaults'     => [
                'ca_weight'    => 40,
                'exam_weight'  => 60,
                'pass_mark'    => 50,
                'grade_scale'  => [
                    ['grade' => 'A',  'gpa' => 4.0, 'min_marks' => 80, 'max_marks' => 100, 'remarks' => 'Excellent',  'sort_order' => 1],
                    ['grade' => 'B',  'gpa' => 3.5, 'min_marks' => 70, 'max_marks' => 79.99, 'remarks' => 'Very Good', 'sort_order' => 2],
                    ['grade' => 'C',  'gpa' => 3.0, 'min_marks' => 60, 'max_marks' => 69.99, 'remarks' => 'Good',      'sort_order' => 3],
                    ['grade' => 'D',  'gpa' => 2.0, 'min_marks' => 50, 'max_marks' => 59.99, 'remarks' => 'Pass',      'sort_order' => 4],
                    ['grade' => 'E',  'gpa' => 1.0, 'min_marks' => 40, 'max_marks' => 49.99, 'remarks' => 'Fair',      'sort_order' => 5],
                    ['grade' => 'F',  'gpa' => 0.0, 'min_marks' => 0,  'max_marks' => 39.99, 'remarks' => 'Fail',      'sort_order' => 6],
                ],
            ],
        ]);
    }

    public function saveGrading(Request $request): JsonResponse
    {
        $data = $request->validate([
            'ca_weight'              => 'required|numeric|between:0,100',
            'exam_weight'            => 'required|numeric|between:0,100',
            'pass_mark'              => 'required|numeric|between:0,100',
            'grade_scale'            => 'required|array|min:1',
            'grade_scale.*.grade'    => 'required|string|max:10',
            'grade_scale.*.gpa'      => 'required|numeric|between:0,5',
            'grade_scale.*.min_marks'=> 'required|numeric|between:0,100',
            'grade_scale.*.max_marks'=> 'required|numeric|between:0,100',
            'grade_scale.*.remarks'  => 'nullable|string|max:50',
            'grade_scale.*.sort_order'=> 'nullable|integer',
        ]);

        if (abs($data['ca_weight'] + $data['exam_weight'] - 100) > 0.01) {
            return response()->json(['message' => 'CA + Exam weight must equal 100%.'], 422);
        }

        $sid = $this->getSchoolId();

        DB::transaction(function () use ($data, $sid) {
            School::withoutGlobalScopes()->where('id', $sid)->update([
                'ca_weight'   => $data['ca_weight'],
                'exam_weight' => $data['exam_weight'],
            ]);

            SchoolSetting::set($sid, 'pass_mark', $data['pass_mark'], 'academic');

            GradeScale::where('school_id', $sid)->delete();
            foreach ($data['grade_scale'] as $idx => $gs) {
                GradeScale::create([
                    'school_id'  => $sid,
                    'grade'      => $gs['grade'],
                    'gpa'        => $gs['gpa'],
                    'min_marks'  => $gs['min_marks'],
                    'max_marks'  => $gs['max_marks'],
                    'remarks'    => $gs['remarks'] ?? null,
                    'sort_order' => $gs['sort_order'] ?? ($idx + 1),
                ]);
            }
        });

        SchoolSetupProgress::markComplete($sid, 'grading', $data);

        return response()->json(['success' => true, 'message' => 'Grading and promotion settings saved.']);
    }

    // ── Step 8: Branding ──────────────────────────────────────────
    public function getBranding(): JsonResponse
    {
        $sid = $this->getSchoolId();
        $school = School::withoutGlobalScopes()->find($sid);

        return response()->json([
            'data' => [
                'logo'              => $school?->logo,
                'badge'             => $school?->badge,
                'official_stamp'    => $school?->official_stamp,
                'official_signature'=> $school?->official_signature,
                'primary_color'     => $school?->primary_color,
                'secondary_color'   => $school?->secondary_color,
                'banner'            => $school?->banner,
            ],
        ]);
    }

    public function saveBranding(Request $request): JsonResponse
    {
        $sid = $this->getSchoolId();
        $school = School::withoutGlobalScopes()->find($sid);

        $school->update($request->only(['primary_color', 'secondary_color']));

        if ($request->hasFile('logo')) {
            $school->update(['logo' => $request->file('logo')->store('school/branding', 'public')]);
        }
        if ($request->hasFile('badge')) {
            $school->update(['badge' => $request->file('badge')->store('school/branding', 'public')]);
        }
        if ($request->hasFile('official_stamp')) {
            $school->update(['official_stamp' => $request->file('official_stamp')->store('school/branding', 'public')]);
        }
        if ($request->hasFile('official_signature')) {
            $school->update(['official_signature' => $request->file('official_signature')->store('school/branding', 'public')]);
        }
        if ($request->hasFile('banner')) {
            $school->update(['banner' => $request->file('banner')->store('school/branding', 'public')]);
        }

        SchoolSetupProgress::markComplete($sid, 'branding');

        return response()->json(['success' => true, 'message' => 'Branding saved.']);
    }

    // ── Step 9: Complete ──────────────────────────────────────────
    public function complete(): JsonResponse
    {
        $sid = $this->getSchoolId();
        School::withoutGlobalScopes()->where('id', $sid)->update(['is_configured' => true]);
        return response()->json(['success' => true, 'message' => 'School setup complete!']);
    }

    // ── Helpers ───────────────────────────────────────────────────
    private function detectLevels(?School $school): array
    {
        $level = $school?->school_level;
        return match ($level) {
            'nursery'           => ['nursery'],
            'primary'           => ['primary'],
            'junior_secondary'  => ['junior_secondary'],
            'senior_secondary'  => ['senior_secondary'],
            default             => [],
        };
    }

    private function getLevelDefaults(): array
    {
        return [
            'nursery' => [
                ['name' => 'Nursery 1', 'short_name' => 'N1', 'level_order' => 1],
                ['name' => 'Nursery 2', 'short_name' => 'N2', 'level_order' => 2],
                ['name' => 'Nursery 3', 'short_name' => 'N3', 'level_order' => 3],
            ],
            'primary' => [
                ['name' => 'Class 1', 'short_name' => 'C1', 'level_order' => 4],
                ['name' => 'Class 2', 'short_name' => 'C2', 'level_order' => 5],
                ['name' => 'Class 3', 'short_name' => 'C3', 'level_order' => 6],
                ['name' => 'Class 4', 'short_name' => 'C4', 'level_order' => 7],
                ['name' => 'Class 5', 'short_name' => 'C5', 'level_order' => 8],
                ['name' => 'Class 6', 'short_name' => 'C6', 'level_order' => 9],
            ],
            'junior_secondary' => [
                ['name' => 'JSS 1', 'short_name' => 'JSS1', 'level_order' => 10],
                ['name' => 'JSS 2', 'short_name' => 'JSS2', 'level_order' => 11],
                ['name' => 'JSS 3', 'short_name' => 'JSS3', 'level_order' => 12],
            ],
            'senior_secondary' => [
                ['name' => 'SSS 1', 'short_name' => 'SSS1', 'level_order' => 13],
                ['name' => 'SSS 2', 'short_name' => 'SSS2', 'level_order' => 14],
                ['name' => 'SSS 3', 'short_name' => 'SSS3', 'level_order' => 15],
            ],
        ];
    }

    private function getSubjectDefaults(): array
    {
        return [
            'primary' => [
                ['name' => 'English Language', 'code' => 'ENG', 'is_core' => true],
                ['name' => 'Mathematics',      'code' => 'MATH', 'is_core' => true],
                ['name' => 'Science',           'code' => 'SCI', 'is_core' => true],
                ['name' => 'Social Studies',    'code' => 'SST', 'is_core' => true],
                ['name' => 'Krio Language',     'code' => 'KRI', 'is_core' => true],
                ['name' => 'Arts & Craft',      'code' => 'ART', 'is_core' => true],
                ['name' => 'Physical Education','code' => 'PE',  'is_core' => true],
                ['name' => 'Religious Studies', 'code' => 'RS',  'is_core' => false],
            ],
            'junior_secondary' => [
                ['name' => 'English Language', 'code' => 'ENG', 'is_core' => true],
                ['name' => 'Mathematics',      'code' => 'MATH', 'is_core' => true],
                ['name' => 'Science',           'code' => 'SCI', 'is_core' => true],
                ['name' => 'Social Studies',    'code' => 'SST', 'is_core' => true],
                ['name' => 'Agriculture Science','code' => 'AGRI', 'is_core' => false],
                ['name' => 'Home Economics',    'code' => 'HE',  'is_core' => false],
                ['name' => 'French',            'code' => 'FRE', 'is_core' => false],
                ['name' => 'Creative Arts',     'code' => 'CA',  'is_core' => false],
                ['name' => 'Physical Education','code' => 'PE',  'is_core' => false],
                ['name' => 'Religious Studies', 'code' => 'RS',  'is_core' => false],
            ],
            'senior_secondary' => [
                'core' => [
                    ['name' => 'English Language', 'code' => 'ENG', 'is_core' => true],
                    ['name' => 'Mathematics',      'code' => 'MATH', 'is_core' => true],
                ],
                'science' => [
                    ['name' => 'Physics',   'code' => 'PHY', 'is_core' => false],
                    ['name' => 'Chemistry', 'code' => 'CHEM','is_core' => false],
                    ['name' => 'Biology',   'code' => 'BIO', 'is_core' => false],
                ],
                'arts' => [
                    ['name' => 'Literature in English', 'code' => 'LIT', 'is_core' => false],
                    ['name' => 'Government',           'code' => 'GOV', 'is_core' => false],
                    ['name' => 'History',              'code' => 'HIS', 'is_core' => false],
                ],
                'commercial' => [
                    ['name' => 'Accounting',           'code' => 'ACC', 'is_core' => false],
                    ['name' => 'Economics',            'code' => 'ECO', 'is_core' => false],
                    ['name' => 'Business Management',  'code' => 'BM',  'is_core' => false],
                    ['name' => 'Commerce',             'code' => 'COM', 'is_core' => false],
                ],
            ],
        ];
    }
}
