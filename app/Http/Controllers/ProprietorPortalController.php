<?php

namespace App\Http\Controllers;

use App\Models\AcademicTerm;
use App\Models\AcademicYear;
use App\Models\Announcement;
use App\Models\Department;
use App\Models\Exam;
use App\Models\FeeCategory;
use App\Models\FeePayment;
use App\Models\FeeStructure;
use App\Models\LeaveRequest;
use App\Models\Mark;
use App\Models\Message;
use App\Models\NationalExamination;
use App\Models\Payroll;
use App\Models\ReportCard;
use App\Models\School;
use App\Models\SchoolClass;
use App\Models\Staff;
use App\Models\Student;
use App\Models\Subject;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class ProprietorPortalController extends Controller
{
    private function resolveProprietor(): ?Staff
    {
        $user = auth()->user();
        return Staff::where('school_id', $user->school_id)
            ->where('user_id', $user->id)
            ->first();
    }

    private function notLinked(string $page)
    {
        return Inertia::render($page, ['linked' => false]);
    }

    /* ─────────────────────────────────────────────
       DASHBOARD
    ───────────────────────────────────────────── */

    public function dashboard()
    {
        $staff = $this->resolveProprietor();
        if (! $staff) return $this->notLinked('Proprietor/Dashboard');

        $user     = auth()->user();
        $schoolId = $user->school_id;
        $now      = Carbon::now();

        $school = School::where('id', $schoolId)
            ->first(['id', 'name', 'email', 'phone', 'address', 'city', 'country', 'logo']);

        $totalStudents = Student::where('school_id', $schoolId)->count();
        $totalStaff    = Staff::where('school_id', $schoolId)->count();

        $totalRevenue = (float) FeePayment::where('school_id', $schoolId)->sum('amount_paid');

        $totalDue = (float) FeePayment::where('school_id', $schoolId)
            ->sum(DB::raw('amount_due + fine - discount - amount_paid'));

        $monthlyRevenue = (float) FeePayment::where('school_id', $schoolId)
            ->whereYear('payment_date', $now->year)
            ->whereMonth('payment_date', $now->month)
            ->sum('amount_paid');

        $revenueTrend = collect();
        for ($i = 5; $i >= 0; $i--) {
            $month = $now->copy()->subMonths($i);
            $revenueTrend->push([
                'month'  => $month->format('M Y'),
                'amount' => (float) FeePayment::where('school_id', $schoolId)
                    ->whereYear('payment_date', $month->year)
                    ->whereMonth('payment_date', $month->month)
                    ->sum('amount_paid'),
            ]);
        }

        $passRate = 0;
        $examsWithMarks = Exam::where('school_id', $schoolId)
            ->whereHas('marks')
            ->get(['id']);
        if ($examsWithMarks->isNotEmpty()) {
            $marks = Mark::where('school_id', $schoolId)
                ->whereIn('exam_id', $examsWithMarks->pluck('id'))
                ->where('is_absent', false)
                ->get(['marks_obtained']);
            $validMarks = $marks->pluck('marks_obtained')->filter();
            if ($validMarks->isNotEmpty()) {
                $passRate = round($validMarks->filter(fn ($s) => $s >= 40)->count() / $validMarks->count() * 100);
            }
        }

        $totalFeeDue = (float) FeeStructure::where('school_id', $schoolId)
            ->where('is_active', true)
            ->sum('amount');
        $collectionRate = $totalFeeDue > 0 ? round($totalRevenue / ($totalFeeDue * max($totalStudents, 1)) * 100) : 0;
        $collectionRate = min($collectionRate, 100);

        $recentAnnouncements = Announcement::where('school_id', $schoolId)
            ->orderByDesc('published_at')
            ->limit(3)
            ->get()
            ->map(fn ($a) => [
                'id'     => $a->id,
                'title'  => $a->title,
                'body'   => $a->body,
                'pinned' => $a->is_pinned,
                'date'   => $a->published_at?->format('d M Y'),
            ]);

        $academicYear = AcademicYear::where('school_id', $schoolId)->where('is_current', true)->first();
        $academicTerm = AcademicTerm::where('school_id', $schoolId)->where('is_current', true)->first();

        return Inertia::render('Proprietor/Dashboard', [
            'linked'              => true,
            'staff'               => [
                'total' => $totalStaff,
            ],
            'school'              => [
                'name'    => $school->name,
                'motto'   => $school->settings['motto'] ?? null,
                'address' => $school->address,
                'phone'   => $school->phone,
                'email'   => $school->email,
            ],
            'stats'               => [
                'total_students'   => $totalStudents,
                'total_staff'      => $totalStaff,
                'total_revenue'    => $totalRevenue,
                'total_outstanding'=> $totalDue,
                'monthly_revenue'  => $monthlyRevenue,
                'staff_count'      => $totalStaff,
            ],
            'revenueTrend'        => $revenueTrend,
            'academicPassRate'    => $passRate,
            'feeCollectionRate'   => $collectionRate,
            'recentAnnouncements' => $recentAnnouncements,
            'academicYear'        => $academicYear?->name,
            'academicTerm'        => $academicTerm?->name,
        ]);
    }

    /* ─────────────────────────────────────────────
       FINANCIAL
    ───────────────────────────────────────────── */

    public function financial()
    {
        $staff = $this->resolveProprietor();
        if (! $staff) return $this->notLinked('Proprietor/Financial');

        $user     = auth()->user();
        $schoolId = $user->school_id;
        $now      = Carbon::now();

        $monthlyRevenue = collect();
        for ($i = 11; $i >= 0; $i--) {
            $month = $now->copy()->subMonths($i);
            $monthlyRevenue->push([
                'month'  => $month->format('M Y'),
                'amount' => (float) FeePayment::where('school_id', $schoolId)
                    ->whereYear('payment_date', $month->year)
                    ->whereMonth('payment_date', $month->month)
                    ->sum('amount_paid'),
            ]);
        }

        $totalRevenueAll = (float) FeePayment::where('school_id', $schoolId)->sum('amount_paid');

        $feeByCategoryRaw = FeePayment::where('school_id', $schoolId)
            ->with('feeStructure.feeCategory:id,name')
            ->get()
            ->groupBy(fn ($p) => $p->feeStructure?->feeCategory?->name ?? 'Uncategorized')
            ->map(fn ($payments, $category) => [
                'name'  => $category,
                'total' => (float) $payments->sum('amount_paid'),
            ])
            ->values();

        $feeByCategory = $feeByCategoryRaw->map(fn ($item) => [
            'name'       => $item['name'],
            'total'      => $item['total'],
            'percentage' => $totalRevenueAll > 0 ? round($item['total'] / $totalRevenueAll * 100) : 0,
        ]);

        $outstandingByCategory = FeeStructure::where('school_id', $schoolId)
            ->where('is_active', true)
            ->with('feeCategory:id,name')
            ->get()
            ->groupBy(fn ($fs) => $fs->feeCategory?->name ?? 'Uncategorized')
            ->map(function ($structures, $category) use ($schoolId) {
                $totalDue = (float) $structures->sum('amount');
                $studentCount = Student::where('school_id', $schoolId)->count();
                $totalDueForCategory = $totalDue * $studentCount;

                $paidForCategory = FeePayment::where('school_id', $schoolId)
                    ->whereIn('fee_structure_id', $structures->pluck('id'))
                    ->sum('amount_paid');

                return [
                    'name'       => $category,
                    'total'      => $totalDueForCategory - (float) $paidForCategory,
                ];
            })
            ->values();

        $totalOutstandingAll = (float) $outstandingByCategory->sum('total');
        $outstandingByCategory = $outstandingByCategory->map(fn ($item) => [
            'name'       => $item['name'],
            'total'      => $item['total'],
            'percentage' => $totalOutstandingAll > 0 ? round($item['total'] / $totalOutstandingAll * 100) : 0,
        ]);

        $totalRevenue = (float) FeePayment::where('school_id', $schoolId)->sum('amount_paid');

        $payrollQuery = Payroll::where('school_id', $schoolId)
            ->where('status', 'paid');
        $totalPayrollCost = (float) (clone $payrollQuery)->sum('net_salary');
        $staffOnPayroll = (clone $payrollQuery)->distinct('staff_id')->count('staff_id');
        $averageSalary = $staffOnPayroll > 0 ? round($totalPayrollCost / $staffOnPayroll) : 0;

        $netIncome = $totalRevenue - $totalPayrollCost;

        $collectionRateForCard = 0;
        $totalFeeDueForCard = (float) FeeStructure::where('school_id', $schoolId)->where('is_active', true)->sum('amount');
        $totalStudentsForCard = Student::where('school_id', $schoolId)->count();
        if ($totalFeeDueForCard > 0) {
            $collectionRateForCard = min(round($totalRevenue / ($totalFeeDueForCard * max($totalStudentsForCard, 1)) * 100), 100);
        }

        return Inertia::render('Proprietor/Financial', [
            'linked'                    => true,
            'monthlyRevenue'            => $monthlyRevenue,
            'feeByCategory'             => $feeByCategory,
            'outstandingByCategory'     => $outstandingByCategory,
            'payrollSummary'            => [
                'total_staff'    => $staffOnPayroll,
                'total_payroll'  => $totalPayrollCost,
                'average_salary' => $averageSalary,
            ],
            'netIncome'                 => $netIncome,
            'collectionRateTrend'       => $collectionRateForCard,
        ]);
    }

    /* ─────────────────────────────────────────────
       ACADEMIC
    ───────────────────────────────────────────── */

    public function academic()
    {
        $staff = $this->resolveProprietor();
        if (! $staff) return $this->notLinked('Proprietor/Academic');

        $schoolId = $staff->school_id;

        $classPerformance = SchoolClass::where('school_id', $schoolId)
            ->with('sections:id,name,class_id')
            ->get()
            ->map(function ($class) use ($schoolId) {
                $marks = Mark::where('school_id', $schoolId)
                    ->whereHas('exam', fn ($q) => $q->where('class_id', $class->id))
                    ->where('is_absent', false)
                    ->get(['marks_obtained']);

                $validMarks = $marks->pluck('marks_obtained')->filter();
                $avg = $validMarks->isNotEmpty() ? round($validMarks->avg(), 1) : 0;
                $passRate = $validMarks->isNotEmpty()
                    ? round($validMarks->filter(fn ($s) => $s >= 40)->count() / $validMarks->count() * 100)
                    : 0;

                return [
                    'class_name' => $class->name,
                    'avg_marks'  => $avg,
                    'pass_rate'  => $passRate,
                ];
            });

        $examPassRates = Exam::where('school_id', $schoolId)
            ->whereHas('marks')
            ->with('schoolClass:id,name')
            ->get()
            ->map(function ($exam) {
                $marks = $exam->marks()->where('is_absent', false)->get(['marks_obtained']);
                $validMarks = $marks->pluck('marks_obtained')->filter();
                $passRate = $validMarks->isNotEmpty()
                    ? round($validMarks->filter(fn ($s) => $s >= 40)->count() / $validMarks->count() * 100)
                    : 0;

                return [
                    'exam_name'     => $exam->name,
                    'pass_rate'     => $passRate,
                    'total_students'=> $marks->count(),
                ];
            });

        $topClasses = $classPerformance->sortByDesc('avg_marks')->take(5)
            ->map(fn ($c) => ['name' => $c['class_name'], 'value' => $c['avg_marks']])
            ->values();
        $topSubjects = Mark::where('school_id', $schoolId)
            ->where('is_absent', false)
            ->with('subject:id,name')
            ->get()
            ->groupBy(fn ($m) => $m->subject?->name ?? 'Unknown')
            ->map(function ($marks, $name) {
                $scores = $marks->pluck('marks_obtained')->filter();
                return [
                    'name'  => $name,
                    'value' => $scores->isNotEmpty() ? round($scores->avg(), 1) : 0,
                ];
            })
            ->sortByDesc('value')
            ->take(5)
            ->values();

        $npseCandidates = NationalExamination::where('school_id', $schoolId)
            ->where('exam_type', 'npse')
            ->count();
        $beceCandidates = NationalExamination::where('school_id', $schoolId)
            ->where('exam_type', 'bece')
            ->count();
        $wassceCandidates = NationalExamination::where('school_id', $schoolId)
            ->where('exam_type', 'wassce')
            ->count();

        $reportCardRaw = ReportCard::where('school_id', $schoolId)
            ->select('status', DB::raw('count(*) as total'))
            ->groupBy('status')
            ->pluck('total', 'status')
            ->toArray();

        $reportCardStatus = [
            'generated' => $reportCardRaw['generated'] ?? 0,
            'total'     => array_sum($reportCardRaw),
        ];

        return Inertia::render('Proprietor/Academic', [
            'linked'                  => true,
            'classPerformance'        => $classPerformance,
            'examPassRates'           => $examPassRates,
            'topClasses'              => $topClasses,
            'topSubjects'             => $topSubjects,
            'nationalExamReadiness'   => [
                'npse'  => $npseCandidates,
                'bece'  => $beceCandidates,
                'wassce'=> $wassceCandidates,
            ],
            'reportCardStatus'        => $reportCardStatus,
        ]);
    }

    /* ─────────────────────────────────────────────
       STAFF
    ───────────────────────────────────────────── */

    public function staff()
    {
        $staff = $this->resolveProprietor();
        if (! $staff) return $this->notLinked('Proprietor/Staff');

        $schoolId = $staff->school_id;

        $staffByDepartment = Staff::where('school_id', $schoolId)
            ->with('department:id,name')
            ->get()
            ->groupBy(fn ($s) => $s->department?->name ?? 'Unassigned')
            ->map(fn ($group, $dept) => [
                'department' => $dept,
                'count'      => $group->count(),
            ])
            ->values();

        $staffByRole = Staff::where('school_id', $schoolId)
            ->select('teacher_type', DB::raw('count(*) as total'))
            ->groupBy('teacher_type')
            ->get()
            ->map(fn ($r) => ['role' => $r->teacher_type, 'count' => $r->total])
            ->values();

        $payrollQuery = Payroll::where('school_id', $schoolId)
            ->where('status', 'paid');
        $totalMonthlyPayroll = (float) (clone $payrollQuery)->sum('net_salary');
        $staffOnPayroll = (clone $payrollQuery)->distinct('staff_id')->count('staff_id');
        $averageSalary = $staffOnPayroll > 0 ? round($totalMonthlyPayroll / $staffOnPayroll) : 0;

        $pendingLeaves = LeaveRequest::where('school_id', $schoolId)
            ->where('status', 'pending')
            ->count();

        $activeStaff = Staff::where('school_id', $schoolId)->where('status', 'active')->count();
        $inactiveStaff = Staff::where('school_id', $schoolId)->where('status', '!=', 'active')->count();

        return Inertia::render('Proprietor/Staff', [
            'linked'               => true,
            'staffByDepartment'    => $staffByDepartment,
            'staffByRole'          => $staffByRole,
            'payrollSummary'       => [
                'total'   => $totalMonthlyPayroll,
                'average' => $averageSalary,
            ],
            'pendingLeaves'        => $pendingLeaves,
            'retentionData'        => [
                'active'   => $activeStaff,
                'inactive' => $inactiveStaff,
            ],
        ]);
    }

    /* ─────────────────────────────────────────────
       STUDENTS
    ───────────────────────────────────────────── */

    public function students()
    {
        $staff = $this->resolveProprietor();
        if (! $staff) return $this->notLinked('Proprietor/Students');

        $schoolId = $staff->school_id;
        $now      = Carbon::now();

        $studentsByLevel = SchoolClass::where('school_id', $schoolId)
            ->withCount(['sections as student_count' => function ($q) use ($schoolId) {
                $q->whereHas('students', fn ($sq) => $sq->where('school_id', $schoolId));
            }])
            ->get()
            ->groupBy('school_level')
            ->map(function ($classes, $level) {
                return [
                    'level'  => $level,
                    'label'  => $classes->first()->levelLabel(),
                    'count'  => $classes->sum('student_count'),
                    'classes'=> $classes->pluck('name', 'id')->toArray(),
                ];
            })
            ->values();

        $enrollmentTrend = collect();
        for ($i = 5; $i >= 0; $i--) {
            $month = $now->copy()->subMonths($i);
            $enrollmentTrend->push([
                'month' => $month->format('M Y'),
                'count' => Student::where('school_id', $schoolId)
                    ->whereYear('admission_date', $month->year)
                    ->whereMonth('admission_date', $month->month)
                    ->count(),
            ]);
        }

        $genderBreakdownRaw = Student::where('school_id', $schoolId)
            ->select('gender', DB::raw('count(*) as total'))
            ->groupBy('gender')
            ->pluck('total', 'gender')
            ->toArray();

        $genderBreakdown = [
            'male'   => $genderBreakdownRaw['Male'] ?? $genderBreakdownRaw['male'] ?? 0,
            'female' => $genderBreakdownRaw['Female'] ?? $genderBreakdownRaw['female'] ?? 0,
        ];

        $classWiseCounts = SchoolClass::where('school_id', $schoolId)
            ->get()
            ->map(function ($class) use ($schoolId) {
                $studentCount = Student::where('school_id', $schoolId)
                    ->where('class_id', $class->id)
                    ->count();

                return [
                    'class_name' => $class->name,
                    'count'      => $studentCount,
                ];
            });

        return Inertia::render('Proprietor/Students', [
            'linked'            => true,
            'studentsByLevel'   => $studentsByLevel,
            'enrollmentTrend'   => $enrollmentTrend,
            'genderBreakdown'   => $genderBreakdown,
            'classWiseCounts'   => $classWiseCounts,
        ]);
    }

    /* ─────────────────────────────────────────────
       REPORTS
    ───────────────────────────────────────────── */

    public function reports()
    {
        $staff = $this->resolveProprietor();
        if (! $staff) return $this->notLinked('Proprietor/Reports');

        $schoolId = $staff->school_id;
        $now      = Carbon::now();

        $totalRevenue = (float) FeePayment::where('school_id', $schoolId)->sum('amount_paid');
        $totalOutstanding = (float) FeePayment::where('school_id', $schoolId)
            ->sum(DB::raw('amount_due + fine - discount - amount_paid'));
        $totalPayroll = (float) Payroll::where('school_id', $schoolId)->sum('net_salary');

        $passRate = 0;
        $examsWithMarks = Exam::where('school_id', $schoolId)->whereHas('marks')->get(['id']);
        if ($examsWithMarks->isNotEmpty()) {
            $marks = Mark::where('school_id', $schoolId)
                ->whereIn('exam_id', $examsWithMarks->pluck('id'))
                ->where('is_absent', false)
                ->get(['marks_obtained']);
            $validMarks = $marks->pluck('marks_obtained')->filter();
            if ($validMarks->isNotEmpty()) {
                $passRate = round($validMarks->filter(fn ($s) => $s >= 40)->count() / $validMarks->count() * 100);
            }
        }

        $topPerformers = Mark::where('school_id', $schoolId)
            ->where('is_absent', false)
            ->with('student:id,first_name,last_name', 'subject:id,name')
            ->get()
            ->groupBy('student_id')
            ->map(function ($marks, $studentId) {
                $scores = $marks->pluck('marks_obtained')->filter();
                return [
                    'student' => $marks->first()?->student?->full_name,
                    'average' => $scores->isNotEmpty() ? round($scores->avg(), 1) : 0,
                    'count'   => $marks->count(),
                ];
            })
            ->sortByDesc('average')
            ->take(10)
            ->values();

        $totalStudents = Student::where('school_id', $schoolId)->count();
        $totalStaff    = Staff::where('school_id', $schoolId)->count();
        $activeStaff   = Staff::where('school_id', $schoolId)->where('status', 'active')->count();

        $genderBreakdownRaw = Student::where('school_id', $schoolId)
            ->select('gender', DB::raw('count(*) as total'))
            ->groupBy('gender')
            ->pluck('total', 'gender')
            ->toArray();

        $maleCount   = $genderBreakdownRaw['Male'] ?? $genderBreakdownRaw['male'] ?? 0;
        $femaleCount = $genderBreakdownRaw['Female'] ?? $genderBreakdownRaw['female'] ?? 0;

        $totalExams = Exam::where('school_id', $schoolId)->count();
        $topClassPerformance = SchoolClass::where('school_id', $schoolId)
            ->get()
            ->map(function ($class) use ($schoolId) {
                $marks = Mark::where('school_id', $schoolId)
                    ->whereHas('exam', fn ($q) => $q->where('class_id', $class->id))
                    ->where('is_absent', false)
                    ->get(['marks_obtained']);
                $validMarks = $marks->pluck('marks_obtained')->filter();
                $avg = $validMarks->isNotEmpty() ? round($validMarks->avg(), 1) : 0;
                return ['class_name' => $class->name, 'avg_marks' => $avg];
            });
        $topClass = $topClassPerformance->sortByDesc('avg_marks')->first();
        $reportCardsGenerated = ReportCard::where('school_id', $schoolId)->where('status', 'generated')->count();
        $reportCardsTotal = ReportCard::where('school_id', $schoolId)->count();

        $pendingLeaves = LeaveRequest::where('school_id', $schoolId)->where('status', 'pending')->count();
        $staffPayrollQuery = Payroll::where('school_id', $schoolId)->where('status', 'paid');
        $totalPayrollCost = (float) (clone $staffPayrollQuery)->sum('net_salary');
        $staffOnPayroll = (clone $staffPayrollQuery)->distinct('staff_id')->count('staff_id');
        $averageSalary = $staffOnPayroll > 0 ? round($totalPayrollCost / $staffOnPayroll) : 0;

        $totalFeeDue = (float) FeeStructure::where('school_id', $schoolId)->where('is_active', true)->sum('amount');
        $collectionRate = $totalFeeDue > 0 ? min(round($totalRevenue / ($totalFeeDue * max($totalStudents, 1)) * 100), 100) : 0;

        $newAdmissions = Student::where('school_id', $schoolId)
            ->whereYear('created_at', $now->year)
            ->whereMonth('created_at', $now->month)
            ->count();

        $previousStudents = Student::where('school_id', $schoolId)
            ->where('created_at', '<', $now->copy()->startOfMonth())
            ->count();
        $retentionRate = $previousStudents > 0 ? round(($totalStudents / max($previousStudents + $newAdmissions, 1)) * 100) : 0;
        $retentionRate = min($retentionRate, 100);

        return Inertia::render('Proprietor/Reports', [
            'linked'           => true,
            'financialSummary' => [
                'total_revenue'    => $totalRevenue,
                'total_expenses'   => $totalPayroll,
                'net_income'       => $totalRevenue - $totalPayroll,
                'outstanding_fees' => $totalOutstanding,
                'collection_rate'  => $collectionRate,
            ],
            'academicSummary'  => [
                'average_pass_rate'      => $passRate,
                'total_exams'            => $totalExams,
                'top_class'              => $topClass['class_name'] ?? null,
                'report_cards_generated' => $reportCardsGenerated,
            ],
            'staffSummary'     => [
                'total_staff'    => $totalStaff,
                'active_staff'   => $activeStaff,
                'pending_leaves' => $pendingLeaves,
                'average_salary' => $averageSalary,
            ],
            'studentSummary'   => [
                'total_students' => $totalStudents,
                'male'           => $maleCount,
                'female'         => $femaleCount,
                'new_admissions' => $newAdmissions,
                'retention_rate' => $retentionRate,
            ],
        ]);
    }

    /* ─────────────────────────────────────────────
       ANNOUNCEMENTS
    ───────────────────────────────────────────── */

    public function announcements()
    {
        $staff = $this->resolveProprietor();
        if (! $staff) return $this->notLinked('Proprietor/Announcements');

        $schoolId = $staff->school_id;

        $announcements = Announcement::where('school_id', $schoolId)
            ->with('author:id,name')
            ->orderByDesc('published_at')
            ->get()
            ->map(fn ($a) => [
                'id'       => $a->id,
                'title'    => $a->title,
                'body'     => $a->body,
                'pinned'   => $a->is_pinned,
                'audience' => $a->audience,
                'author'   => $a->author?->name,
                'date'     => $a->published_at?->format('d M Y'),
            ]);

        return Inertia::render('Proprietor/Announcements', [
            'linked'        => true,
            'staff'         => ['full_name' => $staff->full_name],
            'announcements' => $announcements,
        ]);
    }

    /* ─────────────────────────────────────────────
       MESSAGES
    ───────────────────────────────────────────── */

    public function messages()
    {
        $user    = auth()->user();
        $staff   = $this->resolveProprietor();
        if (! $staff) return $this->notLinked('Proprietor/Messages');

        $schoolId = $user->school_id;

        $inbox = Message::where('school_id', $schoolId)
            ->where('recipient_id', $user->id)
            ->with('sender:id,name')
            ->orderByDesc('created_at')
            ->limit(50)
            ->get()
            ->map(fn ($m) => [
                'id'         => $m->id,
                'subject'    => $m->subject ?? 'Message',
                'body'       => $m->body,
                'sender'     => $m->sender?->name ?? 'System',
                'is_read'    => ! is_null($m->read_at),
                'created_at' => $m->created_at->format('d M Y H:i'),
            ]);

        $sent = Message::where('school_id', $schoolId)
            ->where('sender_id', $user->id)
            ->with('recipient:id,name')
            ->orderByDesc('created_at')
            ->limit(50)
            ->get()
            ->map(fn ($m) => [
                'id'         => $m->id,
                'subject'    => $m->subject ?? 'Message',
                'recipient'  => $m->recipient?->name ?? 'Unknown',
                'is_read'    => ! is_null($m->read_at),
                'created_at' => $m->created_at->format('d M Y H:i'),
            ]);

        $users = DB::table('users')
            ->where('school_id', $schoolId)
            ->where('id', '!=', $user->id)
            ->get(['id', 'name']);

        return Inertia::render('Proprietor/Messages', [
            'linked'   => true,
            'inbox'    => $inbox,
            'sent'     => $sent,
            'users'    => $users,
        ]);
    }

    public function messageSend(Request $request)
    {
        $staff = $this->resolveProprietor();
        if (! $staff) return back()->withErrors(['error' => 'Proprietor not linked']);

        $request->validate([
            'recipient_id' => 'required|exists:users,id',
            'subject'      => 'required|string|max:255',
            'body'         => 'required|string',
        ]);

        Message::create([
            'school_id'    => auth()->user()->school_id,
            'sender_id'    => auth()->id(),
            'recipient_id' => $request->recipient_id,
            'subject'      => $request->subject,
            'body'         => $request->body,
        ]);

        return back()->with('success', 'Message sent.');
    }

    /* ─────────────────────────────────────────────
       SCHOOL INFO
    ───────────────────────────────────────────── */

    public function schoolInfo()
    {
        $staff = $this->resolveProprietor();
        if (! $staff) return $this->notLinked('Proprietor/SchoolInfo');

        $schoolId = $staff->school_id;

        $school = School::where('id', $schoolId)->first();

        $academicCalendar = AcademicYear::where('school_id', $schoolId)
            ->with(['terms' => fn ($q) => $q->orderBy('start_date')])
            ->orderByDesc('start_date')
            ->get()
            ->map(fn ($y) => [
                'year'  => $y->name,
                'terms' => $y->terms->pluck('name')->toArray(),
            ]);

        return Inertia::render('Proprietor/SchoolInfo', [
            'linked'          => true,
            'school'          => [
                'name'     => $school->name,
                'motto'    => $school->settings['motto'] ?? null,
                'address'  => $school->address,
                'phone'    => $school->phone,
                'email'    => $school->email,
                'logo_url' => $school->logo,
            ],
            'academicCalendar'=> $academicCalendar,
        ]);
    }

    /* ─────────────────────────────────────────────
       DOWNLOADS
    ───────────────────────────────────────────── */

    public function downloads()
    {
        $staff = $this->resolveProprietor();
        if (! $staff) return $this->notLinked('Proprietor/Downloads');

        $schoolId = $staff->school_id;

        $documents = \App\Models\StaffDocument::where('school_id', $schoolId)
            ->where('staff_id', $staff->id)
            ->orderByDesc('created_at')
            ->get()
            ->map(fn ($d) => [
                'id'        => $d->id,
                'title'     => $d->title,
                'file_type' => $d->file_type,
                'file_size' => $d->file_size,
                'file_url'  => $d->file_url,
                'date'      => $d->created_at->format('d M Y'),
            ]);

        return Inertia::render('Proprietor/Downloads', [
            'linked'    => true,
            'staff'     => ['full_name' => $staff->full_name],
            'documents' => $documents,
        ]);
    }

    /* ─────────────────────────────────────────────
       PROFILE
    ───────────────────────────────────────────── */

    public function profile()
    {
        $staff = $this->resolveProprietor();
        if (! $staff) return $this->notLinked('Proprietor/Profile');

        $staff->load('documents', 'department:id,name', 'designation:id,name');

        $schoolId = $staff->school_id;

        $school = School::where('id', $schoolId)
            ->first(['id', 'name', 'email', 'phone', 'address', 'city', 'country']);

        return Inertia::render('Proprietor/Profile', [
            'linked'  => true,
            'staff'   => [
                'id'            => $staff->id,
                'full_name'     => $staff->full_name,
                'emp_id'        => $staff->emp_id,
                'photo_url'     => $staff->photo_url,
                'gender'        => $staff->gender,
                'date_of_birth' => $staff->date_of_birth?->format('d M Y'),
                'blood_group'   => $staff->blood_group,
                'religion'      => $staff->religion,
                'nationality'   => $staff->nationality,
                'phone'         => $staff->phone,
                'email'         => $staff->email,
                'address'       => $staff->address,
                'joining_date'  => $staff->joining_date?->format('d M Y'),
                'status'        => $staff->status,
                'department'    => $staff->department?->name,
                'designation'   => $staff->designation?->name,
            ],
            'school' => [
                'name'    => $school->name,
                'email'   => $school->email,
                'phone'   => $school->phone,
                'address' => $school->address,
                'city'    => $school->city,
                'country' => $school->country,
            ],
            'documents' => $staff->documents->map(fn ($d) => [
                'id'        => $d->id,
                'title'     => $d->title,
                'file_type' => $d->file_type,
                'file_size' => $d->file_size,
                'file_url'  => $d->file_url,
                'date'      => $d->created_at->format('d M Y'),
            ]),
        ]);
    }
}
