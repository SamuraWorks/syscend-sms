<?php

namespace App\Http\Controllers;

use App\Models\{ResultChangeRequest, Mark, User};
use Illuminate\Http\Request;
use Inertia\Inertia;

class ResultChangeRequestController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $query = ResultChangeRequest::with(['mark.student', 'mark.exam', 'mark.subject', 'requester', 'reviewer']);

        if ($user->hasRole('student')) {
            $query->where('requested_by', $user->id);
        } elseif ($user->hasRole('parent')) {
            $guardian = \App\Models\Guardian::where('user_id', $user->id)->first();
            $studentIds = $guardian?->students()->pluck('id') ?? collect();
            $query->whereIn('mark_id', Mark::whereIn('student_id', $studentIds)->pluck('id'));
        }

        $requests = $query->latest()->paginate(15);

        return Inertia::render('SchoolAdmin/ResultChangeRequests/Index', [
            'requests' => $requests,
            'linked' => $user->hasRole(['super-admin', 'school-admin', 'principal']),
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'mark_id' => 'required|exists:marks,id',
            'requested_marks' => 'required|numeric|min:0|max:100',
            'reason' => 'required|string|min:10',
        ]);

        try {
            $mark = Mark::findOrFail($data['mark_id']);

            $resultChangeRequest = ResultChangeRequest::create([
                'school_id' => $mark->school_id,
                'mark_id' => $data['mark_id'],
                'requested_by' => $request->user()->id,
                'original_marks' => $mark->marks_obtained,
                'requested_marks' => $data['requested_marks'],
                'reason' => $data['reason'],
            ]);

            \App\Services\NotificationDispatchService::onResultChangeRequested(
                $mark->school_id,
                $resultChangeRequest->id,
                $request->user()->id
            );

            return back()->with('success', 'Change request submitted for approval.');
        } catch (\Throwable $e) {
            return back()->withInput()->with('error', 'Failed to submit request: ' . $e->getMessage());
        }
    }

    public function approve(ResultChangeRequest $resultChangeRequest)
    {
        $this->authorize('update', $resultChangeRequest);

        try {
            $resultChangeRequest->update([
                'status' => 'approved',
                'reviewed_by' => auth()->id(),
                'reviewed_at' => now(),
            ]);

            Mark::withoutGlobalScopes()->where('id', $resultChangeRequest->mark_id)->update([
                'marks_obtained' => $resultChangeRequest->requested_marks,
            ]);

            \App\Services\NotificationDispatchService::onResultChangeReviewed(
                auth()->user()->school_id,
                $resultChangeRequest->id,
                $resultChangeRequest->requested_by,
                'approved'
            );

            \App\Models\AuditLog::create([
                'school_id' => auth()->user()->school_id,
                'user_id' => auth()->id(),
                'event' => 'result_change_approved',
                'auditable_type' => Mark::class,
                'auditable_id' => $resultChangeRequest->mark_id,
                'old_values' => ['marks_obtained' => $resultChangeRequest->original_marks],
                'new_values' => ['marks_obtained' => $resultChangeRequest->requested_marks],
                'ip_address' => request()->ip(),
            ]);

            return back()->with('success', 'Result updated and audit logged.');
        } catch (\Throwable $e) {
            return back()->with('error', 'Failed to approve request: ' . $e->getMessage());
        }
    }

    public function reject(ResultChangeRequest $resultChangeRequest)
    {
        $this->authorize('update', $resultChangeRequest);

        try {
            $resultChangeRequest->update([
                'status' => 'rejected',
                'reviewed_by' => auth()->id(),
                'reviewed_at' => now(),
                'reviewer_notes' => request('reviewer_notes'),
            ]);

            \App\Services\NotificationDispatchService::onResultChangeReviewed(
                auth()->user()->school_id,
                $resultChangeRequest->id,
                $resultChangeRequest->requested_by,
                'rejected'
            );

            return back()->with('success', 'Request rejected.');
        } catch (\Throwable $e) {
            return back()->with('error', 'Failed to reject request: ' . $e->getMessage());
        }
    }
}
