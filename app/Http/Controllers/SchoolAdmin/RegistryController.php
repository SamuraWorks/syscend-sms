<?php

namespace App\Http\Controllers\SchoolAdmin;

use App\Http\Controllers\Controller;
use App\Models\Guardian;
use App\Models\ImportJob;
use App\Models\SchoolClass;
use App\Models\Staff;
use App\Models\Student;
use App\Models\SubjectOffering;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class RegistryController extends Controller
{
    public function index(): Response
    {
        $schoolId = $this->getSchoolId();

        return Inertia::render('SchoolAdmin/Registry/Index', [
            'stats' => [
                'students' => [
                    'total'    => Student::where('school_id', $schoolId)->count(),
                    'registered' => Student::where('school_id', $schoolId)->whereNotNull('user_id')->count(),
                    'pending'  => Student::where('school_id', $schoolId)->whereNull('user_id')->count(),
                ],
                'parents' => [
                    'total'      => Guardian::where('school_id', $schoolId)->count(),
                    'registered' => Guardian::where('school_id', $schoolId)->whereNotNull('user_id')->count(),
                ],
                'staff' => [
                    'total'      => Staff::where('school_id', $schoolId)->count(),
                    'registered' => Staff::where('school_id', $schoolId)->whereNotNull('user_id')->count(),
                ],
            ],
            'recentClaims' => Student::where('school_id', $schoolId)
                ->whereNotNull('claimed_at')
                ->with('guardian:id,name')
                ->latest('claimed_at')
                ->limit(10)
                ->get(['id', 'first_name', 'last_name', 'admission_no', 'guardian_id', 'claimed_by', 'claimed_at']),
            'recentImports' => ImportJob::where('school_id', $schoolId)
                ->latest()
                ->limit(10)
                ->get(),
        ]);
    }

    public function students(Request $request): Response
    {
        $schoolId = $this->getSchoolId();

        $students = Student::query()
            ->where('school_id', $schoolId)
            ->with(['schoolClass:id,name', 'section:id,name', 'guardian:id,name,phone'])
            ->when($request->search, fn ($q) => $q->where(function ($q) use ($request) {
                $q->where('first_name', 'like', "%{$request->search}%")
                  ->orWhere('last_name', 'like', "%{$request->search}%")
                  ->orWhere('admission_no', 'like', "%{$request->search}%");
            }))
            ->when($request->status, fn ($q) => $q->where('status', $request->status))
            ->when($request->registration_status, fn ($q) => $q->where('registration_status', $request->registration_status))
            ->latest()
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('SchoolAdmin/Registry/Students', [
            'students' => [
                'data'  => $students->items(),
                'meta'  => [
                    'total'        => $students->total(),
                    'per_page'     => $students->perPage(),
                    'current_page' => $students->currentPage(),
                    'last_page'    => $students->lastPage(),
                    'from'         => $students->firstItem(),
                    'to'           => $students->lastItem(),
                ],
                'links' => [
                    'prev' => $students->previousPageUrl(),
                    'next' => $students->nextPageUrl(),
                ],
            ],
            'filters' => $request->only('search', 'status', 'registration_status'),
        ]);
    }

    public function parents(Request $request): Response
    {
        $schoolId = $this->getSchoolId();

        $parents = Guardian::query()
            ->where('school_id', $schoolId)
            ->when($request->search, fn ($q) => $q->where(function ($q) use ($request) {
                $q->where('name', 'like', "%{$request->search}%")
                  ->orWhere('phone', 'like', "%{$request->search}%")
                  ->orWhere('email', 'like', "%{$request->search}%");
            }))
            ->when($request->registration_status, fn ($q) => $q->where('registration_status', $request->registration_status))
            ->withCount('students')
            ->latest()
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('SchoolAdmin/Registry/Parents', [
            'parents' => [
                'data'  => $parents->items(),
                'meta'  => [
                    'total'        => $parents->total(),
                    'per_page'     => $parents->perPage(),
                    'current_page' => $parents->currentPage(),
                    'last_page'    => $parents->lastPage(),
                    'from'         => $parents->firstItem(),
                    'to'           => $parents->lastItem(),
                ],
                'links' => [
                    'prev' => $parents->previousPageUrl(),
                    'next' => $parents->nextPageUrl(),
                ],
            ],
            'filters' => $request->only('search', 'registration_status'),
        ]);
    }

    public function staff(Request $request): Response
    {
        $schoolId = $this->getSchoolId();

        $staff = Staff::query()
            ->where('school_id', $schoolId)
            ->with(['department:id,name', 'designation:id,name'])
            ->when($request->search, fn ($q) => $q->where(function ($q) use ($request) {
                $q->where('first_name', 'like', "%{$request->search}%")
                  ->orWhere('last_name', 'like', "%{$request->search}%")
                  ->orWhere('emp_id', 'like', "%{$request->search}%");
            }))
            ->when($request->status, fn ($q) => $q->where('status', $request->status))
            ->when($request->registration_status, fn ($q) => $q->where('registration_status', $request->registration_status))
            ->latest()
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('SchoolAdmin/Registry/Staff', [
            'staff' => [
                'data'  => $staff->items(),
                'meta'  => [
                    'total'        => $staff->total(),
                    'per_page'     => $staff->perPage(),
                    'current_page' => $staff->currentPage(),
                    'last_page'    => $staff->lastPage(),
                    'from'         => $staff->firstItem(),
                    'to'           => $staff->lastItem(),
                ],
                'links' => [
                    'prev' => $staff->previousPageUrl(),
                    'next' => $staff->nextPageUrl(),
                ],
            ],
            'filters' => $request->only('search', 'status', 'registration_status'),
        ]);
    }

    public function curriculum(Request $request): Response
    {
        $schoolId = $this->getSchoolId();

        $classId = $request->class_id;

        $query = SubjectOffering::query()
            ->where('school_id', $schoolId)
            ->active()
            ->with(['schoolClass:id,name', 'section:id,name', 'subject:id,name,code']);

        if ($classId) {
            $query->forClass($classId);
        }

        $offerings = $query->get([
            'id', 'class_id', 'section_id', 'subject_id',
            'subject_name', 'subject_code', 'subject_type',
            'selection_group', 'is_required', 'sort_order',
        ]);

        $grouped = $offerings->groupBy(fn ($o) => $o->schoolClass->name ?? 'Unknown')
            ->map(fn ($classOfferings) => $classOfferings
                ->groupBy(fn ($o) => $o->section->name ?? 'General')
                ->map(fn ($sectionOfferings) => $sectionOfferings->values())
            )
            ->toArray();

        return Inertia::render('SchoolAdmin/Registry/Curriculum', [
            'offerings'    => $grouped,
            'classes'      => SchoolClass::where('school_id', $schoolId)->orderBy('numeric_name')->get(['id', 'name']),
            'filters'      => $request->only('class_id'),
            'summary'      => [
                'total'       => $offerings->count(),
                'compulsory'  => $offerings->where('subject_type', 'compulsory')->count(),
                'elective'    => $offerings->where('subject_type', 'elective')->count(),
                'selective'   => $offerings->where('subject_type', 'selective')->count(),
            ],
        ]);
    }
}
