<?php

namespace App\Http\Controllers\SchoolAdmin;

use App\Http\Controllers\Controller;
use App\Models\AcademicYear;
use App\Models\SchoolClass;
use App\Models\Section;
use App\Models\Staff;
use App\Models\SubjectOffering;
use App\Models\TeacherSubjectAssignment;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class TeacherAssignmentController extends Controller
{
    public function index(Request $request): Response
    {
        $schoolId = $this->getSchoolId();

        $academicYearId = $request->input('academic_year_id')
            ?? AcademicYear::where('school_id', $schoolId)->where('is_current', true)->value('id');

        $classes = SchoolClass::where('school_id', $schoolId)
            ->with(['sections' => fn ($q) => $q->where('is_active', true)])
            ->orderBy('level_order')
            ->orderBy('name')
            ->get();

        $staff = Staff::where('school_id', $schoolId)
            ->where('status', 'active')
            ->orderBy('first_name')
            ->get(['id', 'first_name', 'last_name', 'emp_id', 'teacher_type', 'form_master_section_id', 'form_master_class_id']);

        $academicYears = AcademicYear::where('school_id', $schoolId)
            ->orderByDesc('is_current')
            ->orderByDesc('start_date')
            ->get(['id', 'name', 'is_current']);

        $offerings = SubjectOffering::where('school_id', $schoolId)
            ->where('academic_year_id', $academicYearId)
            ->with(['schoolClass:id,name', 'section:id,name', 'subject:id,name'])
            ->withCount(['activeTeachers as active_teachers_count'])
            ->get();

        $assignments = TeacherSubjectAssignment::where('school_id', $schoolId)
            ->where('academic_year_id', $academicYearId)
            ->with(['staff:id,first_name,last_name,emp_id', 'subjectOffering' => fn ($q) => $q->with(['schoolClass:id,name', 'section:id,name', 'subject:id,name'])])
            ->where('is_active', true)
            ->get();

        $formMasters = Section::where('school_id', $schoolId)
            ->with(['formMaster:id,first_name,last_name,emp_id', 'schoolClass:id,name'])
            ->whereNotNull('form_master_id')
            ->get(['id', 'name', 'class_id', 'form_master_id']);

        return Inertia::render('SchoolAdmin/Assignments/Index', [
            'assignments'    => $assignments,
            'offerings'      => $offerings,
            'classes'        => $classes,
            'staff'          => $staff,
            'academicYears'  => $academicYears,
            'formMasters'    => $formMasters,
            'filters'        => ['academic_year_id' => $academicYearId],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'staff_id'            => 'required|exists:staff,id',
            'subject_offering_id' => 'required|exists:subject_offerings,id',
            'academic_year_id'    => 'required|exists:academic_years,id',
        ]);

        $schoolId = $this->getSchoolId();

        $exists = TeacherSubjectAssignment::where('school_id', $schoolId)
            ->where('staff_id', $validated['staff_id'])
            ->where('subject_offering_id', $validated['subject_offering_id'])
            ->where('academic_year_id', $validated['academic_year_id'])
            ->where('is_active', true)
            ->exists();

        if ($exists) {
            return redirect()->back()->withErrors(['staff_id' => 'This teacher is already assigned to this subject offering.']);
        }

        TeacherSubjectAssignment::create([
            ...$validated,
            'school_id'   => $schoolId,
            'assigned_by' => auth()->id(),
            'is_active'   => true,
        ]);

        return redirect()->back()->with('success', 'Teacher assigned successfully.');
    }

    public function destroy(TeacherSubjectAssignment $assignment): RedirectResponse
    {
        $assignment->update(['is_active' => false]);

        return redirect()->back()->with('success', 'Teacher assignment removed.');
    }

    public function bulkStore(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'staff_ids'           => 'required|array|min:1',
            'staff_ids.*'         => 'exists:staff,id',
            'subject_offering_id' => 'required|exists:subject_offerings,id',
            'academic_year_id'    => 'required|exists:academic_years,id',
        ]);

        $schoolId = $this->getSchoolId();
        $assigned = 0;

        DB::transaction(function () use ($validated, $schoolId, &$assigned) {
            foreach ($validated['staff_ids'] as $staffId) {
                $exists = TeacherSubjectAssignment::where('school_id', $schoolId)
                    ->where('staff_id', $staffId)
                    ->where('subject_offering_id', $validated['subject_offering_id'])
                    ->where('academic_year_id', $validated['academic_year_id'])
                    ->where('is_active', true)
                    ->exists();

                if (!$exists) {
                    TeacherSubjectAssignment::create([
                        'school_id'          => $schoolId,
                        'staff_id'           => $staffId,
                        'subject_offering_id' => $validated['subject_offering_id'],
                        'academic_year_id'   => $validated['academic_year_id'],
                        'assigned_by'        => auth()->id(),
                        'is_active'          => true,
                    ]);
                    $assigned++;
                }
            }
        });

        return redirect()->back()->with('success', "{$assigned} teacher(s) assigned successfully.");
    }

    public function assignFormMaster(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'section_id' => 'required|exists:sections,id',
            'staff_id'   => 'required|exists:staff,id',
        ]);

        $section = Section::findOrFail($validated['section_id']);
        $section->update([
            'form_master_id' => $validated['staff_id'],
        ]);

        Staff::where('id', $validated['staff_id'])->update([
            'form_master_section_id' => $validated['section_id'],
            'form_master_class_id'   => $section->class_id,
            'teacher_type'           => DB::raw("CASE WHEN teacher_type = 'subject_teacher' THEN 'both' WHEN teacher_type = 'form_master' THEN 'form_master' WHEN teacher_type = 'both' THEN 'both' ELSE 'form_master' END"),
        ]);

        return redirect()->back()->with('success', 'Form master assigned successfully.');
    }

    public function removeFormMaster(Section $section): RedirectResponse
    {
        if ($section->form_master_id) {
            Staff::where('id', $section->form_master_id)->update([
                'form_master_section_id' => null,
                'form_master_class_id'   => null,
                'teacher_type'           => DB::raw("CASE WHEN teacher_type = 'both' THEN 'subject_teacher' ELSE NULL END"),
            ]);
        }

        $section->update(['form_master_id' => null]);

        return redirect()->back()->with('success', 'Form master removed successfully.');
    }
}
