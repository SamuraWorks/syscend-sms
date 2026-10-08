<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Http\Requests\SuperAdmin\SchoolRequest;
use App\Models\School;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class SchoolController extends Controller
{
    public function index(Request $request): Response
    {
        $schools = School::withTrashed(false)
            ->withCount('users')
            ->when($request->search, fn ($q) => $q->where('name', 'like', "%{$request->search}%"))
            ->when($request->status, fn ($q) => $q->where('status', $request->status))
            ->when($request->registration, fn ($q) => $q->where('registration_status', $request->registration))
            ->latest()
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('SuperAdmin/Schools/Index', [
            'schools' => [
                'data'  => $schools->items(),
                'meta'  => [
                    'total'        => $schools->total(),
                    'per_page'     => $schools->perPage(),
                    'current_page' => $schools->currentPage(),
                    'last_page'    => $schools->lastPage(),
                    'from'         => $schools->firstItem(),
                    'to'           => $schools->lastItem(),
                ],
                'links' => [
                    'first' => $schools->url(1),
                    'last'  => $schools->url($schools->lastPage()),
                    'prev'  => $schools->previousPageUrl(),
                    'next'  => $schools->nextPageUrl(),
                ],
            ],
            'filters' => $request->only('search', 'status', 'registration'),
            'stats'   => [
                'total'     => School::count(),
                'active'    => School::where('status', 'active')->count(),
                'suspended' => School::where('status', 'suspended')->count(),
                'pending'   => School::where('registration_status', 'pending')->count(),
            ],
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('SuperAdmin/Schools/Create');
    }

    public function store(SchoolRequest $request): RedirectResponse
    {
        $data = $request->validated();
        $data['slug'] = $data['slug'] ?? Str::slug($data['name']);

        $school = School::create($data);

        \App\Models\SchoolSubscription::startTrialForSchool($school);

        activity()
            ->causedBy($request->user())
            ->performedOn($school)
            ->log('School created');

        return redirect()
            ->route('super-admin.schools.index')
            ->with('success', "School \"{$school->name}\" created successfully.");
    }

    public function show(School $school): Response
    {
        $school->load(['academicYears' => fn ($q) => $q->latest()]);
        $school->loadCount('users');

        return Inertia::render('SuperAdmin/Schools/Show', [
            'school' => $school,
        ]);
    }

    public function edit(School $school): Response
    {
        return Inertia::render('SuperAdmin/Schools/Edit', [
            'school' => $school,
        ]);
    }

    public function update(SchoolRequest $request, School $school): RedirectResponse
    {
        $school->update($request->validated());

        activity()
            ->causedBy($request->user())
            ->performedOn($school)
            ->log('School updated');

        return redirect()
            ->route('super-admin.schools.index')
            ->with('success', "School \"{$school->name}\" updated.");
    }

    public function suspend(Request $request, School $school): RedirectResponse
    {
        $school->update(['status' => 'suspended']);

        activity()
            ->causedBy($request->user())
            ->performedOn($school)
            ->log('School suspended');

        return back()->with('success', "School \"{$school->name}\" suspended.");
    }

    public function activate(Request $request, School $school): RedirectResponse
    {
        $school->update(['status' => 'active']);

        activity()
            ->causedBy($request->user())
            ->performedOn($school)
            ->log('School activated');

        return back()->with('success', "School \"{$school->name}\" activated.");
    }

    public function approveRegistration(Request $request, School $school): RedirectResponse
    {
        if ($school->isRegistrationApproved()) {
            return back()->with('info', "School \"{$school->name}\" is already approved.");
        }

        $school->update([
            'registration_status'           => 'approved',
            'registration_approved_at'      => now(),
            'registration_approved_by'      => $request->user()->id,
            'registration_rejected_at'      => null,
            'registration_rejection_reason' => null,
        ]);

        activity()
            ->causedBy($request->user())
            ->performedOn($school)
            ->log('School registration approved');

        return back()->with('success', "School \"{$school->name}\" registration approved.");
    }

    public function rejectRegistration(Request $request, School $school): RedirectResponse
    {
        $data = $request->validate([
            'reason' => 'nullable|string|max:255',
        ]);

        $school->update([
            'registration_status'           => 'rejected',
            'registration_rejected_at'      => now(),
            'registration_rejection_reason' => $data['reason'] ?? null,
            'registration_approved_at'      => null,
            'registration_approved_by'      => null,
        ]);

        activity()
            ->causedBy($request->user())
            ->performedOn($school)
            ->log('School registration rejected');

        return back()->with('success', "School \"{$school->name}\" registration rejected.");
    }

    public function destroy(School $school): RedirectResponse
    {
        $school->delete();

        return redirect()
            ->route('super-admin.schools.index')
            ->with('success', "School deleted.");
    }
}
