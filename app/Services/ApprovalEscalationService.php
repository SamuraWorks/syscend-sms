<?php

namespace App\Services;

use App\Models\{User, ResultChangeRequest, FeePayment, LeaveRequest};
use Carbon\Carbon;

class ApprovalEscalationService
{
    /**
     * Check for pending approvals older than 48 hours and escalate.
     */
    public static function checkEscalations(): array
    {
        $escalated = [];
        $threshold = now()->subHours(48);

        // Escalate old result change requests
        $oldRequests = ResultChangeRequest::where('status', 'pending')
            ->where('created_at', '<', $threshold)
            ->with(['requester', 'mark.student'])
            ->get();

        foreach ($oldRequests as $request) {
            self::escalate($request, 'result-change-request', $request->reason);
            $escalated[] = ['type' => 'result-change-request', 'id' => $request->id];
        }

        return $escalated;
    }

    private static function escalate($model, string $type, string $reason): void
    {
        // Notify principal and school-admin
        $schoolId = $model->school_id;
        
        NotificationDispatchService::notifyRole($schoolId, 'principal',
            'Approval Escalation',
            "A {$type} has been pending for over 48 hours and requires immediate attention."
        );
        
        NotificationDispatchService::notifyRole($schoolId, 'school-admin',
            'Approval Escalation',
            "A {$type} has been pending for over 48 hours and requires immediate attention."
        );

        AuditLog::create([
            'school_id' => $schoolId,
            'user_id' => 0,
            'event' => 'approval_escalated',
            'auditable_type' => get_class($model),
            'auditable_id' => $model->id,
            'new_values' => ['type' => $type, 'reason' => $reason, 'escalated_at' => now()->toIso8601String()],
            'ip_address' => null,
        ]);
    }
}
