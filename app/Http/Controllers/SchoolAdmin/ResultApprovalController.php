<?php

namespace App\Http\Controllers\SchoolAdmin;

use App\Http\Controllers\Controller;
use App\Models\{Exam, ReportCard, ResultApprovalLog};
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ResultApprovalController extends Controller
{
    /**
     * Approval dashboard — shows items pending approval.
     */
    public function index(Request $request): Response
    {
        $schoolId = $this->getSchoolId();

        $pendingExams = Exam::with(['schoolClass:id,name', 'term:id,name', 'submittedByUser:id,name'])
            ->where('school_id', $schoolId)
            ->whereNotNull('submitted_at')
            ->whereNull('approved_at')
            ->latest('submitted_at')
            ->get();

        $pendingReportCards = ReportCard::with(['student:id,first_name,last_name,admission_no', 'schoolClass:id,name', 'term:id,name'])
            ->where('school_id', $schoolId)
            ->where('status', 'submitted')
            ->latest('submitted_at')
            ->get();

        $recentLogs = ResultApprovalLog::with('user:id,name')
            ->where('school_id', $schoolId)
            ->latest()
            ->take(20)
            ->get();

        return Inertia::render('SchoolAdmin/Approvals/Index', [
            'pendingExams'       => $pendingExams,
            'pendingReportCards' => $pendingReportCards,
            'recentLogs'         => $recentLogs,
            'stats' => [
                'pending_exams'        => $pendingExams->count(),
                'pending_report_cards' => $pendingReportCards->count(),
            ],
        ]);
    }

    /**
     * Approve an exam's marks.
     */
    public function approveExam(Exam $exam, Request $request): RedirectResponse
    {
        abort_unless($exam->school_id === $this->getSchoolId(), 403);

        if (!$exam->isApprovable()) {
            return back()->with('error', 'This exam cannot be approved.');
        }

        $data = $request->validate([
            'notes' => 'nullable|string|max:500',
        ]);

        try {
            $previousState = ['status' => $exam->status, 'submitted_at' => $exam->submitted_at?->toIso8601String()];

            $exam->update([
                'approved_by' => auth()->id(),
                'approved_at' => now(),
                'status'      => 'completed',
                'publication_date' => now(),
            ]);

            ResultApprovalLog::log(
                $this->getSchoolId(),
                $exam,
                auth()->id(),
                'approved',
                $data['notes'] ?? null,
                $previousState,
                ['status' => 'completed', 'approved_at' => now()->toIso8601String()]
            );

            return back()->with('success', 'Exam approved and results published.');
        } catch (\Throwable $e) {
            return back()->with('error', 'Failed to approve: ' . $e->getMessage());
        }
    }

    /**
     * Reject an exam submission.
     */
    public function rejectExam(Exam $exam, Request $request): RedirectResponse
    {
        abort_unless($exam->school_id === $this->getSchoolId(), 403);

        $data = $request->validate([
            'notes' => 'required|string|max:500',
        ]);

        try {
            $previousState = ['status' => $exam->status, 'submitted_at' => $exam->submitted_at?->toIso8601String()];

            $exam->update([
                'submitted_by' => null,
                'submitted_at' => null,
            ]);

            ResultApprovalLog::log(
                $this->getSchoolId(),
                $exam,
                auth()->id(),
                'rejected',
                $data['notes'],
                $previousState,
                ['status' => $exam->status, 'submitted_at' => null]
            );

            return back()->with('success', 'Exam submission rejected. Teacher can re-edit marks.');
        } catch (\Throwable $e) {
            return back()->with('error', 'Failed to reject: ' . $e->getMessage());
        }
    }

    /**
     * Approve a report card.
     */
    public function approveReportCard(ReportCard $reportCard, Request $request): RedirectResponse
    {
        abort_unless($reportCard->school_id === $this->getSchoolId(), 403);

        $data = $request->validate([
            'notes' => 'nullable|string|max:500',
        ]);

        try {
            $previousState = ['status' => $reportCard->status];

            $reportCard->update([
                'status'     => 'approved',
                'approved_by'=> auth()->id(),
                'approved_at'=> now(),
            ]);

            ResultApprovalLog::log(
                $this->getSchoolId(),
                $reportCard,
                auth()->id(),
                'approved',
                $data['notes'] ?? null,
                $previousState,
                ['status' => 'approved']
            );

            return back()->with('success', 'Report card approved.');
        } catch (\Throwable $e) {
            return back()->with('error', 'Failed to approve: ' . $e->getMessage());
        }
    }

    /**
     * Publish approved report cards.
     */
    public function publishReportCard(ReportCard $reportCard): RedirectResponse
    {
        abort_unless($reportCard->school_id === $this->getSchoolId(), 403);

        if ($reportCard->status !== 'approved') {
            return back()->with('error', 'Report card must be approved before publishing.');
        }

        try {
            $reportCard->update([
                'status'       => 'published',
                'published_at' => now(),
            ]);

            ResultApprovalLog::log(
                $this->getSchoolId(),
                $reportCard,
                auth()->id(),
                'published',
                null,
                ['status' => 'approved'],
                ['status' => 'published']
            );

            return back()->with('success', 'Report card published. Parents can now view it.');
        } catch (\Throwable $e) {
            return back()->with('error', 'Failed to publish: ' . $e->getMessage());
        }
    }

    /**
     * Bulk approve report cards for a class/term.
     */
    public function bulkApprove(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'academic_year_id' => 'required|exists:academic_years,id',
            'term_id'          => 'nullable|exists:academic_terms,id',
            'class_id'         => 'required|exists:classes,id',
        ]);

        $updated = ReportCard::where('school_id', $this->getSchoolId())
            ->where('academic_year_id', $data['academic_year_id'])
            ->when(!empty($data['term_id']), fn ($q) => $q->where('term_id', $data['term_id']))
            ->where('class_id', $data['class_id'])
            ->where('status', 'submitted')
            ->update([
                'status'      => 'approved',
                'approved_by' => auth()->id(),
                'approved_at' => now(),
            ]);

        return back()->with('success', "{$updated} report cards approved.");
    }
}
