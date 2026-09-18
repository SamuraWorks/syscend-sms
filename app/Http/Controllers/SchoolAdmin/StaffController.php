<?php

namespace App\Http\Controllers\SchoolAdmin;

use App\Http\Controllers\Controller;
use App\Models\Department;
use App\Models\Designation;
use App\Models\Staff;
use App\Models\StaffDocument;
use App\Services\UserCreationService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class StaffController extends Controller
{
    public function index(Request $request): Response
    {
        $staff = Staff::with(['department:id,name', 'designation:id,name'])
            ->when($request->search, fn ($q) => $q->where(function ($q) use ($request) {
                $q->where('first_name', 'like', "%{$request->search}%")
                  ->orWhere('last_name',  'like', "%{$request->search}%")
                  ->orWhere('emp_id',     'like', "%{$request->search}%")
                  ->orWhere('email',      'like', "%{$request->search}%");
            }))
            ->when($request->department_id,  fn ($q) => $q->where('department_id',  $request->department_id))
            ->when($request->designation_id, fn ($q) => $q->where('designation_id', $request->designation_id))
            ->when($request->status,         fn ($q) => $q->where('status',         $request->status))
            ->latest()
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('SchoolAdmin/Staff/Index', [
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
            'filters'      => $request->only('search', 'department_id', 'designation_id', 'status'),
            'departments'  => Department::orderBy('name')->get(['id', 'name']),
            'designations' => Designation::orderBy('name')->get(['id', 'department_id', 'name']),
            'stats'        => [
                'total'      => Staff::count(),
                'active'     => Staff::where('status', 'active')->count(),
                'on_leave'   => Staff::where('status', 'on_leave')->count(),
                'resigned'   => Staff::where('status', 'resigned')->count(),
            ],
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('SchoolAdmin/Staff/Create', [
            'departments'  => Department::orderBy('name')->get(['id', 'name']),
            'designations' => Designation::orderBy('name')->get(['id', 'department_id', 'name']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'first_name'     => 'required|string|max:100',
            'last_name'      => 'nullable|string|max:100',
            'gender'         => 'required|in:male,female,other',
            'date_of_birth'  => 'nullable|date',
            'blood_group'    => 'nullable|string|max:5',
            'religion'       => 'nullable|string|max:50',
            'nationality'    => 'nullable|string|max:50',
            'phone'          => 'nullable|string|max:20',
            'email'          => 'nullable|email|max:150',
            'address'        => 'nullable|string|max:500',
            'department_id'  => 'nullable|exists:departments,id',
            'designation_id' => 'nullable|exists:designations,id',
            'joining_date'   => 'nullable|date',
            'salary_type'    => 'required|in:fixed,hourly',
            'salary'         => 'nullable|numeric|min:0',
            'status'         => 'required|in:active,resigned,terminated,on_leave',
            'notes'          => 'nullable|string|max:1000',
        ]);

        try {
            $service = new UserCreationService($this->getSchoolId(), auth()->id());
            $result = $service->createStaff($data, ['teacher']);

            return redirect()->route('school.staff.index')
                ->with('success', 'Staff registered and user account created.')
                ->with('temp_password', $result['temp_password'] ?? null);
        } catch (\Throwable $e) {
            Staff::create($data);
            return redirect()->route('school.staff.index')
                ->with('success', 'Staff registered (no user account created).');
        }
    }

    public function show(Staff $staff): Response
    {
        $staff->load(['department', 'designation', 'documents']);
        $staff->load(['subjectAssignments' => fn ($q) => $q
            ->where('is_active', true)
            ->with(['subjectOffering' => fn ($q2) => $q2->with(['schoolClass:id,name', 'section:id,name', 'subject:id,name'])])
        ]);

        return Inertia::render('SchoolAdmin/Staff/Show', [
            'staff' => $staff,
            'formMasterSection' => $staff->form_master_section_id
                ? \App\Models\Section::with('schoolClass:id,name')->find($staff->form_master_section_id)
                : null,
        ]);
    }

    public function edit(Staff $staff): Response
    {
        return Inertia::render('SchoolAdmin/Staff/Edit', [
            'staff'        => $staff,
            'departments'  => Department::orderBy('name')->get(['id', 'name']),
            'designations' => Designation::orderBy('name')->get(['id', 'department_id', 'name']),
        ]);
    }

    public function update(Request $request, Staff $staff): RedirectResponse
    {
        $data = $request->validate([
            'first_name'     => 'required|string|max:100',
            'last_name'      => 'nullable|string|max:100',
            'gender'         => 'required|in:male,female,other',
            'date_of_birth'  => 'nullable|date',
            'blood_group'    => 'nullable|string|max:5',
            'religion'       => 'nullable|string|max:50',
            'nationality'    => 'nullable|string|max:50',
            'phone'          => 'nullable|string|max:20',
            'email'          => 'nullable|email|max:150',
            'address'        => 'nullable|string|max:500',
            'department_id'  => 'nullable|exists:departments,id',
            'designation_id' => 'nullable|exists:designations,id',
            'joining_date'   => 'nullable|date',
            'salary_type'    => 'required|in:fixed,hourly',
            'salary'         => 'nullable|numeric|min:0',
            'status'         => 'required|in:active,resigned,terminated,on_leave',
            'notes'          => 'nullable|string|max:1000',
        ]);

        $staff->update($data);

        return redirect()->route('school.staff.show', $staff)->with('success', 'Staff updated.');
    }

    public function destroy(Staff $staff): RedirectResponse
    {
        $staff->delete();

        return redirect()->route('school.staff.index')->with('success', 'Staff removed.');
    }

    public function uploadDocument(Request $request, Staff $staff): RedirectResponse
    {
        $request->validate([
            'title' => 'required|string|max:150',
            'file'  => 'required|file|mimes:pdf,jpg,jpeg,png|max:5120',
        ]);

        $path = $request->file('file')->store("staff/{$staff->id}/documents", 'private');

        StaffDocument::create([
            'school_id' => $staff->school_id,
            'staff_id'  => $staff->id,
            'title'     => $request->title,
            'file_path' => $path,
            'file_type' => $request->file('file')->getMimeType(),
            'file_size' => $request->file('file')->getSize(),
        ]);

        return back()->with('success', 'Document uploaded.');
    }

    public function deleteDocument(StaffDocument $document): RedirectResponse
    {
        Storage::disk('private')->delete($document->file_path);
        $document->delete();

        return back()->with('success', 'Document deleted.');
    }
}
