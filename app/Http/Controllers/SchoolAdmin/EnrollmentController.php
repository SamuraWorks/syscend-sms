<?php

namespace App\Http\Controllers\SchoolAdmin;

use App\Http\Controllers\Controller;
use App\Models\StudentSubjectEnrollment;
use App\Models\SubjectOffering;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class EnrollmentController extends Controller
{
    public function index(Request $request): Response
    {
        $schoolId = $this->getSchoolId();

        $query = StudentSubjectEnrollment::query()
            ->where('school_id', $schoolId)
            ->with(['student', 'subjectOffering.schoolClass', 'subjectOffering.section']);

        if ($request->filled('student_id')) {
            $query->where('student_id', $request->input('student_id'));
        }

        if ($request->filled('class_id')) {
            $query->whereHas('subjectOffering', fn ($q) => $q->where('class_id', $request->input('class_id')));
        }

        if ($request->filled('academic_year_id')) {
            $query->where('academic_year_id', $request->input('academic_year_id'));
        }

        if ($request->filled('section_id')) {
            $query->whereHas('subjectOffering', fn ($q) => $q->where('section_id', $request->input('section_id')));
        }

        $enrollments = $query->latest('enrolled_at')->paginate(20)->withQueryString();

        return Inertia::render('SchoolAdmin/Enrollments/Index', [
            'enrollments' => [
                'data'  => $enrollments->items(),
                'meta'  => [
                    'total'        => $enrollments->total(),
                    'per_page'     => $enrollments->perPage(),
                    'current_page' => $enrollments->currentPage(),
                    'last_page'    => $enrollments->lastPage(),
                    'from'         => $enrollments->firstItem(),
                    'to'           => $enrollments->lastItem(),
                ],
                'links' => [
                    'prev' => $enrollments->previousPageUrl(),
                    'next' => $enrollments->nextPageUrl(),
                ],
            ],
        ]);
    }

    public function create(Request $request): Response
    {
        $schoolId = $this->getSchoolId();

        $academicYears = \App\Models\AcademicYear::where('school_id', $schoolId)->orderByDesc('is_current')->get(['id', 'name', 'is_current']);
        $currentYear = $academicYears->firstWhere('is_current');

        if (!$request->filled('student_id')) {
            $students = \App\Models\Student::where('school_id', $schoolId)
                ->where('status', 'active')
                ->with('schoolClass:id,name')
                ->orderBy('first_name')
                ->get(['id', 'first_name', 'last_name', 'admission_no', 'class_id']);

            return Inertia::render('SchoolAdmin/Enrollments/Create', [
                'student'              => null,
                'availableOfferings'   => collect(),
                'compulsoryOfferings'  => collect(),
                'enrolledIds'          => [],
                'students'             => $students,
                'academicYears'        => $academicYears,
                'currentYear'          => $currentYear,
            ]);
        }

        $request->validate([
            'student_id'       => 'required|exists:students,id',
            'academic_year_id' => 'nullable|exists:academic_years,id',
        ]);

        $student = \App\Models\Student::with('schoolClass', 'section')->findOrFail($request->input('student_id'));

        $yearQuery = SubjectOffering::query()
            ->where('school_id', $schoolId)
            ->where('class_id', $student->class_id)
            ->with(['section', 'department']);

        if ($request->filled('academic_year_id')) {
            $yearQuery->where('academic_year_id', $request->input('academic_year_id'));
        } else {
            $yearQuery->whereHas('academicYear', fn ($q) => $q->where('is_current', true));
        }

        $availableOfferings = $yearQuery
            ->where('is_active', true)
            ->orderBy('selection_group')
            ->orderBy('sort_order')
            ->get();

        $enrolledIds = StudentSubjectEnrollment::query()
            ->where('school_id', $schoolId)
            ->where('student_id', $student->id)
            ->where('status', 'enrolled')
            ->pluck('subject_offering_id')
            ->toArray();

        $compulsoryOfferings = $availableOfferings->filter(fn ($o) => $o->subject_type === 'compulsory');
        $nonCompulsoryOfferings = $availableOfferings->filter(fn ($o) => $o->subject_type !== 'compulsory');

        return Inertia::render('SchoolAdmin/Enrollments/Create', [
            'student'              => $student,
            'availableOfferings'   => $nonCompulsoryOfferings->values(),
            'compulsoryOfferings'  => $compulsoryOfferings->values(),
            'enrolledIds'          => $enrolledIds,
            'students'             => collect(),
            'academicYears'        => $academicYears,
            'currentYear'          => $currentYear,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'student_id'           => 'required|exists:students,id',
            'subject_offering_ids' => 'required|array|min:1',
            'subject_offering_ids.*' => 'exists:subject_offerings,id',
            'academic_year_id'     => 'required|exists:academic_years,id',
        ]);

        $schoolId = $this->getSchoolId();
        $student = \App\Models\Student::findOrFail($validated['student_id']);

        $offerings = SubjectOffering::query()
            ->whereIn('id', $validated['subject_offering_ids'])
            ->where('school_id', $schoolId)
            ->get();

        $this->validateEnrollmentConstraints($offerings, $validated['academic_year_id']);

        DB::transaction(function () use ($validated, $schoolId, $offerings) {
            $compulsory = SubjectOffering::query()
                ->where('school_id', $schoolId)
                ->where('class_id', $offerings->first()->class_id)
                ->where('academic_year_id', $validated['academic_year_id'])
                ->compulsory()
                ->pluck('id');

            $allIds = $offerings->pluck('id')->merge($compulsory)->unique();

            foreach ($allIds as $offeringId) {
                StudentSubjectEnrollment::updateOrCreate(
                    [
                        'school_id'          => $schoolId,
                        'student_id'         => $validated['student_id'],
                        'subject_offering_id' => $offeringId,
                        'academic_year_id'   => $validated['academic_year_id'],
                    ],
                    [
                        'status'     => 'enrolled',
                        'enrolled_by' => auth()->id(),
                        'enrolled_at' => now(),
                    ]
                );
            }
        });

        return redirect()->back()->with('success', 'Student enrolled successfully.');
    }

    public function bulkEnroll(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'student_ids'          => 'required|array|min:1',
            'student_ids.*'        => 'exists:students,id',
            'subject_offering_ids' => 'required|array|min:1',
            'subject_offering_ids.*' => 'exists:subject_offerings,id',
            'academic_year_id'     => 'required|exists:academic_years,id',
        ]);

        $schoolId = $this->getSchoolId();

        $offerings = SubjectOffering::query()
            ->whereIn('id', $validated['subject_offering_ids'])
            ->where('school_id', $schoolId)
            ->get();

        $this->validateEnrollmentConstraints($offerings, $validated['academic_year_id']);

        DB::transaction(function () use ($validated, $schoolId, $offerings) {
            $compulsory = SubjectOffering::query()
                ->where('school_id', $schoolId)
                ->where('class_id', $offerings->first()->class_id)
                ->where('academic_year_id', $validated['academic_year_id'])
                ->compulsory()
                ->pluck('id');

            $allIds = $offerings->pluck('id')->merge($compulsory)->unique();

            foreach ($validated['student_ids'] as $studentId) {
                foreach ($allIds as $offeringId) {
                    StudentSubjectEnrollment::updateOrCreate(
                        [
                            'school_id'          => $schoolId,
                            'student_id'         => $studentId,
                            'subject_offering_id' => $offeringId,
                            'academic_year_id'   => $validated['academic_year_id'],
                        ],
                        [
                            'status'     => 'enrolled',
                            'enrolled_by' => auth()->id(),
                            'enrolled_at' => now(),
                        ]
                    );
                }
            }
        });

        return redirect()->back()->with('success', count($validated['student_ids']) . ' students enrolled successfully.');
    }

    public function destroy(StudentSubjectEnrollment $enrollment): RedirectResponse
    {
        $enrollment->update(['status' => 'dropped']);

        return redirect()->back()->with('success', 'Enrollment dropped successfully.');
    }

    private function validateEnrollmentConstraints($offerings, int $academicYearId): void
    {
        $grouped = $offerings->groupBy('selection_group');

        foreach ($grouped as $group => $groupOfferings) {
            if (empty($group)) {
                continue;
            }

            $offeringsOfType = $groupOfferings->filter(fn ($o) => in_array($o->subject_type, ['elective', 'selective']));

            foreach ($offeringsOfType as $offering) {
                if ($offering->max_selection !== null) {
                    $existingCount = StudentSubjectEnrollment::query()
                        ->where('school_id', $offering->school_id)
                        ->where('academic_year_id', $academicYearId)
                        ->whereHas('subjectOffering', function ($q) use ($group) {
                            $q->where('selection_group', $group);
                        })
                        ->where('status', 'enrolled')
                        ->count();

                    $newCount = $offeringsOfType->count();

                    if ($newCount > $offering->max_selection) {
                        abort(422, "Maximum {$offering->max_selection} selection(s) allowed for group \"{$group}\".");
                    }
                }
            }
        }
    }
}
