<?php

namespace App\Services;

use App\Models\AdmissionInquiry;
use App\Models\Attendance;
use App\Models\BookIssue;
use App\Models\FeePayment;
use App\Models\HostelAllocation;
use App\Models\InventoryItem;
use App\Models\Student;
use App\Models\StudentAlert;
use App\Models\SuccessScore;
use Illuminate\Support\Facades\DB;

/** Shared, deterministic intelligence layer. It never invents source data. */
final class SyscendIntelligenceService
{
    public function school(int $schoolId, string $role): array
    {
        $engine = new StudentPerformanceEngine($schoolId);
        $summary = $engine->getSummaryStats();
        $scores = SuccessScore::where('school_id', $schoolId)->latest()->get();
        $students = Student::where('school_id', $schoolId)->where('status', 'active');
        $attendance = Attendance::where('school_id', $schoolId)->get();
        $attendanceRate = $attendance->count() ? round($attendance->whereIn('status', ['present', 'late'])->count() / $attendance->count() * 100, 1) : null;

        $roleCopy = [
            'school-admin' => ['School operations', 'Enrollment, attendance, academics, and data quality signals for your school.'],
            'principal' => ['Institutional performance', 'Academic and attendance signals that support school-wide decisions.'],
            'teacher' => ['Classroom intelligence', 'Evidence from your school records to guide teaching and intervention.'],
            'proprietor' => ['Strategic school intelligence', 'High-level indicators for sustainable school improvement.'],
            'accountant' => ['Financial intelligence', 'Financial intelligence is limited to records available in the current finance module.'],
            'librarian' => ['Library intelligence', 'Use circulation and inventory records to focus library activity.'],
            'receptionist' => ['Admissions intelligence', 'Registration activity and data-quality follow-ups from the school record.'],
            'driver' => ['Transport intelligence', 'Transport indicators are shown only when transport records exist.'],
            'warden' => ['Boarding intelligence', 'Boarding and welfare indicators are shown only when records exist.'],
            'store-manager' => ['Inventory intelligence', 'Stock and movement indicators are shown only when inventory records exist.'],
        ][$role] ?? ['Syscend Intelligence', 'Evidence-backed insights from your authorized campus records.'];

        $alerts = StudentAlert::where('school_id', $schoolId)->where('is_read', false)->latest()->limit(8)->get(['id', 'title', 'message', 'severity', 'created_at']);
        $dataQuality = [
            ['label' => 'Active students', 'value' => $students->count(), 'source' => 'students'],
            ['label' => 'Performance records', 'value' => $scores->count(), 'source' => 'success_scores'],
            ['label' => 'Attendance records', 'value' => $attendance->count(), 'source' => 'attendance'],
        ];

        return [
            'role' => $role, 'title' => $roleCopy[0], 'description' => $roleCopy[1],
            'source_status' => $scores->isEmpty() && $attendance->isEmpty() ? 'limited' : 'connected',
            'summary' => $summary,
            'metrics' => [
                ['label' => 'Active students', 'value' => $students->count(), 'tone' => 'indigo'],
                ['label' => 'Average score', 'value' => round((float) ($summary['average_score'] ?? 0), 1) . '%', 'tone' => 'violet'],
                ['label' => 'Attendance rate', 'value' => $attendanceRate === null ? 'No data' : $attendanceRate . '%', 'tone' => 'emerald'],
                ['label' => 'Open alerts', 'value' => $alerts->count(), 'tone' => 'amber'],
            ],
            'trends' => [
                ['label' => 'Excellent / good', 'value' => (int) ($summary['excellent_count'] ?? 0) + (int) ($summary['good_count'] ?? 0)],
                ['label' => 'Needs support', 'value' => (int) ($summary['needs_support_count'] ?? 0) + (int) ($summary['critical_count'] ?? 0)],
                ['label' => 'Attendance records', 'value' => $attendance->count()],
            ],
            'alerts' => $alerts,
            'data_quality' => $dataQuality,
            'role_metrics' => $this->roleMetrics($schoolId, $role),
            'recommendations' => $this->recommendations($summary, $attendanceRate, $alerts->count()),
            'ai' => ['available' => false, 'message' => 'AI explanations are unavailable until a server-side provider is configured. Calculations above are deterministic and sourced from campus records.'],
        ];
    }

    public function student(int $schoolId, int $userId): array
    {
        $student = Student::where('school_id', $schoolId)->where('user_id', $userId)->firstOrFail();
        $profile = (new StudentPerformanceEngine($schoolId))->getStudentProfile($student);
        return ['role' => 'student', 'title' => 'Personal learning intelligence', 'description' => 'A private view of your academic progress, attendance, and next steps.', 'profile' => $profile, 'ai' => ['available' => false, 'message' => 'AI explanations are unavailable; this view uses your recorded results only.']];
    }

    public function unavailable(string $role): array
    {
        return [
            'role' => $role,
            'title' => 'Syscend Intelligence',
            'description' => 'Intelligence is temporarily unavailable while the campus data connection is checked.',
            'source_status' => 'limited',
            'metrics' => [],
            'trends' => [],
            'alerts' => [],
            'data_quality' => [],
            'recommendations' => ['Please try again later or contact your school administrator if this continues.'],
            'ai' => ['available' => false, 'message' => 'No insight was generated because the underlying campus data could not be read.'],
        ];
    }

    private function roleMetrics(int $schoolId, string $role): array
    {
        return match ($role) {
            'accountant', 'proprietor' => [
                ['label' => 'Collected fees', 'value' => (float) FeePayment::where('school_id', $schoolId)->sum('amount_paid')],
                ['label' => 'Outstanding balance', 'value' => (float) FeePayment::where('school_id', $schoolId)->selectRaw('COALESCE(SUM(amount_due + fine - discount - amount_paid), 0) as balance')->value('balance')],
            ],
            'librarian' => [
                ['label' => 'Active issues', 'value' => BookIssue::where('school_id', $schoolId)->where('status', '!=', 'returned')->count()],
                ['label' => 'Overdue issues', 'value' => BookIssue::where('school_id', $schoolId)->where('status', '!=', 'returned')->whereDate('due_date', '<', now())->count()],
            ],
            'receptionist' => [
                ['label' => 'Pending admissions', 'value' => AdmissionInquiry::where('school_id', $schoolId)->whereIn('status', ['new', 'pending', 'follow_up'])->count()],
                ['label' => 'Incomplete registrations', 'value' => Student::where('school_id', $schoolId)->where('registration_status', '!=', 'approved')->count()],
            ],
            'store-manager' => [
                ['label' => 'Low-stock items', 'value' => InventoryItem::where('school_id', $schoolId)->whereColumn('current_stock', '<=', 'minimum_stock')->count()],
                ['label' => 'Active inventory', 'value' => InventoryItem::where('school_id', $schoolId)->where('is_active', true)->count()],
            ],
            'warden' => [
                ['label' => 'Active allocations', 'value' => HostelAllocation::where('school_id', $schoolId)->where('status', 'active')->count()],
                ['label' => 'Recorded departures', 'value' => HostelAllocation::where('school_id', $schoolId)->whereNotNull('leaving_date')->count()],
            ],
            default => [],
        };
    }

    private function recommendations(array $summary, ?float $attendanceRate, int $openAlerts): array
    {
        $items = [];
        if (($summary['critical_count'] ?? 0) > 0 || ($summary['needs_support_count'] ?? 0) > 0) $items[] = 'Review students requiring support and assign documented interventions.';
        if ($attendanceRate !== null && $attendanceRate < 90) $items[] = 'Review attendance patterns and follow up on recurring absence.';
        if ($openAlerts > 0) $items[] = 'Triage open alerts with the responsible staff before the next reporting cycle.';
        return $items ?: ['Continue monitoring the next assessment and attendance cycle; no urgent signal is currently available.'];
    }
}
