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

        $insights = $this->schoolInsights($summary, $attendanceRate, $alerts, $role);

        return [
            'role' => $role, 'title' => $roleCopy[0], 'description' => $roleCopy[1],
            'source_status' => $scores->isEmpty() && $attendance->isEmpty() ? 'limited' : 'connected',
            'summary' => $summary,
            'insights' => $insights,
            'voice_report' => $this->voiceReport($role, $insights),
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
        $insights = $this->studentInsights($profile);
        return [
            'role' => 'student',
            'title' => 'Personal learning intelligence',
            'description' => 'A private view of your academic progress, attendance, and next steps.',
            'profile' => $profile,
            'insights' => $insights,
            'voice_report' => $this->voiceReport('student', $insights),
            'ai' => ['available' => false, 'message' => 'AI explanations use your verified results and clearly identify any missing evidence.'],
        ];
    }

    public function parent(int $schoolId, int $userId): array
    {
        $guardian = \App\Models\Guardian::where('school_id', $schoolId)->where('user_id', $userId)->first();
        $children = $guardian ? $guardian->students : collect();
        $insights = [];
        foreach ($children as $child) {
            $profile = (new StudentPerformanceEngine($schoolId))->getStudentProfile($child);
            $score = $profile['current_score'] ?? null;
            $value = is_object($score) ? ($score->total_score ?? null) : (is_array($score) ? ($score['total_score'] ?? null) : null);
            $insights[] = ['type' => 'family', 'title' => $child->full_name . ' progress', 'message' => $value === null ? 'No current score is available for this child.' : "The latest recorded score is {$value}%. Review the detailed report for subject-level context.", 'priority' => 'normal'];
        }
        return ['role' => 'parent', 'insights' => $insights, 'recommendations' => ['Discuss any declining subject with your child and the relevant teacher.', 'Review attendance and upcoming academic deadlines together.'], 'voice_report' => 'Good morning. Here is your family academic report. ' . collect($insights)->pluck('message')->implode(' '), 'ai' => ['message' => 'This report is limited to verified records belonging to your linked children.']];
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

    private function schoolInsights(array $summary, ?float $attendanceRate, $alerts, string $role): array
    {
        $insights = [];
        if (($summary['average_score'] ?? 0) > 0) {
            $insights[] = ['type' => 'academic', 'title' => 'Academic performance', 'message' => sprintf('The current school average is %s%% across %d recorded performance records.', $summary['average_score'], $summary['total_students']), 'priority' => ($summary['critical_count'] ?? 0) > 0 ? 'high' : 'normal'];
        }
        if (($summary['needs_support_count'] ?? 0) + ($summary['critical_count'] ?? 0) > 0) {
            $insights[] = ['type' => 'intervention', 'title' => 'Students need attention', 'message' => sprintf('%d students are classified as needing support or critical intervention.', ($summary['needs_support_count'] ?? 0) + ($summary['critical_count'] ?? 0)), 'priority' => 'high'];
        }
        if ($attendanceRate !== null && $attendanceRate < 90) {
            $insights[] = ['type' => 'attendance', 'title' => 'Attendance is below target', 'message' => sprintf('Attendance is %s%%. Review recurring absence patterns and assign follow-up.', $attendanceRate), 'priority' => 'medium'];
        }
        if ($alerts->count() > 0) {
            $insights[] = ['type' => 'alert', 'title' => 'Open alerts require triage', 'message' => sprintf('%d unresolved alerts are available to the responsible staff.', $alerts->count()), 'priority' => 'medium'];
        }
        return $insights ?: [['type' => 'monitoring', 'title' => 'No urgent signal detected', 'message' => 'Continue monitoring the next assessment and attendance cycle.', 'priority' => 'normal']];
    }

    private function studentInsights(array $profile): array
    {
        $current = $profile['current_score'] ?? null;
        $metadata = is_object($current) ? ($current->metadata ?? []) : (is_array($current) ? ($current['metadata'] ?? []) : []);
        $homework = $metadata['homework_detail'] ?? [];
        $attendance = $metadata['attendance_detail'] ?? [];
        $subjectScores = is_object($current) ? ($current->subject_scores ?? []) : ($current['subject_scores'] ?? []);
        $insights = [];
        foreach ($subjectScores as $subject) {
            $percentage = (float) ($subject['percentage'] ?? 0);
            if ($percentage < 60) $insights[] = ['type' => 'subject', 'title' => ($subject['subject_name'] ?? 'Subject') . ' needs attention', 'message' => sprintf('Your recorded average is %s%%. Spend focused time on practice and review with your teacher.', $percentage), 'priority' => 'high'];
        }
        if (($homework['missing'] ?? 0) > 0) $insights[] = ['type' => 'assignment', 'title' => 'Outstanding assignments', 'message' => sprintf('You have %d outstanding assignment(s). Completing them is your immediate priority.', $homework['missing']), 'priority' => 'high'];
        if (($attendance['percentage'] ?? 100) < 90) $insights[] = ['type' => 'attendance', 'title' => 'Attendance needs attention', 'message' => sprintf('Your attendance is %s%%. Consistent attendance will support your progress.', $attendance['percentage']), 'priority' => 'medium'];
        return $insights ?: [['type' => 'progress', 'title' => 'Good progress', 'message' => 'No urgent academic signal was detected in the available records. Maintain your current routine.', 'priority' => 'normal']];
    }

    private function voiceReport(string $role, array $insights): string
    {
        $opening = $role === 'student' ? 'Hello. Here is your latest academic progress report.' : 'Good morning. Here is your latest Syscend Intelligence report.';
        return $opening . ' ' . collect($insights)->pluck('message')->implode(' ') . ' I will continue monitoring the verified records and help you decide the next practical action.';
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
