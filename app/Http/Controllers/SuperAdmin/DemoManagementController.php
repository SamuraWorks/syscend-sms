<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\DemoRequest;
use App\Models\DemoRequestNote;
use App\Models\DemoRequestStatusHistory;
use App\Models\User;
use Illuminate\Http\Request;
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
        $demoRequest->load(['assignee', 'notes.user', 'statusHistory.user']);

        return Inertia::render('SuperAdmin/DemoRequests/Show', [
            'request' => $demoRequest,
            'staff'   => User::where('status', 'active')->orderBy('name')->get(['id', 'name']),
        ]);
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
