<?php

namespace App\Http\Controllers\SchoolAdmin;

use App\Http\Controllers\Controller;
use App\Models\AcademicYear;
use App\Models\Department;
use App\Models\SchoolClass;
use App\Models\Subject;
use App\Models\SubjectOffering;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class SubjectController extends Controller
{
    public function index(Request $request): Response
    {
        $schoolId = $this->getSchoolId();

        $query = Subject::query()
            ->where('school_id', $schoolId)
            ->with(['schoolClass', 'department']);

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'ilike', "%{$search}%")
                  ->orWhere('code', 'ilike', "%{$search}%");
            });
        }

        if ($level = $request->input('school_level')) {
            $query->where('school_level', $level);
        }

        if ($classId = $request->input('class_id')) {
            $query->where('class_id', $classId);
        }

        if ($request->input('status') === 'active') {
            $query->where('is_active', true);
        } elseif ($request->input('status') === 'inactive') {
            $query->where('is_active', false);
        }

        $subjects = $query->orderBy('school_level')
            ->orderBy('name')
            ->paginate($request->input('per_page', 50))
            ->withQueryString();

        $classes = SchoolClass::where('school_id', $schoolId)
            ->orderBy('level_order')
            ->orderBy('name')
            ->get(['id', 'name', 'school_level']);

        $departments = Department::where('school_id', $schoolId)
            ->academic()
            ->active()
            ->orderBy('name')
            ->get(['id', 'name', 'code']);

        return Inertia::render('SchoolAdmin/Subjects/Index', [
            'subjects'    => $subjects,
            'classes'     => $classes,
            'departments' => $departments,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $schoolId = $this->getSchoolId();

        $data = $request->validate([
            'class_id'      => 'required|exists:classes,id',
            'name'          => 'required|string|max:150',
            'code'          => 'nullable|string|max:30',
            'type'          => 'required|in:theory,practical',
            'full_marks'    => 'nullable|integer|min:1',
            'pass_marks'    => 'nullable|integer|min:1',
            'school_level'  => ['nullable', 'string', Rule::in(['early_childhood', 'primary', 'junior_secondary', 'senior_secondary'])],
            'department_id' => 'nullable|exists:departments,id',
            'is_core'       => 'boolean',
        ]);

        $data['school_id'] = $schoolId;
        $data['is_core'] = $data['is_core'] ?? false;

        $class = SchoolClass::where('id', $data['class_id'])
            ->where('school_id', $schoolId)
            ->first();
        if (!$class) {
            return back()->withErrors(['class_id' => 'Class not found.'])->withInput();
        }

        $data['school_level'] = $data['school_level'] ?? $class->school_level;

        if ($data['school_level'] !== 'senior_secondary' && !empty($data['department_id'])) {
            return back()->withErrors([
                'department_id' => 'Departments can only be assigned to SSS (Senior Secondary) subjects.',
            ])->withInput();
        }

        if (!empty($data['code'])) {
            $codeExists = Subject::where('school_id', $schoolId)
                ->where('code', $data['code'])
                ->exists();
            if ($codeExists) {
                return back()->withErrors(['code' => 'A subject with this code already exists.'])->withInput();
            }
        }

        $subject = Subject::create($data);

        $currentYear = AcademicYear::where('school_id', $schoolId)
            ->where('is_current', true)
            ->first();

        if ($currentYear) {
            $subjectCode = !empty($data['code']) ? $data['code'] : strtoupper(preg_replace('/\s+/', '', substr($data['name'], 0, 6)));

            $existing = SubjectOffering::where('school_id', $schoolId)
                ->where('academic_year_id', $currentYear->id)
                ->where('class_id', $data['class_id'])
                ->where('subject_code', $subjectCode)
                ->exists();

            if (!$existing) {
                SubjectOffering::create([
                    'school_id'     => $schoolId,
                    'academic_year_id' => $currentYear->id,
                    'class_id'      => $data['class_id'],
                    'subject_id'    => $subject->id,
                    'subject_name'  => $data['name'],
                    'subject_code'  => $subjectCode,
                    'subject_type'  => 'compulsory',
                    'department_id' => $data['department_id'] ?? null,
                    'is_active'     => true,
                ]);
            }
        }

        return back()->with('success', 'Subject created and added to current curriculum.');
    }

    public function update(Request $request, Subject $subject): RedirectResponse
    {
        $schoolId = $this->getSchoolId();

        if ($subject->school_id !== $schoolId) {
            abort(403, 'Unauthorized.');
        }

        $data = $request->validate([
            'class_id'      => 'required|exists:classes,id',
            'name'          => 'required|string|max:150',
            'code'          => 'nullable|string|max:30',
            'type'          => 'required|in:theory,practical',
            'full_marks'    => 'nullable|integer|min:1',
            'pass_marks'    => 'nullable|integer|min:1',
            'school_level'  => ['nullable', 'string', Rule::in(['early_childhood', 'primary', 'junior_secondary', 'senior_secondary'])],
            'department_id' => 'nullable|exists:departments,id',
            'is_core'       => 'boolean',
        ]);

        $class = SchoolClass::where('id', $data['class_id'])
            ->where('school_id', $schoolId)
            ->first();
        if (!$class) {
            return back()->withErrors(['class_id' => 'Class not found.'])->withInput();
        }

        $data['school_level'] = $data['school_level'] ?? $class->school_level;

        if ($data['school_level'] !== 'senior_secondary' && !empty($data['department_id'])) {
            return back()->withErrors([
                'department_id' => 'Departments can only be assigned to SSS (Senior Secondary) subjects.',
            ])->withInput();
        }

        if (!empty($data['code'])) {
            $codeExists = Subject::where('school_id', $schoolId)
                ->where('code', $data['code'])
                ->where('id', '!=', $subject->id)
                ->exists();
            if ($codeExists) {
                return back()->withErrors(['code' => 'A subject with this code already exists.'])->withInput();
            }
        }

        $subject->update($data);

        SubjectOffering::where('subject_id', $subject->id)
            ->where('class_id', $data['class_id'])
            ->update([
                'subject_name'  => $data['name'],
                'subject_code'  => $data['code'] ?? $subject->code,
                'department_id' => $data['department_id'] ?? null,
            ]);

        return back()->with('success', 'Subject updated.');
    }

    public function destroy(Subject $subject): RedirectResponse
    {
        $schoolId = $this->getSchoolId();

        if ($subject->school_id !== $schoolId) {
            abort(403, 'Unauthorized.');
        }

        $offeringsCount = SubjectOffering::where('subject_id', $subject->id)->count();
        if ($offeringsCount > 0) {
            return back()->withErrors([
                'delete' => "Cannot delete this subject. It is used in {$offeringsCount} curriculum offering(s). Deactivate it instead.",
            ]);
        }

        $subject->delete();

        return back()->with('success', 'Subject deleted.');
    }

    public function toggleStatus(Subject $subject): RedirectResponse
    {
        $schoolId = $this->getSchoolId();

        if ($subject->school_id !== $schoolId) {
            abort(403, 'Unauthorized.');
        }

        $subject->update(['is_active' => !$subject->is_active]);

        $status = $subject->is_active ? 'activated' : 'deactivated';

        return back()->with('success', "Subject {$status}.");
    }
}
