<?php

namespace App\Services;

use App\Models\{FeePayment, User, AuditLog};

class FeeWaiverApprovalService
{
    const WAIVER_THRESHOLD = 50000; // Le 50,000 — multi-step required above this

    /**
     * Determine if a fee waiver/discount requires multi-step approval.
     * Single-step: school-admin or accountant can approve
     * Multi-step: requires school-admin + principal approval
     */
    public static function requiresMultiStep(float $discountAmount, float $totalDue): bool
    {
        $waiverPercentage = ($discountAmount / max($totalDue, 1)) * 100;
        return $discountAmount > self::WAIVER_THRESHOLD || $waiverPercentage > 25;
    }

    /**
     * Create a pending waiver approval request.
     */
    public static function requestWaiver(FeePayment $payment, float $discountAmount, string $reason): array
    {
        if (!self::requiresMultiStep($discountAmount, $payment->amount_due)) {
            // Single-step: auto-approve by current user
            $payment->update(['discount' => $discountAmount, 'status' => 'partial']);
            return ['status' => 'approved', 'message' => 'Waiver approved (single-step).'];
        }

        // Store multi-step approval request in pending_approvals
        $currentApprover = auth()->id();
        $pendingApprovals = json_decode($payment->pending_approvals ?? '[]', true);
        $pendingApprovals[] = [
            'step' => 1,
            'approver_id' => $currentApprover,
            'status' => 'approved',
            'approved_at' => now()->toIso8601String(),
            'discount' => $discountAmount,
            'reason' => $reason,
        ];

        $payment->update([
            'pending_approvals' => json_encode($pendingApprovals),
            'status' => 'pending_approval',
        ]);

        return [
            'status' => 'pending_second_approval',
            'message' => 'Waiver requires principal approval (above Le ' . number_format(self::WAIVER_THRESHOLD) . ' threshold).',
        ];
    }

    /**
     * Second-step approval by principal.
     */
    public static function secondStepApproval(FeePayment $payment, bool $approved, string $notes = null): array
    {
        $pendingApprovals = json_decode($payment->pending_approvals ?? '[]', true);
        
        if (empty($pendingApprovals)) {
            return ['status' => 'error', 'message' => 'No pending approvals found.'];
        }

        $step1 = $pendingApprovals[0];
        $discount = $step1['discount'];

        if ($approved) {
            $step1['second_approver_id'] = auth()->id();
            $step1['second_approved_at'] = now()->toIso8601String();
            $pendingApprovals[0] = $step1;
            
            $payment->update([
                'discount' => $discount,
                'pending_approvals' => json_encode($pendingApprovals),
                'status' => 'partial',
            ]);

            AuditLog::create([
                'school_id' => auth()->user()->school_id,
                'user_id' => auth()->id(),
                'event' => 'fee_waiver_approved',
                'auditable_type' => FeePayment::class,
                'auditable_id' => $payment->id,
                'new_values' => ['discount' => $discount, 'step' => 2],
                'ip_address' => request()->ip(),
            ]);

            NotificationDispatchService::notifyUser(
                User::find($step1['approver_id']),
                'Fee Waiver Approved',
                'A fee waiver of Le ' . number_format($discount, 2) . ' has been approved by the principal.'
            );

            return ['status' => 'approved', 'message' => 'Waiver approved.'];
        } else {
            $step1['second_rejected_at'] = now()->toIso8601String();
            $step1['rejection_notes'] = $notes;
            $pendingApprovals[0] = $step1;
            
            $payment->update([
                'pending_approvals' => json_encode($pendingApprovals),
                'status' => 'active',
            ]);

            return ['status' => 'rejected', 'message' => 'Waiver rejected.'];
        }
    }
}
