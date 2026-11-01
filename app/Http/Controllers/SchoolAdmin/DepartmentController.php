<?php

namespace App\Http\Controllers\SchoolAdmin;

use App\Http\Controllers\Controller;
use App\Models\Department;
use App\Models\SchoolClass;
use App\Models\Staff;
use App\Models\Subject;
use App\Models\SubjectOffering;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class DepartmentController extends Controller
{
    public function index(Request $request): Response
    {
        $schoolId = $this->getSchoolId();

        $query = Department::query()
            ->where('school_id', $schoolId)
            ->withCount(['staff', 'classes']);

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'ilike', "%{$search}%")
                  ->orWhere('code', 'ilike', "%{$search}%");
            });
        }

        if ($type = $request->input('type')) {
            $query->where('type', $type);
        }

        if ($request->input('status') === 'active') {
            $query->where('is_active', true);
        } elseif ($request->input('status') === 'inactive') {
            $query->where('is_active', false);
        }

        $departments = $query->orderBy('name')->get();

        $academicDepts = Department::where('school_id', $schoolId)
            ->academic()
            ->where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name', 'code']);

        return Inertia::render('SchoolAdmin/Departments/Index', [
            'departments'   => $departments,
            'academicDepts' => $academicDepts,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $schoolId = $this->getSchoolId();

        $data = $request->validate([
            'name'        => 'required|string|max:100',
            'code'        => 'nullable|string|max:20',
            'description' => 'nullable|string|max:500',
            'type'        => ['required', 'string', Rule::in(['academic', 'staff'])],
            'is_active'   => 'boolean',
        ]);

        $data['school_id'] = $schoolId;

        $nameExists = Department::where('school_id', $schoolId)
            ->where('name', $data['name'])
            ->exists();
        if ($nameExists) {
            return back()->withErrors(['name' => 'A department with this name already exists.'])->withInput();
        }

        if (!empty($data['code'])) {
            $codeExists = Department::where('school_id', $schoolId)
                ->where('code', $data['code'])
                ->exists();
            if ($codeExists) {
                return back()->withErrors(['code' => 'A department with this code already exists.'])->withInput();
            }
        }

        $data['is_active'] = $data['is_active'] ?? true;

        Department::create($data);

        return back()->with('success', 'Department created.');
    }

    public function update(Request $request, Department $department): RedirectResponse
    {
        $schoolId = $this->getSchoolId();

        if ($department->school_id !== $schoolId) {
            abort(403, 'Unauthorized.');
        }

        $data = $request->validate([
            'name'        => 'required|string|max:100',
            'code'        => 'nullable|string|max:20',
            'description' => 'nullable|string|max:500',
            'type'        => ['required', 'string', Rule::in(['academic', 'staff'])],
            'is_active'   => 'boolean',
        ]);

        $nameExists = Department::where('school_id', $schoolId)
            ->where('name', $data['name'])
            ->where('id', '!=', $department->id)
            ->exists();
        if ($nameExists) {
            return back()->withErrors(['name' => 'A department with this name already exists.'])->withInput();
        }

        if (!empty($data['code'])) {
            $codeExists = Department::where('school_id', $schoolId)
                ->where('code', $data['code'])
                ->where('id', '!=', $department->id)
                ->exists();
            if ($codeExists) {
                return back()->withErrors(['code' => 'A department with this code already exists.'])->withInput();
            }
        }

        $department->update($data);

        return back()->with('success', 'Department updated.');
    }

    public function destroy(Department $department): RedirectResponse
    {
        $schoolId = $this->getSchoolId();

        if ($department->school_id !== $schoolId) {
            abort(403, 'Unauthorized.');
        }

        $dependencies = $this->checkDependencies($department);

        if (!empty($dependencies)) {
            return back()->withErrors([
                'delete' => 'Cannot delete this department. It is used by: ' . implode(', ', $dependencies) . '. Consider deactivating it instead.',
            ]);
        }

        $department->delete();

        return back()->with('success', 'Department deleted.');
    }

    public function toggleStatus(Department $department): RedirectResponse
    {
        $schoolId = $this->getSchoolId();

        if ($department->school_id !== $schoolId) {
            abort(403, 'Unauthorized.');
        }

        $department->update(['is_active' => !$department->is_active]);

        $status = $department->is_active ? 'activated' : 'deactivated';

        return back()->with('success', "Department {$status}.");
    }

    private function checkDependencies(Department $department): array
    {
        $deps = [];

        $classesCount = SchoolClass::where('department_id', $department->id)->count();
        if ($classesCount > 0) {
            $deps[] = "{$classesCount} class(es)";
        }

        $staffCount = Staff::where('department_id', $department->id)->count();
        if ($staffCount > 0) {
            $deps[] = "{$staffCount} staff member(s)";
        }

        $subjectsCount = Subject::where('department_id', $department->id)->count();
        if ($subjectsCount > 0) {
            $deps[] = "{$subjectsCount} subject(s)";
        }

        $offeringsCount = SubjectOffering::where('department_id', $department->id)->count();
        if ($offeringsCount > 0) {
            $deps[] = "{$offeringsCount} curriculum offering(s)";
        }

        return $deps;
    }
}
