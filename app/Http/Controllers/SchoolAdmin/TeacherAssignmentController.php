<?php

namespace App\Http\Controllers\SchoolAdmin;

use App\Http\Controllers\Controller;
use App\Models\AcademicYear;
use App\Models\SchoolClass;
use App\Models\Section;
use App\Models\Staff;
use App\Models\Subject;
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
            ?: AcademicYear::where('school_id', $schoolId)->where('is_current', true)->value('id')
            ?: AcademicYear::where('school_id', $schoolId)->orderByDesc('start_date')->value('id');

        $this->ensureOfferingsForYear($schoolId, $academicYearId);

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

        $sectionFormMasters = Section::where('school_id', $schoolId)
            ->with(['formMaster:id,first_name,last_name,emp_id', 'schoolClass:id,name'])
            ->whereNotNull('form_master_id')
            ->get(['id', 'name', 'class_id', 'form_master_id'])
            ->map(fn (Section $section) => [
                'id'            => $section->id,
                'scope'         => 'section',
                'name'          => $section->name,
                'class_id'      => $section->class_id,
                'form_master_id' => $section->form_master_id,
                'form_master'   => $section->formMaster,
                'school_class'  => $section->schoolClass,
            ]);

        $classFormMasters = SchoolClass::where('school_id', $schoolId)
            ->whereNotNull('form_master_id')
            ->with('formMaster:id,first_name,last_name,emp_id')
            ->get(['id', 'name', 'form_master_id'])
            ->map(fn (SchoolClass $class) => [
                'id'            => $class->id,
                'scope'         => 'class',
                'name'          => $class->name,
                'class_id'      => $class->id,
                'form_master_id' => $class->form_master_id,
                'form_master'   => $class->formMaster,
                'school_class'  => ['id' => $class->id, 'name' => $class->name],
            ]);

        $formMasters = $sectionFormMasters->concat($classFormMasters)->values();

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
            'staff_id'   => 'required|exists:staff,id',
            'section_id' => 'nullable|required_without:class_id|exists:sections,id',
            'class_id'   => 'nullable|required_without:section_id|exists:classes,id',
        ]);

        // Class-level form master: used when a class has no sections.
        if (!empty($validated['class_id']) && empty($validated['section_id'])) {
            $class = SchoolClass::where('id', $validated['class_id'])
                ->where('school_id', $this->getSchoolId())
                ->firstOrFail();

            $class->update(['form_master_id' => $validated['staff_id']]);

            Staff::where('id', $validated['staff_id'])->update([
                'form_master_section_id' => null,
                'form_master_class_id'   => $class->id,
                'teacher_type'           => DB::raw("CASE WHEN teacher_type = 'subject_teacher' THEN 'both' WHEN teacher_type = 'form_master' THEN 'form_master' WHEN teacher_type = 'both' THEN 'both' ELSE 'form_master' END"),
            ]);

            return redirect()->back()->with('success', 'Form master assigned to class successfully.');
        }

        $section = Section::where('id', $validated['section_id'])
            ->where('school_id', $this->getSchoolId())
            ->firstOrFail();

        $section->update([
            'form_master_id' => $validated['staff_id'],
        ]);

        Staff::where('id', $validated['staff_id'])->update([
            'form_master_section_id' => $section->id,
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

    public function removeFormMasterClass(SchoolClass $class): RedirectResponse
    {
        if ($class->form_master_id) {
            Staff::where('id', $class->form_master_id)->update([
                'form_master_section_id' => null,
                'form_master_class_id'   => null,
                'teacher_type'           => DB::raw("CASE WHEN teacher_type = 'both' THEN 'subject_teacher' ELSE NULL END"),
            ]);
        }

        $class->update(['form_master_id' => null]);

        return redirect()->back()->with('success', 'Form master removed from class successfully.');
    }

    /**
     * Subjects are the source of truth for what a school teaches; subject
     * offerings are the academic-year projection of those subjects. A school
     * whose subjects were created before the year was marked current (or before
     * any year existed) would otherwise have nothing to assign teachers to, so
     * we repair the projection idempotently on load.
     */
    private function ensureOfferingsForYear(int $schoolId, ?int $academicYearId): void
    {
        if (!$academicYearId) {
            return;
        }

        $subjects = Subject::where('school_id', $schoolId)
            ->whereNotNull('class_id')
            ->where('is_active', true)
            ->get(['id', 'class_id', 'name', 'code', 'department_id']);

        if ($subjects->isEmpty()) {
            return;
        }

        foreach ($subjects as $subject) {
            $code = $subject->code ?: strtoupper(preg_replace('/\s+/', '', substr($subject->name, 0, 6)));

            $exists = SubjectOffering::where('school_id', $schoolId)
                ->where('academic_year_id', $academicYearId)
                ->where('class_id', $subject->class_id)
                ->where(function ($q) use ($subject, $code) {
                    $q->where('subject_id', $subject->id)->orWhere('subject_code', $code);
                })
                ->exists();

            if ($exists) {
                continue;
            }

            SubjectOffering::create([
                'school_id'        => $schoolId,
                'academic_year_id' => $academicYearId,
                'class_id'         => $subject->class_id,
                'subject_id'       => $subject->id,
                'subject_name'     => $subject->name,
                'subject_code'     => $code,
                'subject_type'     => 'compulsory',
                'department_id'    => $subject->department_id,
                'is_active'        => true,
            ]);
        }
    }
}
