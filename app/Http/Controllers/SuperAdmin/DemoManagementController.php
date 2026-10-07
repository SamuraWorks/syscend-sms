<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\DemoRequest;
use App\Models\DemoRequestNote;
use App\Models\DemoRequestStatusHistory;
use App\Models\User;
use App\Services\SchoolAdminOnboardingService;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;

class DemoManagementController extends Controller
{
    public function index(Request $request)
    {
        $query = DemoRequest::with('assignee');

        if ($request->search) {
            $query->where(function ($q) use ($request) {
                $q->where('school_name', 'like', "%{$request->search}%")
                  ->orWhere('contact_name', 'like', "%{$request->search}%")
                  ->orWhere('request_id', 'like', "%{$request->search}%")
                  ->orWhere('district', 'like', "%{$request->search}%");
            });
        }

        if ($request->status && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        if ($request->district) {
            $query->where('district', $request->district);
        }

        if ($request->assigned_to) {
            $query->where('assigned_to', $request->assigned_to);
        }

        if ($request->date_from) {
            $query->where('created_at', '>=', $request->date_from);
        }

        if ($request->date_to) {
            $query->where('created_at', '<=', $request->date_to . ' 23:59:59');
        }

        $requests = $query->latest()->paginate(20)->withQueryString();

        $districts = DemoRequest::distinct()->pluck('district')->sort()->values();
        $staff = User::where('status', 'active')->orderBy('name')->get(['id', 'name']);

        $stats = [
            'total'          => DemoRequest::count(),
            'today'          => DemoRequest::whereDate('created_at', today())->count(),
            'this_week'      => DemoRequest::where('created_at', '>=', now()->startOfWeek())->count(),
            'this_month'     => DemoRequest::where('created_at', '>=', now()->startOfMonth())->count(),
            'new'            => DemoRequest::where('status', 'new')->count(),
            'contacted'      => DemoRequest::where('status', 'contacted')->count(),
            'scheduled'      => DemoRequest::where('status', 'demo_scheduled')->count(),
            'completed'      => DemoRequest::where('status', 'demo_completed')->count(),
            'follow_up'      => DemoRequest::where('status', 'follow_up_required')->count(),
            'converted'      => DemoRequest::where('status', 'converted')->count(),
            'closed'         => DemoRequest::where('status', 'closed')->count(),
            'top_districts'  => DemoRequest::selectRaw('district, count(*) as cnt')->groupBy('district')->orderByDesc('cnt')->limit(5)->pluck('cnt', 'district'),
            'school_types'   => DemoRequest::selectRaw('school_type, count(*) as cnt')->groupBy('school_type')->orderByDesc('cnt')->pluck('cnt', 'school_type'),
            'avg_students'   => round(DemoRequest::avg('number_of_students') ?? 0),
        ];

        return Inertia::render('SuperAdmin/DemoRequests/Index', [
            'requests'  => [
                'data' => $requests->items(),
                'meta' => [
                    'total'        => $requests->total(),
                    'per_page'     => $requests->perPage(),
                    'current_page' => $requests->currentPage(),
                    'last_page'    => $requests->lastPage(),
                ],
            ],
            'filters'   => $request->only(['search', 'status', 'district', 'assigned_to', 'date_from', 'date_to']),
            'districts' => $districts,
            'staff'     => $staff,
            'stats'     => $stats,
        ]);
    }

    public function show(DemoRequest $demoRequest)
    {
        $demoRequest->load(['assignee', 'notes.user', 'statusHistory.user', 'convertedSchool']);

        return Inertia::render('SuperAdmin/DemoRequests/Show', [
            'request' => $demoRequest,
            'staff'   => User::where('status', 'active')->orderBy('name')->get(['id', 'name']),
        ]);
    }

    /**
     * Approve a demo request for onboarding: creates the School and provisions
     * the requester as the School Admin. Idempotent — a request that already
     * produced a school (or was already marked converted) cannot be converted twice.
     */
    public function convertToSchool(Request $request, DemoRequest $demoRequest)
    {
        if ($demoRequest->status === 'converted' || $demoRequest->convertedSchool) {
            return redirect()
                ->route('super-admin.demo-requests.show', $demoRequest)
                ->with('error', 'This demo request has already been converted to a school.');
        }

        $base = Str::slug($demoRequest->school_name);
        $slug = $base;
        $i = 2;
        while (\App\Models\School::where('slug', $slug)->exists()) {
            $slug = $base . '-' . ($i++);
        }

        $schoolData = [
            'name'            => $demoRequest->school_name,
            'slug'            => $slug,
            'email'           => $demoRequest->contact_email,
            'phone'           => $demoRequest->contact_phone,
            'city'            => $demoRequest->district,
            'school_level'    => $demoRequest->school_level,
            'demo_request_id' => $demoRequest->id,
        ];

        // schools.school_type enum does not include 'faith_based'; leave the
        // column to its default rather than triggering an enum violation.
        if (in_array($demoRequest->school_type, ['government', 'government_assisted', 'private', 'community'], true)) {
            $schoolData['school_type'] = $demoRequest->school_type;
        }

        $result = (new SchoolAdminOnboardingService)->createSchoolWithAdmin(
            $schoolData,
            [
                'name'  => $demoRequest->contact_name,
                'email' => $demoRequest->contact_email,
                'phone' => $demoRequest->contact_phone,
            ],
            auth()->id()
        );

        $oldStatus = $demoRequest->status;
        $demoRequest->update(['status' => 'converted']);

        DemoRequestStatusHistory::create([
            'demo_request_id' => $demoRequest->id,
            'user_id'         => auth()->id(),
            'old_status'      => $oldStatus,
            'new_status'      => 'converted',
            'notes'           => 'Approved for onboarding — school created and School Admin provisioned.',
        ]);

        activity()
            ->causedBy(auth()->user())
            ->performedOn($result['school'])
            ->withProperties([
                'demo_request_id'  => $demoRequest->id,
                'admin_id'         => $result['admin']->id,
                'admin_email'      => $result['admin']->email,
                'temp_generated'   => true,
            ])
            ->log('Demo request converted — school and School Admin created');

        return redirect()
            ->route('super-admin.demo-requests.show', $demoRequest)
            ->with('temp_password', $result['temp_password'])
            ->with('show_credentials', true)
            ->with('success', "School \"{$result['school']->name}\" created. {$result['admin']->name} is now the School Admin (temporary credentials shown below).");
    }

    public function updateStatus(Request $request, DemoRequest $demoRequest)
    {
        $data = $request->validate([
            'status' => 'required|in:new,contacted,demo_scheduled,demo_completed,follow_up_required,converted,closed',
            'notes'  => 'nullable|string|max:1000',
        ]);

        $oldStatus = $demoRequest->status;
        $demoRequest->update(['status' => $data['status']]);

        DemoRequestStatusHistory::create([
            'demo_request_id' => $demoRequest->id,
            'user_id'         => auth()->id(),
            'old_status'      => $oldStatus,
            'new_status'      => $data['status'],
            'notes'           => $data['notes'] ?? null,
        ]);

        return back()->with('success', 'Status updated.');
    }

    public function assign(Request $request, DemoRequest $demoRequest)
    {
        $data = $request->validate([
            'assigned_to' => 'required|exists:users,id',
        ]);

        $demoRequest->update(['assigned_to' => $data['assigned_to']]);

        return back()->with('success', 'Request assigned.');
    }

    public function addNote(Request $request, DemoRequest $demoRequest)
    {
        $data = $request->validate([
            'note' => 'required|string|max:2000',
            'type' => 'required|in:call,whatsapp,email,internal,follow_up',
        ]);

        DemoRequestNote::create([
            'demo_request_id' => $demoRequest->id,
            'user_id'         => auth()->id(),
            'note'            => $data['note'],
            'type'            => $data['type'],
        ]);

        return back()->with('success', 'Note added.');
    }
}
