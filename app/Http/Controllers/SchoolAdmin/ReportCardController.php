<?php

namespace App\Http\Controllers\SchoolAdmin;

use App\Http\Controllers\Controller;
use App\Models\AcademicTerm;
use App\Models\AcademicYear;
use App\Models\Attendance;
use App\Models\Exam;
use App\Models\GradeScale;
use App\Models\Mark;
use App\Models\ReportCard;
use App\Models\ReportCardTemplate;
use App\Models\ResultApprovalLog;
use App\Models\SchoolClass;
use App\Models\SchoolSetting;
use App\Models\Section;
use App\Models\Student;
use App\Models\Subject;
use App\Services\GradingService;
use App\Services\NotificationDispatchService;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class ReportCardController extends Controller
{
    public function index(Request $request): Response
    {
        $reportCards = ReportCard::with(['student:id,first_name,last_name,admission_no', 'schoolClass:id,name', 'term:id,name'])
            ->when($request->class_id, fn ($q) => $q->where('class_id', $request->class_id))
            ->when($request->term_id, fn ($q) => $q->where('term_id', $request->term_id))
            ->when($request->status, fn ($q) => $q->where('status', $request->status))
            ->latest()
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('SchoolAdmin/ReportCards/Index', [
            'reportCards' => [
                'data' => $reportCards->items(),
                'meta' => [
                    'total'        => $reportCards->total(),
                    'current_page' => $reportCards->currentPage(),
                    'last_page'    => $reportCards->lastPage(),
                ],
                'links' => ['prev' => $reportCards->previousPageUrl(), 'next' => $reportCards->nextPageUrl()],
            ],
            'classes'      => SchoolClass::orderBy('numeric_name')->get(['id', 'name']),
            'terms'        => AcademicTerm::where('school_id', $this->getSchoolId())->get(['id', 'name']),
            'academicYears' => AcademicYear::where('school_id', $this->getSchoolId())->orderByDesc('is_current')->get(['id', 'name', 'is_current']),
            'filters'      => $request->only('class_id', 'term_id', 'status'),
        ]);
    }

    public function generate(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'class_id'        => 'required|exists:classes,id',
            'term_id'         => 'required|exists:academic_terms,id',
            'academic_year_id' => 'required|exists:academic_years,id',
            'section_id'      => 'nullable|exists:sections,id',
        ]);

        $schoolId = $this->getSchoolId();
        $grading  = new GradingService($schoolId);

        $students = Student::where('class_id', $data['class_id'])
            ->when($data['section_id'] ?? null, fn ($q) => $q->where('section_id', $data['section_id']))
            ->where('status', 'active')
            ->with('section:id,name')
            ->orderBy('roll_no')
            ->get();

        $subjects = Subject::where('class_id', $data['class_id'])->orderBy('name')->get();
        $term     = AcademicTerm::findOrFail($data['term_id']);

        $exams = Exam::where('school_id', $schoolId)
            ->where('class_id', $data['class_id'])
            ->where('term_id', $data['term_id'])
            ->where('status', 'completed')
            ->get();

        $examIds = $exams->pluck('id');

        try {
            DB::transaction(function () use ($students, $subjects, $examIds, $schoolId, $data, $term, $grading, $exams) {
                foreach ($students as $student) {
                    $subjectData = [];
                    $totalObtained = 0;
                    $totalFull     = 0;

                    $caWeight   = (float) SchoolSetting::get($schoolId, 'ca_weight', 40);
                    $examWeight = (float) SchoolSetting::get($schoolId, 'exam_weight', 60);

                    foreach ($subjects as $subject) {
                        $marks = Mark::where('student_id', $student->id)
                            ->whereIn('exam_id', $examIds)
                            ->where('subject_id', $subject->id)
                            ->get();

                        $caScore = 0;
                        $examScore = 0;
                        $totalRaw = 0;

                        foreach ($marks as $mark) {
                            $exam = $exams->firstWhere('id', $mark->exam_id);
                            if (!$mark->is_absent && $mark->marks_obtained !== null) {
                                if ($exam && $exam->assessment_category === 'continuous_assessment') {
                                    $caScore += (float) $mark->marks_obtained;
                                } else {
                                    $examScore += (float) $mark->marks_obtained;
                                }
                                $totalRaw += (float) $mark->marks_obtained;
                            }
                        }

                        $weightedScore = ($caScore * $caWeight / 100) + ($examScore * $examWeight / 100);
                        $graded = $grading->calculate($weightedScore, $subject->full_marks);

                        $subjectData[] = [
                            'subject_id'      => $subject->id,
                            'subject_name'    => $subject->name,
                            'ca_score'        => round($caScore, 2),
                            'exam_score'      => round($examScore, 2),
                            'total_score'     => round($totalRaw, 2),
                            'weighted_score'  => round($weightedScore, 2),
                            'grade'           => $graded['grade'],
                            'gpa'             => $graded['gpa'],
                            'remarks'         => $graded['remarks'] ?? null,
                        ];

                        $totalObtained += $weightedScore;
                        $totalFull     += $subject->full_marks;
                    }

                    $percentage = $totalFull > 0 ? round(($totalObtained / $totalFull) * 100, 2) : 0;
                    $overallGraded = $grading->calculate($totalObtained, $totalFull);

                    $attendance = Attendance::where('school_id', $schoolId)
                        ->where('attendable_type', Student::class)
                        ->where('attendable_id', $student->id)
                        ->whereBetween('date', [$term->start_date, $term->end_date])
                        ->select('status', DB::raw('count(*) as count'))
                        ->groupBy('status')
                        ->pluck('count', 'status');

                    $totalDays = $attendance->sum();
                    $presentDays = $attendance->get('present', 0) + $attendance->get('late', 0);

                    ReportCard::updateOrCreate(
                        [
                            'school_id'       => $schoolId,
                            'student_id'      => $student->id,
                            'academic_year_id' => $data['academic_year_id'],
                            'term_id'         => $data['term_id'],
                        ],
                        [
                            'class_id'          => $data['class_id'],
                            'section_id'        => $student->section_id,
                            'total_marks'       => $totalFull,
                            'obtained_marks'    => round($totalObtained, 2),
                            'percentage'        => $percentage,
                            'grade'             => $overallGraded['grade'],
                            'gpa'               => $overallGraded['gpa'],
                            'total_school_days' => $totalDays,
                            'days_present'      => $presentDays,
                            'days_absent'       => $attendance->get('absent', 0),
                            'days_late'         => $attendance->get('late', 0),
                            'subject_data'      => $subjectData,
                            'status'            => 'draft',
                        ]
                    );
                }

                $reportCards = ReportCard::where('school_id', $schoolId)
                    ->where('class_id', $data['class_id'])
                    ->where('academic_year_id', $data['academic_year_id'])
                    ->where('term_id', $data['term_id'])
                    ->orderByDesc('obtained_marks')
                    ->get();

                foreach ($reportCards as $rank => $rc) {
                    $rc->update(['rank' => $rank + 1]);
                }
            });

            return back()->with('success', 'Report cards generated for ' . $students->count() . ' students.');
        } catch (\Throwable $e) {
            return back()->withInput()->with('error', 'Failed to generate report cards: ' . $e->getMessage());
        }
    }

    public function show(ReportCard $reportCard): Response
    {
        $reportCard->load(['student:id,first_name,last_name,admission_no,student_id', 'schoolClass:id,name', 'section:id,name', 'term:id,name', 'academicYear:id,name']);

        return Inertia::render('SchoolAdmin/ReportCards/Show', [
            'reportCard' => $reportCard,
            'gradeScale' => GradeScale::where('school_id', $reportCard->school_id)->orderByDesc('min_marks')->get(),
        ]);
    }

    public function updateComments(Request $request, ReportCard $reportCard): RedirectResponse
    {
        $data = $request->validate([
            'teacher_comment'     => 'nullable|string|max:1000',
            'form_master_comment' => 'nullable|string|max:1000',
            'principal_comment'   => 'nullable|string|max:1000',
            'promotion_status'    => 'nullable|in:promoted,retained,promoted_with_conditions',
        ]);

        try {
            $reportCard->update($data);
            return back()->with('success', 'Comments updated.');
        } catch (\Throwable $e) {
            return back()->withInput()->with('error', 'Failed to update comments: ' . $e->getMessage());
        }
    }

    public function submit(ReportCard $reportCard): RedirectResponse
    {
        if ($reportCard->status !== 'draft') {
            return back()->with('error', 'Only draft report cards can be submitted.');
        }

        try {
            $reportCard->update([
                'status'       => 'submitted',
                'submitted_by' => auth()->id(),
                'submitted_at' => now(),
            ]);

            return back()->with('success', 'Report card submitted for approval.');
        } catch (\Throwable $e) {
            return back()->with('error', 'Failed to submit report card: ' . $e->getMessage());
        }
    }

    public function approve(ReportCard $reportCard): RedirectResponse
    {
        try {
            $previousState = ['status' => $reportCard->status];
            $reportCard->update([
                'status'      => 'approved',
                'approved_by' => auth()->id(),
                'approved_at' => now(),
            ]);

            ResultApprovalLog::log(
                $this->getSchoolId(),
                $reportCard,
                auth()->id(),
                'approved',
                null,
                $previousState,
                ['status' => 'approved']
            );

            return back()->with('success', 'Report card approved and ready to publish.');
        } catch (\Throwable $e) {
            return back()->with('error', 'Failed to approve report card: ' . $e->getMessage());
        }
    }

    public function publish(ReportCard $reportCard): RedirectResponse
    {
        try {
            $previousState = ['status' => $reportCard->status];
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
                $previousState,
                ['status' => 'published']
            );

            NotificationDispatchService::onReportCardPublished(
                $reportCard->school_id,
                $reportCard->id,
                $reportCard->class_id
            );

            return back()->with('success', 'Report card published and parents notified.');
        } catch (\Throwable $e) {
            return back()->with('error', 'Failed to publish report card: ' . $e->getMessage());
        }
    }

    public function unpublish(ReportCard $reportCard): RedirectResponse
    {
        if ($reportCard->status !== 'published') {
            return back()->with('error', 'Only published report cards can be unpublished.');
        }

        try {
            $previousState = ['status' => $reportCard->status, 'published_at' => $reportCard->published_at?->toISOString()];
            $reportCard->update([
                'status'       => 'approved',
                'published_at' => null,
            ]);

            ResultApprovalLog::log(
                $this->getSchoolId(),
                $reportCard,
                auth()->id(),
                'unpublished',
                null,
                $previousState,
                ['status' => 'approved', 'published_at' => null]
            );

            return back()->with('success', 'Report card unpublished. Visible only to staff.');
        } catch (\Throwable $e) {
            return back()->with('error', 'Failed to unpublish: ' . $e->getMessage());
        }
    }

    public function unpublishAll(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'class_id'  => 'required|exists:classes,id',
            'term_id'   => 'required|exists:academic_terms,id',
        ]);

        try {
            $schoolId = $this->getSchoolId();
            $count = ReportCard::where('school_id', $schoolId)
                ->where('class_id', $data['class_id'])
                ->where('term_id', $data['term_id'])
                ->where('status', 'published')
                ->update([
                    'status'       => 'approved',
                    'published_at' => null,
                ]);

            return back()->with('success', "{$count} report cards unpublished.");
        } catch (\Throwable $e) {
            return back()->with('error', 'Failed to unpublish: ' . $e->getMessage());
        }
    }

    public function bulkPublish(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'class_id'  => 'required|exists:classes,id',
            'term_id'   => 'required|exists:academic_terms,id',
        ]);

        try {
            $schoolId = $this->getSchoolId();
            $count = ReportCard::where('school_id', $schoolId)
                ->where('class_id', $data['class_id'])
                ->where('term_id', $data['term_id'])
                ->where('status', 'approved')
                ->update(['status' => 'published']);

            if ($count > 0) {
                NotificationDispatchService::onReportCardPublished($schoolId, 0, $data['class_id']);
            }

            return back()->with('success', "{$count} report cards published and parents notified.");
        } catch (\Throwable $e) {
            return back()->with('error', 'Failed to bulk publish: ' . $e->getMessage());
        }
    }

    public function bulkSubmit(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'class_id'  => 'required|exists:classes,id',
            'term_id'   => 'required|exists:academic_terms,id',
        ]);

        try {
            $schoolId = $this->getSchoolId();
            $count = ReportCard::where('school_id', $schoolId)
                ->where('class_id', $data['class_id'])
                ->where('term_id', $data['term_id'])
                ->where('status', 'draft')
                ->update([
                    'status'       => 'submitted',
                    'submitted_by' => auth()->id(),
                    'submitted_at' => now(),
                ]);

            return back()->with('success', "{$count} report cards submitted for approval.");
        } catch (\Throwable $e) {
            return back()->with('error', 'Failed to bulk submit: ' . $e->getMessage());
        }
    }

    public function bulkApprove(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'class_id'  => 'required|exists:classes,id',
            'term_id'   => 'required|exists:academic_terms,id',
        ]);

        try {
            $schoolId = $this->getSchoolId();
            $count = ReportCard::where('school_id', $schoolId)
                ->where('class_id', $data['class_id'])
                ->where('term_id', $data['term_id'])
                ->where('status', 'submitted')
                ->update([
                    'status'      => 'approved',
                    'approved_by' => auth()->id(),
                    'approved_at' => now(),
                ]);

            return back()->with('success', "{$count} report cards approved.");
        } catch (\Throwable $e) {
            return back()->with('error', 'Failed to bulk approve: ' . $e->getMessage());
        }
    }

    public function history(Request $request): Response
    {
        $schoolId = $this->getSchoolId();

        $logs = ResultApprovalLog::where('school_id', $schoolId)
            ->where('approvable_type', ReportCard::class)
            ->with('user:id,name')
            ->latest()
            ->paginate(25)
            ->withQueryString();

        return Inertia::render('SchoolAdmin/ReportCards/History', [
            'history' => [
                'data' => $logs->items(),
                'meta' => [
                    'total'        => $logs->total(),
                    'current_page' => $logs->currentPage(),
                    'last_page'    => $logs->lastPage(),
                ],
                'links' => ['prev' => $logs->previousPageUrl(), 'next' => $logs->nextPageUrl()],
            ],
        ]);
    }

    public function bulkPrint(Request $request)
    {
        $data = $request->validate([
            'class_id'  => 'required|exists:classes,id',
            'term_id'   => 'required|exists:academic_terms,id',
            'section_id' => 'nullable|exists:sections,id',
        ]);

        $schoolId = $this->getSchoolId();

        $reportCards = ReportCard::where('school_id', $schoolId)
            ->where('class_id', $data['class_id'])
            ->where('term_id', $data['term_id'])
            ->where('status', 'published')
            ->when($data['section_id'] ?? null, fn ($q) => $q->where('section_id', $data['section_id']))
            ->with(['student:id,first_name,last_name,admission_no', 'schoolClass:id,name', 'section:id,name', 'term:id,name', 'academicYear:id,name'])
            ->get();

        $school = \App\Models\School::findOrFail($schoolId);
        $gradeScale = GradeScale::where('school_id', $schoolId)->orderByDesc('min_marks')->get();
        $activeTemplate = ReportCardTemplate::where('school_id', $schoolId)->where('status', 'active')->first();

        $pdf = Pdf::loadView('report-cards.print-bulk', [
            'reportCards'  => $reportCards,
            'school'       => $school,
            'gradeScale'   => $gradeScale,
            'template'     => $activeTemplate,
            'templateConfig' => $activeTemplate?->template_config,
        ])->setPaper('a4', 'portrait');

        $className = $reportCards->first()?->schoolClass?->name ?? 'class';
        $termName  = $reportCards->first()?->term?->name ?? 'term';
        $filename  = "report-cards-{$className}-{$termName}.pdf";

        return $pdf->download($filename);
    }

    public function promoteStudents(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'class_id'        => 'required|exists:classes,id',
            'term_id'         => 'required|exists:academic_terms,id',
            'academic_year_id' => 'required|exists:academic_years,id',
            'min_gpa'         => 'nullable|numeric|min:0|max:5',
        ]);

        $schoolId  = $this->getSchoolId();
        $minGpa    = $data['min_gpa'] ?? 2.0;
        $currentClass = SchoolClass::findOrFail($data['class_id']);

        $nextClass = SchoolClass::where('school_id', $schoolId)
            ->where('school_level', $currentClass->school_level)
            ->where('level_order', $currentClass->level_order + 1)
            ->first();

        if (!$nextClass) {
            $settings = SchoolSetting::allFor($schoolId);
            $levels = [];
            if (($settings['enable_ece'] ?? '1') === '1')     $levels[] = 'early_childhood';
            if (($settings['enable_primary'] ?? '1') === '1')  $levels[] = 'primary';
            if (($settings['enable_jss'] ?? '1') === '1')      $levels[] = 'junior_secondary';
            if (($settings['enable_sss'] ?? '1') === '1')      $levels[] = 'senior_secondary';

            $currentIdx = array_search($currentClass->school_level, $levels);
            if ($currentIdx !== false && $currentIdx < count($levels) - 1) {
                $nextLevel = $levels[$currentIdx + 1];
                $nextClass = SchoolClass::where('school_id', $schoolId)
                    ->where('school_level', $nextLevel)
                    ->orderBy('level_order')
                    ->first();
            }
        }

        try {
            $reportCards = ReportCard::where('school_id', $schoolId)
                ->where('class_id', $data['class_id'])
                ->where('term_id', $data['term_id'])
                ->where('status', 'published')
                ->get();

            $promoted = 0;
            $retained = 0;

            DB::transaction(function () use ($reportCards, $nextClass, $minGpa, &$promoted, &$retained) {
                foreach ($reportCards as $rc) {
                    $student = Student::withoutGlobalScopes()->find($rc->student_id);
                    if (!$student) continue;

                    $gpa = $rc->gpa ?? 0;

                    if ($gpa >= $minGpa && $nextClass) {
                        $student->update(['class_id' => $nextClass->id]);
                        $rc->update(['promotion_status' => 'promoted']);
                        $promoted++;
                    } else {
                        $rc->update(['promotion_status' => 'retained']);
                        $retained++;
                    }

                    $guardian = $student->guardian;
                    if ($guardian && $student->guardian_id) {
                        $guardian = \App\Models\Guardian::withoutGlobalScopes()->find($student->guardian_id);
                    }
                    if ($guardian?->user_id) {
                        $user = \App\Models\User::find($guardian->user_id);
                        $status = $gpa >= $minGpa ? 'promoted' : 'retained';
                        $targetClass = $status === 'promoted' && $nextClass ? $nextClass->name : 'same class';
                        NotificationDispatchService::notifyUser(
                            $user,
                            'Student ' . ucfirst($status),
                            "{$student->full_name} has been {$status} to {$targetClass}.",
                            '/school/parent/report-cards'
                        );
                    }
                }
            });

            return back()->with('success', "Promotion complete: {$promoted} promoted, {$retained} retained.");
        } catch (\Throwable $e) {
            return back()->with('error', 'Failed to process promotions: ' . $e->getMessage());
        }
    }

    public function printPdf(ReportCard $reportCard)
    {
        try {
            $reportCard->load([
                'student:id,first_name,last_name,admission_no,student_id',
                'schoolClass:id,name',
                'section:id,name',
                'term:id,name',
                'academicYear:id,name',
            ]);

            $school = \App\Models\School::findOrFail($reportCard->school_id);
            $gradeScale = GradeScale::where('school_id', $reportCard->school_id)->orderByDesc('min_marks')->get();
            $subjectData = $reportCard->subject_data ?? [];

            $activeTemplate = ReportCardTemplate::where('school_id', $reportCard->school_id)
                ->where('status', 'active')
                ->first();

            $pdf = Pdf::loadView('report-cards.print', [
                'reportCard'  => $reportCard,
                'student'     => $reportCard->student,
                'schoolClass' => $reportCard->schoolClass,
                'section'     => $reportCard->section,
                'term'        => $reportCard->term,
                'academicYear'=> $reportCard->academicYear,
                'school'      => $school,
                'subjectData' => $subjectData,
                'gradeScale'  => $gradeScale,
                'template'    => $activeTemplate,
                'templateConfig' => $activeTemplate?->template_config,
            ])->setPaper('a4', 'portrait');

            $filename = "report-card-{$reportCard->student->admission_no}-{$reportCard->term->name}.pdf";
            $pdf->save(storage_path("app/private/report-cards/{$filename}"));

            $reportCard->update(['pdf_path' => "report-cards/{$filename}"]);

            return $pdf->download($filename);
        } catch (\Throwable $e) {
            return back()->with('error', 'Failed to generate PDF: ' . $e->getMessage());
        }
    }
}
