<?php

namespace App\Http\Controllers;

use App\Models\{Attendance, AuditLog, User};
use Illuminate\Http\Request;
use Carbon\Carbon;

class AttendanceApprovalController extends Controller
{
    public function approve(Request $request, string $date, string $classId)
    {
        $attendances = Attendance::where('date', $date)
            ->whereHas('attendable', fn ($q) => $q->where('class_id', $classId))
            ->whereNull('approved_at')
            ->get();

        if ($attendances->isEmpty()) {
            return back()->with('error', 'No pending attendance records found for this date/class.');
        }

        try {
            $attendances->each(function (Attendance $att) {
                $att->update([
                    'approved_at' => now(),
                    'approved_by' => auth()->id(),
                ]);
            });

            AuditLog::create([
                'school_id' => auth()->user()->school_id,
                'user_id' => auth()->id(),
                'event' => 'attendance_approved',
                'auditable_type' => Attendance::class,
                'auditable_id' => 0,
                'new_values' => ['date' => $date, 'class_id' => $classId, 'count' => $attendances->count()],
                'ip_address' => request()->ip(),
            ]);

            \App\Services\NotificationDispatchService::onAttendanceApproved(
                auth()->user()->school_id,
                $date,
                (int) $classId,
                auth()->id()
            );

            return back()->with('success', "{$attendances->count()} attendance records approved and locked.");
        } catch (\Throwable $e) {
            return back()->with('error', 'Failed to approve attendance: ' . $e->getMessage());
        }
    }

    public function bulkApprove(Request $request)
    {
        $data = $request->validate([
            'date' => 'required|date',
            'class_ids' => 'required|array',
        ]);

        try {
            $total = 0;

            foreach ($data['class_ids'] as $classId) {
                $attendances = Attendance::where('date', $data['date'])
                    ->whereHas('attendable', fn ($q) => $q->where('class_id', $classId))
                    ->whereNull('approved_at')
                    ->get();

                $attendances->each(fn ($att) => $att->update(['approved_at' => now(), 'approved_by' => auth()->id()]));

                $total += $attendances->count();
            }

            AuditLog::create([
                'school_id' => auth()->user()->school_id,
                'user_id' => auth()->id(),
                'event' => 'attendance_bulk_approved',
                'auditable_type' => Attendance::class,
                'auditable_id' => 0,
                'new_values' => ['date' => $data['date'], 'class_ids' => $data['class_ids'], 'count' => $total],
                'ip_address' => request()->ip(),
            ]);

            return back()->with('success', "{$total} attendance records approved and locked.");
        } catch (\Throwable $e) {
            return back()->with('error', 'Failed to bulk approve attendance: ' . $e->getMessage());
        }
    }
}
