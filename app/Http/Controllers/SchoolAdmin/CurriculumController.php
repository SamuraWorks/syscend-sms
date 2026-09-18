<?php

namespace App\Http\Controllers\SchoolAdmin;

use App\Http\Controllers\Controller;
use App\Models\AcademicYear;
use App\Models\SchoolClass;
use App\Models\Subject;
use App\Models\SubjectOffering;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class CurriculumController extends Controller
{
    public function index(): Response
    {
        $schoolId = $this->getSchoolId();

        $offerings = SubjectOffering::query()
            ->where('school_id', $schoolId)
            ->with(['schoolClass', 'section', 'department'])
            ->withCount('enrollments')
            ->orderBy('class_id')
            ->orderBy('sort_order')
            ->get();

        $classes = SchoolClass::query()
            ->where('school_id', $schoolId)
            ->where('is_active', true)
            ->with('sections')
            ->orderBy('level_order')
            ->orderBy('name')
            ->get()
            ->map(function ($cls) use ($offerings) {
                $clsOfferings = $offerings->where('class_id', $cls->id);
                $cls->offerings = $clsOfferings->values();
                $cls->offerings_count = $clsOfferings->count();
                return $cls;
            });

        $academicYears = AcademicYear::query()
            ->where('school_id', $schoolId)
            ->orderByDesc('is_current')
            ->orderByDesc('start_date')
            ->get();

        $currentYear = AcademicYear::query()
            ->where('school_id', $schoolId)
            ->where('is_current', true)
            ->first();

        return Inertia::render('SchoolAdmin/Curriculum/Index', [
            'offerings'     => $offerings->groupBy('class_id'),
            'classes'       => $classes,
            'academicYears' => $academicYears,
            'currentYear'   => $currentYear,
        ]);
    }

    public function show(int $classId, Request $request): Response
    {
        $schoolId = $this->getSchoolId();

        $schoolClass = SchoolClass::with(['sections', 'department'])
            ->where('school_id', $schoolId)
            ->findOrFail($classId);

        $currentYear = AcademicYear::query()
            ->where('school_id', $schoolId)
            ->where('is_current', true)
            ->first();

        $yearId = $request->input('academic_year_id')
            ?? $request->input('year')
            ?? $currentYear?->id;

        if (!$yearId) {
            return Inertia::render('SchoolAdmin/Curriculum/Show', [
                'classData'     => $schoolClass,
                'offerings'     => [],
                'grouped'       => [],
                'academicYears' => AcademicYear::where('school_id', $schoolId)->orderByDesc('is_current')->get(),
                'currentYear'   => null,
                'filters'       => ['academic_year_id' => null],
            ]);
        }

        $query = SubjectOffering::query()
            ->where('school_id', $schoolId)
            ->where('class_id', $classId)
            ->where('academic_year_id', $yearId)
            ->with(['section', 'department', 'subject'])
            ->withCount('enrollments');

        if ($request->filled('section_id')) {
            $query->where('section_id', $request->input('section_id'));
        }

        $subjects = $query
            ->orderBy('selection_group')
            ->orderBy('sort_order')
            ->get()
            ->groupBy('selection_group');

        $offerings = $subjects->flatten();

        $grouped = $subjects->mapWithKeys(function ($groupOfferings, $group) {
            $bySection = $groupOfferings->groupBy(fn ($o) => $o->section->name ?? 'General')
                ->map(fn ($items) => $items->values());
            return [$group => $bySection];
        })->toArray();

        $academicYears = AcademicYear::where('school_id', $schoolId)
            ->orderByDesc('is_current')
            ->orderByDesc('start_date')
            ->get();

        $activeYear = AcademicYear::find($yearId);

        return Inertia::render('SchoolAdmin/Curriculum/Show', [
            'classData'     => $schoolClass,
            'offerings'     => $offerings,
            'grouped'       => $grouped,
            'academicYears' => $academicYears,
            'currentYear'   => $activeYear,
            'filters'       => $request->only(['academic_year_id', 'section_id']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'class_id'         => 'required|exists:classes,id',
            'academic_year_id' => 'required|exists:academic_years,id',
            'subject_name'     => 'required|string|max:255',
            'subject_code'     => 'required|string|max:50',
            'subject_type'     => 'required|in:compulsory,elective,selective',
            'subject_id'       => 'nullable|exists:subjects,id',
            'section_id'       => 'nullable|exists:sections,id',
            'department_id'    => 'nullable|exists:departments,id',
            'selection_group'  => 'nullable|string|max:100',
            'is_required'      => 'boolean',
            'min_selection'    => 'nullable|integer|min:0',
            'max_selection'    => 'nullable|integer|min:0',
            'sort_order'       => 'nullable|integer|min:0',
        ]);

        $schoolId = $this->getSchoolId();

        $class = SchoolClass::where('id', $validated['class_id'])
            ->where('school_id', $schoolId)
            ->first();
        if (!$class) {
            return back()->withErrors(['class_id' => 'Class not found.'])->withInput();
        }

        if ($class->school_level !== 'senior_secondary' && !empty($validated['department_id'])) {
            return back()->withErrors([
                'department_id' => 'Departments can only be used with SSS classes.',
            ])->withInput();
        }

        $duplicate = SubjectOffering::where('school_id', $schoolId)
            ->where('academic_year_id', $validated['academic_year_id'])
            ->where('class_id', $validated['class_id'])
            ->where('subject_code', $validated['subject_code'])
            ->exists();

        if ($duplicate) {
            return back()->withErrors([
                'subject_code' => 'A subject with this code already exists for this class in the selected academic year.',
            ])->withInput();
        }

        SubjectOffering::create([
            ...$validated,
            'school_id' => $schoolId,
            'is_active' => true,
        ]);

        return redirect()->back()->with('success', 'Subject offering created successfully.');
    }

    public function update(Request $request, SubjectOffering $offering): RedirectResponse
    {
        $schoolId = $this->getSchoolId();

        if ($offering->school_id !== $schoolId) {
            abort(403, 'Unauthorized.');
        }

        $validated = $request->validate([
            'subject_name'     => 'sometimes|string|max:255',
            'subject_code'     => 'sometimes|string|max:50',
            'subject_type'     => 'sometimes|in:compulsory,elective,selective',
            'subject_id'       => 'nullable|exists:subjects,id',
            'section_id'       => 'nullable|exists:sections,id',
            'department_id'    => 'nullable|exists:departments,id',
            'selection_group'  => 'nullable|string|max:100',
            'is_required'      => 'boolean',
            'min_selection'    => 'nullable|integer|min:0',
            'max_selection'    => 'nullable|integer|min:0',
            'sort_order'       => 'nullable|integer|min:0',
            'is_active'        => 'boolean',
        ]);

        $offering->update($validated);

        return redirect()->back()->with('success', 'Subject offering updated successfully.');
    }

    public function destroy(SubjectOffering $offering): RedirectResponse
    {
        $schoolId = $this->getSchoolId();

        if ($offering->school_id !== $schoolId) {
            abort(403, 'Unauthorized.');
        }

        $enrolledCount = $offering->enrollments()->count();
        if ($enrolledCount > 0) {
            return back()->withErrors([
                'delete' => "Cannot delete this offering. {$enrolledCount} student(s) are enrolled. Consider deactivating it instead.",
            ]);
        }

        $offering->delete();

        return redirect()->back()->with('success', 'Subject offering deleted successfully.');
    }
}
