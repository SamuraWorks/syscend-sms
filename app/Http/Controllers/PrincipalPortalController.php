<?php

namespace App\Http\Controllers;

use App\Models\Announcement;
use App\Models\Attendance;
use App\Models\AcademicYear;
use App\Models\AcademicTerm;
use App\Models\Exam;
use App\Models\FeeCategory;
use App\Models\FeePayment;
use App\Models\FeeStructure;
use App\Models\Homework;
use App\Models\LeaveRequest;
use App\Models\Mark;
use App\Models\Message;
use App\Models\NationalExamination;
use App\Models\Payroll;
use App\Models\ReportCard;
use App\Models\SchoolClass;
use App\Models\Staff;
use App\Models\Student;
use App\Models\Subject;
use App\Models\Timetable;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class PrincipalPortalController extends Controller
{
    private function resolvePrincipal(): ?Staff
    {
        $user = auth()->user();
        return Staff::with([
            'department:id,name',
            'designation:id,name',
        ])
            ->where('school_id', $user->school_id)
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
        $principal = $this->resolvePrincipal();
        if (! $principal) return $this->notLinked('Principal/Dashboard');

        $user     = auth()->user();
        $schoolId = $user->school_id;
        $now      = Carbon::now();
        $today    = $now->toDateString();

        $totalStudents = Student::where('school_id', $schoolId)->count();
        $totalStaff    = Staff::where('school_id', $schoolId)->count();
        $totalClasses  = SchoolClass::where('school_id', $schoolId)->count();

        $attendanceToday = Attendance::where('school_id', $schoolId)
            ->whereDate('date', $today)
            ->where('attendable_type', Student::class)
            ->select('status', DB::raw('count(*) as total'))
            ->groupBy('status')
            ->pluck('total', 'status');

        $totalAttendanceToday = $attendanceToday->sum();
        $presentToday         = $attendanceToday->get('present', 0);
        $attendanceTodayPct   = $totalAttendanceToday > 0
            ? round($presentToday / $totalAttendanceToday * 100, 1)
            : 0;

        $totalFeeDue     = FeeStructure::where('school_id', $schoolId)->where('is_active', true)->sum('amount');
        $totalCollected  = FeePayment::where('school_id', $schoolId)->sum('amount_paid');
        $feeCollectionRate = $totalFeeDue > 0
            ? round($totalCollected / $totalFeeDue * 100, 1)
            : 0;

        $examResultsReady = Exam::where('school_id', $schoolId)
            ->where('status', 'completed')
            ->whereHas('marks')
            ->count();

        $recentAnnouncements = Announcement::where('school_id', $schoolId)
            ->where('audience', 'all')
            ->orderByDesc('published_at')
            ->limit(5)
            ->get(['id', 'title', 'body', 'is_pinned', 'published_at']);

        $pendingLeaveRequests = LeaveRequest::where('school_id', $schoolId)
            ->where('status', 'pending')
            ->count();

        $academicYear = AcademicYear::where('school_id', $schoolId)->where('is_current', true)->first();
        $academicTerm = AcademicTerm::where('school_id', $schoolId)->where('is_current', true)->first();

        return Inertia::render('Principal/Dashboard', [
            'linked'              => true,
            'staff'               => [
                'id'            => $principal->id,
                'full_name'     => $principal->full_name,
                'emp_id'        => $principal->emp_id,
                'photo_url'     => $principal->photo_url,
                'designation'   => $principal->designation?->name,
                'department'    => $principal->department?->name,
            ],
            'academicYear'        => $academicYear?->name,
            'academicTerm'        => $academicTerm?->name,
            'stats'               => [
                'total_students'     => $totalStudents,
                'total_staff'        => $totalStaff,
                'total_classes'      => $totalClasses,
                'attendance_today_pct' => $attendanceTodayPct,
                'fee_collection_rate' => $feeCollectionRate,
                'exam_results_ready' => $examResultsReady,
            ],
            'todayAttendance'     => [
                'present' => (int) $presentToday,
                'absent'  => (int) $attendanceToday->get('absent', 0),
                'late'    => (int) $attendanceToday->get('late', 0),
            ],
            'recentAnnouncements' => $recentAnnouncements->map(fn ($a) => [
                'id'      => $a->id,
                'title'   => $a->title,
                'body'    => $a->body,
                'pinned'  => (bool) $a->is_pinned,
                'date'    => $a->published_at?->format('d M Y'),
            ]),
            'pendingLeaveCount'   => (int) $pendingLeaveRequests,
            'feeOverview'         => [
                'collected'   => (float) $totalCollected,
                'outstanding' => (float) $totalFeeDue - (float) $totalCollected,
            ],
        ]);
    }

    /* ─────────────────────────────────────────────
       ACADEMIC
    ───────────────────────────────────────────── */

    public function academic()
    {
        $principal = $this->resolvePrincipal();
        if (! $principal) return $this->notLinked('Principal/Academic');

        $schoolId = $principal->school_id;

        $academicYear = AcademicYear::where('school_id', $schoolId)->where('is_current', true)->first();
        $academicTerm = AcademicTerm::where('school_id', $schoolId)->where('is_current', true)->first();

        $classes = SchoolClass::where('school_id', $schoolId)
            ->get()
            ->map(fn ($c) => [
                'id'              => $c->id,
                'name'            => $c->name,
                'section'         => $c->section ?? null,
                'student_count'   => Student::where('school_id', $schoolId)->where('class_id', $c->id)->count(),
            ]);

        $subjects = Subject::where('school_id', $schoolId)
            ->get()
            ->map(function ($s) use ($schoolId) {
                $firstTeacher = Timetable::where('school_id', $schoolId)
                    ->where('subject_id', $s->id)
                    ->with('teacher:id,first_name,last_name')
                    ->first()?->teacher;
                $classCount = Timetable::where('school_id', $schoolId)
                    ->where('subject_id', $s->id)
                    ->distinct('class_id')
                    ->count('class_id');
                return [
                    'id'           => $s->id,
                    'name'         => $s->name,
                    'code'         => $s->code,
                    'teacher_name' => $firstTeacher ? trim($firstTeacher->first_name . ' ' . $firstTeacher->last_name) : null,
                    'class_count'  => max(1, $classCount),
                ];
            });

        $classPerformance = Exam::where('school_id', $schoolId)
            ->where('status', 'completed')
            ->with(['schoolClass:id,name', 'marks' => fn ($q) => $q->where('is_absent', false)])
            ->get()
            ->groupBy(fn ($e) => $e->schoolClass?->name ?? 'Unknown')
            ->map(function ($exams, $class) {
                $allMarks = $exams->flatMap->marks;
                $scores = $allMarks->pluck('marks_obtained')->filter();
                return [
                    'class'      => $class,
                    'avg_marks'  => $scores->count() ? round($scores->avg(), 1) : 0,
                    'highest'    => $scores->count() ? (float) $scores->max() : 0,
                    'lowest'     => $scores->count() ? (float) $scores->min() : 0,
                    'pass_rate'  => $scores->count() ? round($scores->filter(fn ($s) => $s >= 40)->count() / $scores->count() * 100) : 0,
                ];
            })
            ->values();

        $examSummary = [
            'total_exams' => (int) Exam::where('school_id', $schoolId)->count(),
            'completed'   => (int) Exam::where('school_id', $schoolId)->where('status', 'completed')->count(),
            'upcoming'    => (int) Exam::where('school_id', $schoolId)->where('status', 'upcoming')->count(),
            'active'      => (int) Exam::where('school_id', $schoolId)->where('status', 'active')->count(),
        ];

        return Inertia::render('Principal/Academic', [
            'linked'              => true,
            'classes'             => $classes,
            'subjects'            => $subjects,
            'performance'         => $classPerformance,
            'examSummary'         => $examSummary,
            'academicYear'        => $academicYear?->name ?? null,
            'academicTerm'        => $academicTerm?->name ?? null,
        ]);
    }

    /* ─────────────────────────────────────────────
       STUDENTS
    ───────────────────────────────────────────── */

    public function students()
    {
        $principal = $this->resolvePrincipal();
        if (! $principal) return $this->notLinked('Principal/Students');

        $schoolId = $principal->school_id;

        $totalStudents = (int) Student::where('school_id', $schoolId)->count();

        $students = Student::where('school_id', $schoolId)
            ->with(['schoolClass:id,name', 'section:id,name', 'guardian:id,name'])
            ->orderBy('first_name')
            ->get()
            ->map(fn ($s) => [
                'id'            => $s->id,
                'full_name'     => $s->full_name,
                'admission_no'  => $s->admission_no,
                'gender'        => $s->gender,
                'class'         => $s->schoolClass?->name,
                'section'       => $s->section?->name,
                'photo_url'     => $s->photo_url,
                'status'        => $s->status,
                'guardian_name' => $s->guardian?->name,
            ]);

        $recentAdmissions = Student::where('school_id', $schoolId)
            ->with(['schoolClass:id,name'])
            ->orderByDesc('admission_date')
            ->limit(10)
            ->get()
            ->map(fn ($s) => [
                'id'            => $s->id,
                'full_name'     => $s->full_name,
                'admission_no'  => $s->admission_no,
                'class'         => $s->schoolClass?->name,
                'date'          => $s->admission_date?->format('d M Y'),
            ]);

        $genderBreakdown = Student::where('school_id', $schoolId)
            ->select('gender', DB::raw('count(*) as total'))
            ->groupBy('gender')
            ->pluck('total', 'gender')
            ->toArray();

        return Inertia::render('Principal/Students', [
            'linked'            => true,
            'totalStudents'     => $totalStudents,
            'students'          => $students,
            'genderBreakdown'   => $genderBreakdown,
            'recentAdmissions'  => $recentAdmissions,
        ]);
    }

    public function studentProfile($id)
    {
        $principal = $this->resolvePrincipal();
        if (! $principal) return $this->notLinked('Principal/StudentProfile');

        $student = Student::with([
            'schoolClass:id,name', 'section:id,name', 'department:id,name',
            'guardian:id,name,phone,email,relation',
        ])
            ->where('school_id', $principal->school_id)
            ->where('id', $id)
            ->first();

        if (! $student) return redirect()->route('principal.students');

        $attendanceRaw = Attendance::where('school_id', $principal->school_id)
            ->where('attendable_type', Student::class)
            ->where('attendable_id', $student->id)
            ->select('status', DB::raw('count(*) as total'))
            ->groupBy('status')
            ->pluck('total', 'status');

        $recentMarks = Mark::where('school_id', $principal->school_id)
            ->where('student_id', $student->id)
            ->with(['exam:id,name', 'subject:id,name'])
            ->orderByDesc('created_at')
            ->limit(10)
            ->get();

        $feePayments = FeePayment::where('school_id', $principal->school_id)
            ->where('student_id', $student->id)
            ->with('feeStructure:id,amount,fee_category_id')
            ->get();

        $totalDue   = (float) $feePayments->sum('amount_due');
        $totalPaid  = (float) $feePayments->sum('amount_paid');
        $balance    = $totalDue - $totalPaid;

        $feeStatusValue = 'unpaid';
        if ($totalDue > 0 && $totalPaid >= $totalDue) {
            $feeStatusValue = 'paid';
        } elseif ($totalPaid > 0) {
            $feeStatusValue = 'partial';
        }

        return Inertia::render('Principal/StudentProfile', [
            'linked'     => true,
            'student'    => [
                'id'            => $student->id,
                'full_name'     => $student->full_name,
                'admission_no'  => $student->admission_no,
                'student_id'    => $student->student_id,
                'gender'        => $student->gender,
                'date_of_birth' => $student->date_of_birth?->format('d M Y'),
                'blood_group'   => $student->blood_group,
                'phone'         => $student->phone,
                'email'         => $student->email,
                'address'       => $student->address,
                'photo_url'     => $student->photo_url,
                'class'         => $student->schoolClass?->name,
                'section'       => $student->section?->name,
                'department'    => $student->department?->name,
                'status'        => $student->status,
                'medical_info'  => $student->medical_info,
                'guardian'      => $student->guardian ? [
                    'name'     => $student->guardian->name,
                    'phone'    => $student->guardian->phone,
                    'email'    => $student->guardian->email,
                    'relation' => $student->guardian->relation ?? null,
                ] : null,
            ],
            'attendanceSummary' => [
                'present' => (int) $attendanceRaw->get('present', 0),
                'absent'  => (int) $attendanceRaw->get('absent', 0),
                'late'    => (int) $attendanceRaw->get('late', 0),
            ],
            'recentMarks'       => $recentMarks->map(fn ($m) => [
                'exam'    => $m->exam?->name,
                'subject' => $m->subject?->name,
                'marks'   => $m->marks_obtained !== null ? (float) $m->marks_obtained : null,
                'grade'   => $m->grade,
                'absent'  => (bool) $m->is_absent,
            ]),
            'feeStatus'         => [
                'total_fees'  => (float) $totalDue,
                'paid'        => (float) $totalPaid,
                'outstanding' => (float) max(0, $balance),
                'status'      => $feeStatusValue,
            ],
        ]);
    }

    /* ─────────────────────────────────────────────
       STAFF
    ───────────────────────────────────────────── */

    public function staff()
    {
        $principal = $this->resolvePrincipal();
        if (! $principal) return $this->notLinked('Principal/Staff');

        $schoolId = $principal->school_id;

        $staff = Staff::where('school_id', $schoolId)
            ->with(['department:id,name', 'designation:id,name'])
            ->orderBy('first_name')
            ->get()
            ->map(fn ($s) => [
                'id'          => $s->id,
                'full_name'   => $s->full_name,
                'emp_id'      => $s->emp_id,
                'gender'      => $s->gender,
                'phone'       => $s->phone,
                'email'       => $s->email,
                'status'      => $s->status,
                'department'  => $s->department?->name,
                'designation' => $s->designation?->name,
                'teacher_type'=> $s->teacher_type,
                'photo_url'   => $s->photo_url,
            ]);

        $staffByDepartment = $staff->groupBy('department')
            ->map(fn ($group, $dept) => ['department' => $dept ?: 'Unassigned', 'count' => $group->count()])
            ->values();

        $pendingLeaveRequests = LeaveRequest::where('school_id', $schoolId)
            ->where('status', 'pending')
            ->with(['staff:id,first_name,last_name', 'leaveType:id,name'])
            ->orderByDesc('created_at')
            ->get()
            ->map(fn ($lr) => [
                'id'          => $lr->id,
                'staff_name'  => $lr->staff?->full_name,
                'leave_type'  => $lr->leaveType?->name,
                'start_date'  => $lr->start_date?->format('d M Y'),
                'end_date'    => $lr->end_date?->format('d M Y'),
                'days'        => $lr->days,
                'reason'      => $lr->reason,
            ]);

        return Inertia::render('Principal/Staff', [
            'linked'               => true,
            'principal'            => ['full_name' => $principal->full_name],
            'staff'                => $staff,
            'staffByDepartment'    => $staffByDepartment,
            'pendingLeaveRequests' => $pendingLeaveRequests,
        ]);
    }

    /* ─────────────────────────────────────────────
       ATTENDANCE
    ───────────────────────────────────────────── */

    public function attendance()
    {
        $principal = $this->resolvePrincipal();
        if (! $principal) return $this->notLinked('Principal/Attendance');

        $schoolId = $principal->school_id;
        $startOfMonth = Carbon::now()->startOfMonth()->toDateString();
        $today = Carbon::now()->toDateString();

        $monthlySummary = Attendance::where('school_id', $schoolId)
            ->where('attendable_type', Student::class)
            ->whereDate('date', '>=', $startOfMonth)
            ->select('status', DB::raw('count(*) as total'))
            ->groupBy('status')
            ->pluck('total', 'status');

        $attendanceByClass = Student::where('school_id', $schoolId)
            ->with('schoolClass:id,name')
            ->get()
            ->groupBy(fn ($s) => $s->schoolClass?->name ?? 'Unknown')
            ->map(function ($students, $className) use ($schoolId, $startOfMonth) {
                $studentIds = $students->pluck('id');
                $total = Attendance::where('school_id', $schoolId)
                    ->where('attendable_type', Student::class)
                    ->whereIn('attendable_id', $studentIds)
                    ->whereDate('date', '>=', $startOfMonth)
                    ->count();

                $present = Attendance::where('school_id', $schoolId)
                    ->where('attendable_type', Student::class)
                    ->whereIn('attendable_id', $studentIds)
                    ->whereDate('date', '>=', $startOfMonth)
                    ->where('status', 'present')
                    ->count();

                return [
                    'class'      => $className,
                    'present_pct' => $total > 0 ? round($present / $total * 100, 1) : 0,
                    'total_records' => $total,
                ];
            })
            ->values();

        $recentTrends = Attendance::where('school_id', $schoolId)
            ->where('attendable_type', Student::class)
            ->whereDate('date', '>=', Carbon::now()->subDays(30))
            ->select('date', 'status', DB::raw('count(*) as total'))
            ->groupBy('date', 'status')
            ->orderByDesc('date')
            ->get()
            ->groupBy('date')
            ->map(fn ($rows, $date) => [
                'date'    => $date,
                'present' => $rows->where('status', 'present')->sum('total'),
                'absent'  => $rows->where('status', 'absent')->sum('total'),
                'late'    => $rows->where('status', 'late')->sum('total'),
            ])
            ->values();

        return Inertia::render('Principal/Attendance', [
            'linked'             => true,
            'principal'          => ['full_name' => $principal->full_name],
            'monthlySummary'     => $monthlySummary->toArray(),
            'attendanceByClass'  => $attendanceByClass,
            'recentTrends'       => $recentTrends,
        ]);
    }

    /* ─────────────────────────────────────────────
       EXAMS
    ───────────────────────────────────────────── */

    public function exams()
    {
        $principal = $this->resolvePrincipal();
        if (! $principal) return $this->notLinked('Principal/Exams');

        $schoolId = $principal->school_id;

        $exams = Exam::where('school_id', $schoolId)
            ->with(['schoolClass:id,name'])
            ->orderByDesc('start_date')
            ->get()
            ->map(fn ($e) => [
                'id'            => $e->id,
                'name'          => $e->name,
                'type'          => $e->type,
                'start_date'    => $e->start_date?->format('d M Y'),
                'end_date'      => $e->end_date?->format('d M Y'),
                'status'        => $e->status,
            ]);

        $classPerformance = Exam::where('school_id', $schoolId)
            ->where('status', 'completed')
            ->with(['schoolClass:id,name', 'marks'])
            ->get()
            ->groupBy(fn ($e) => $e->schoolClass?->name ?? 'Unknown')
            ->map(function ($exams, $class) {
                $allMarks = $exams->flatMap->marks;
                $scores   = $allMarks->where('is_absent', false)->pluck('marks_obtained')->filter();
                return [
                    'class'      => $class,
                    'avg_marks'  => $scores->count() ? round($scores->avg(), 1) : 0,
                    'pass_rate'  => $scores->count() ? round($scores->filter(fn ($s) => $s >= 40)->count() / $scores->count() * 100) : 0,
                ];
            })
            ->values();

        $nationalExamCandidates = NationalExamination::where('school_id', $schoolId)
            ->get()
            ->groupBy('exam_type')
            ->map(fn ($records, $type) => [
                'type'       => strtoupper($type),
                'candidates' => (int) $records->count(),
                'ready'      => (int) $records->where('status', 'ready')->count(),
            ])
            ->values();

        return Inertia::render('Principal/Exams', [
            'linked'                  => true,
            'exams'                   => $exams,
            'classPerformance'        => $classPerformance,
            'nationalExamCandidates'  => $nationalExamCandidates,
        ]);
    }

    /* ─────────────────────────────────────────────
       RESULTS
    ───────────────────────────────────────────── */

    public function results()
    {
        $principal = $this->resolvePrincipal();
        if (! $principal) return $this->notLinked('Principal/Results');

        $schoolId = $principal->school_id;

        $examResults = Exam::where('school_id', $schoolId)
            ->where('status', 'completed')
            ->with(['schoolClass:id,name', 'marks' => fn ($q) => $q->where('is_absent', false)])
            ->get()
            ->map(function ($exam) {
                $marks = $exam->marks;
                $studentCount = $marks->pluck('student_id')->unique()->count();
                $passedCount = $marks->filter(fn ($m) => $m->marks_obtained >= 40)
                    ->pluck('student_id')->unique()->count();
                return [
                    'exam'       => $exam->name,
                    'class'      => $exam->schoolClass?->name,
                    'pass_rate'  => $studentCount > 0 ? round($passedCount / $studentCount * 100) : 0,
                    'total'      => (int) $studentCount,
                    'passed'     => (int) $passedCount,
                ];
            });

        $topPerformers = Mark::where('school_id', $schoolId)
            ->where('is_absent', false)
            ->with(['student:id,first_name,last_name', 'schoolClass:id,name'])
            ->get()
            ->groupBy(fn ($m) => $m->student_id)
            ->map(function ($group) {
                $first = $group->first();
                $totalMarks = (float) $group->sum('marks_obtained');
                $subjectCount = $group->count();
                return [
                    'id'          => $first->student_id,
                    'name'        => $first->student?->full_name,
                    'class'       => $first->schoolClass?->name,
                    'marks'       => $totalMarks,
                    'percentage'  => $subjectCount > 0 ? round($totalMarks / $subjectCount) : 0,
                ];
            })
            ->sortByDesc('marks')
            ->take(20)
            ->values();

        $subjectComparison = Mark::where('school_id', $schoolId)
            ->where('is_absent', false)
            ->with('subject:id,name')
            ->get()
            ->groupBy(fn ($m) => $m->subject?->name ?? 'Unknown')
            ->map(function ($marks, $subject) {
                $scores = $marks->pluck('marks_obtained')->filter();
                $passCount = $scores->filter(fn ($s) => $s >= 40)->count();
                return [
                    'subject'    => $subject,
                    'avg_marks'  => $scores->count() ? round($scores->avg(), 1) : 0,
                    'highest'    => $scores->count() ? (float) $scores->max() : 0,
                    'lowest'     => $scores->count() ? (float) $scores->min() : 0,
                    'pass_rate'  => $scores->count() ? round($passCount / $scores->count() * 100) : 0,
                ];
            })
            ->values();

        $reportCardTotals    = (int) ReportCard::where('school_id', $schoolId)->count();
        $reportCardGenerated = (int) ReportCard::where('school_id', $schoolId)->where('status', 'generated')->count();
        $reportCardPending   = $reportCardTotals - $reportCardGenerated;

        return Inertia::render('Principal/Results', [
            'linked'             => true,
            'results'            => $examResults,
            'topPerformers'      => $topPerformers->values(),
            'subjectComparison'  => $subjectComparison,
            'reportCardStatus'   => [
                'generated' => (int) $reportCardGenerated,
                'pending'   => (int) $reportCardPending,
                'total'     => (int) $reportCardTotals,
            ],
        ]);
    }

    /* ─────────────────────────────────────────────
       TIMETABLE
    ───────────────────────────────────────────── */

    public function timetable()
    {
        $principal = $this->resolvePrincipal();
        if (! $principal) return $this->notLinked('Principal/Timetable');

        $schoolId = $principal->school_id;
        $days = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];

        $slots = Timetable::where('school_id', $schoolId)
            ->with(['subject:id,name', 'schoolClass:id,name', 'section:id,name', 'teacher:id,first_name,last_name'])
            ->orderBy('start_time')
            ->get();

        $schoolTimetable = [];
        foreach ($days as $day) {
            $daySlots = $slots->where('day_of_week', $day)->values();
            if ($daySlots->isNotEmpty()) {
                $schoolTimetable[$day] = $daySlots->map(fn ($t) => [
                    'subject'    => $t->subject?->name,
                    'class'      => $t->schoolClass?->name,
                    'section'    => $t->section?->name,
                    'teacher'    => $t->teacher ? trim($t->teacher->first_name . ' ' . $t->teacher->last_name) : null,
                    'start_time' => substr($t->start_time, 0, 5),
                    'end_time'   => substr($t->end_time, 0, 5),
                    'room'       => $t->room,
                ]);
            }
        }

        $teacherLoad = Staff::where('school_id', $schoolId)
            ->whereNotNull('teacher_type')
            ->get()
            ->map(fn ($teacher) => [
                'teacher' => $teacher->full_name,
                'slots'   => Timetable::where('school_id', $schoolId)->where('teacher_id', $teacher->id)->count(),
            ])
            ->sortByDesc('slots')
            ->values();

        $conflicts = Timetable::where('school_id', $schoolId)
            ->select('teacher_id', 'day_of_week', 'start_time', 'end_time', DB::raw('count(*) as cnt'))
            ->groupBy('teacher_id', 'day_of_week', 'start_time', 'end_time')
            ->havingRaw('count(*) > ?', [1])
            ->with('teacher:id,first_name,last_name')
            ->get()
            ->map(fn ($c) => [
                'teacher'    => $c->teacher ? trim($c->teacher->first_name . ' ' . $c->teacher->last_name) : null,
                'day'        => $c->day_of_week,
                'start_time' => substr($c->start_time, 0, 5),
                'end_time'   => substr($c->end_time, 0, 5),
            ]);

        return Inertia::render('Principal/Timetable', [
            'linked'       => true,
            'principal'    => ['full_name' => $principal->full_name],
            'timetable'    => $schoolTimetable,
            'teacherLoad'  => $teacherLoad,
            'conflicts'    => $conflicts,
            'today'        => strtolower(Carbon::now()->format('l')),
        ]);
    }

    /* ─────────────────────────────────────────────
       HOMEWORK
    ───────────────────────────────────────────── */

    public function homework()
    {
        $principal = $this->resolvePrincipal();
        if (! $principal) return $this->notLinked('Principal/Homework');

        $schoolId = $principal->school_id;

        $homework = Homework::where('school_id', $schoolId)
            ->with(['schoolClass:id,name', 'subject:id,name', 'teacher:id,first_name,last_name'])
            ->orderByDesc('created_at')
            ->get()
            ->map(fn ($h) => [
                'id'          => $h->id,
                'title'       => $h->title,
                'description' => $h->description,
                'subject'     => $h->subject?->name,
                'class'       => $h->schoolClass?->name,
                'teacher'     => $h->teacher ? trim($h->teacher->first_name . ' ' . $h->teacher->last_name) : null,
                'due_date'    => $h->due_date?->format('d M Y'),
                'is_active'   => $h->is_active,
                'submissions' => $h->submissions()->count(),
                'attachment'  => $h->attachment,
            ]);

        $recentAssignments = Homework::where('school_id', $schoolId)
            ->with(['schoolClass:id,name', 'subject:id,name', 'teacher:id,first_name,last_name'])
            ->orderByDesc('created_at')
            ->limit(10)
            ->get()
            ->map(fn ($h) => [
                'id'         => $h->id,
                'title'      => $h->title,
                'class'      => $h->schoolClass?->name,
                'subject'    => $h->subject?->name,
                'teacher'    => $h->teacher ? trim($h->teacher->first_name . ' ' . $h->teacher->last_name) : null,
                'created_at' => $h->created_at->format('d M Y'),
            ]);

        return Inertia::render('Principal/Homework', [
            'linked'             => true,
            'principal'          => ['full_name' => $principal->full_name],
            'homework'           => $homework,
            'recentAssignments'  => $recentAssignments,
        ]);
    }

    /* ─────────────────────────────────────────────
       FEES
    ───────────────────────────────────────────── */

    public function fees()
    {
        $principal = $this->resolvePrincipal();
        if (! $principal) return $this->notLinked('Principal/Fees');

        $schoolId = $principal->school_id;

        $totalDue    = FeeStructure::where('school_id', $schoolId)->where('is_active', true)->sum('amount');
        $totalCollected = FeePayment::where('school_id', $schoolId)->sum('amount_paid');
        $collectionRate = $totalDue > 0 ? round($totalCollected / $totalDue * 100, 1) : 0;

        $feeByCategory = FeeCategory::where('school_id', $schoolId)
            ->with('feeStructures:id,amount,fee_category_id,class_id')
            ->get()
            ->map(function ($cat) use ($schoolId) {
                $totalExpected = $cat->feeStructures->sum('amount');
                $categoryPayments = FeePayment::where('school_id', $schoolId)
                    ->whereIn('fee_structure_id', $cat->feeStructures->pluck('id'))
                    ->sum('amount_paid');
                return [
                    'category'        => $cat->name,
                    'total_expected'  => (float) $totalExpected,
                    'total_collected' => (float) $categoryPayments,
                    'outstanding'     => (float) $totalExpected - (float) $categoryPayments,
                ];
            });

        $classWiseCollection = SchoolClass::where('school_id', $schoolId)
            ->get()
            ->map(function ($class) use ($schoolId) {
                $structures = FeeStructure::where('school_id', $schoolId)
                    ->where('class_id', $class->id)
                    ->where('is_active', true)
                    ->get();

                $studentIds = Student::where('school_id', $schoolId)->where('class_id', $class->id)->pluck('id');
                $totalDue      = $structures->sum('amount') * $studentIds->count();
                $totalCollected = FeePayment::where('school_id', $schoolId)
                    ->whereIn('student_id', $studentIds)
                    ->sum('amount_paid');

                return [
                    'class'           => $class->name,
                    'student_count'   => $studentIds->count(),
                    'total_due'       => (float) $totalDue,
                    'total_collected' => (float) $totalCollected,
                    'outstanding'     => (float) $totalDue - (float) $totalCollected,
                ];
            })
            ->filter(fn ($c) => $c['student_count'] > 0)
            ->values();

        return Inertia::render('Principal/Fees', [
            'linked'               => true,
            'feeOverview'          => [
                'collected'        => (float) $totalCollected,
                'outstanding'      => (float) $totalDue - (float) $totalCollected,
                'collection_rate'  => $collectionRate,
            ],
            'byCategory'           => $feeByCategory->map(fn ($c) => [
                'category'    => $c['category'],
                'total'       => (float) $c['total_expected'],
                'collected'   => (float) $c['total_collected'],
                'outstanding' => (float) $c['outstanding'],
            ]),
            'byClass'              => $classWiseCollection->map(fn ($c) => [
                'class_name'  => $c['class'],
                'total'       => (float) $c['total_due'],
                'collected'   => (float) $c['total_collected'],
                'outstanding' => (float) $c['outstanding'],
            ]),
        ]);
    }

    /* ─────────────────────────────────────────────
       ANNOUNCEMENTS
    ───────────────────────────────────────────── */

    public function announcements()
    {
        $principal = $this->resolvePrincipal();
        if (! $principal) return $this->notLinked('Principal/Announcements');

        $schoolId = $principal->school_id;

        $announcements = Announcement::where('school_id', $schoolId)
            ->with('author:id,name')
            ->orderByDesc('published_at')
            ->get()
            ->map(fn ($a) => [
                'id'         => $a->id,
                'title'      => $a->title,
                'body'       => $a->body,
                'pinned'     => $a->is_pinned,
                'audience'   => $a->audience,
                'author'     => $a->author?->name,
                'date'       => $a->published_at?->format('d M Y'),
                'class_id'   => $a->class_id,
            ]);

        return Inertia::render('Principal/Announcements', [
            'linked'        => true,
            'principal'     => ['full_name' => $principal->full_name],
            'announcements' => $announcements,
        ]);
    }

    /* ─────────────────────────────────────────────
       MESSAGES
    ───────────────────────────────────────────── */

    public function messages()
    {
        $user      = auth()->user();
        $principal = $this->resolvePrincipal();
        if (! $principal) return $this->notLinked('Principal/Messages');

        $inbox = Message::where('school_id', $user->school_id)
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

        $sent = Message::where('school_id', $user->school_id)
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
            ->where('school_id', $user->school_id)
            ->where('id', '!=', $user->id)
            ->get(['id', 'name']);

        return Inertia::render('Principal/Messages', [
            'linked'    => true,
            'inbox'     => $inbox,
            'sent'      => $sent,
            'users'     => $users,
        ]);
    }

    public function messageSend(Request $request)
    {
        $principal = $this->resolvePrincipal();
        if (! $principal) return back()->withErrors(['error' => 'Principal not linked']);

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
       REPORTS
    ───────────────────────────────────────────── */

    public function reports()
    {
        $principal = $this->resolvePrincipal();
        if (! $principal) return $this->notLinked('Principal/Reports');

        $schoolId = $principal->school_id;

        $academicReport = collect([
            ['label' => 'Total Students', 'value' => (int) Student::where('school_id', $schoolId)->count()],
            ['label' => 'Total Staff', 'value' => (int) Staff::where('school_id', $schoolId)->count()],
            ['label' => 'Total Classes', 'value' => (int) SchoolClass::where('school_id', $schoolId)->count()],
            ['label' => 'Total Exams', 'value' => (int) Exam::where('school_id', $schoolId)->count()],
            ['label' => 'Completed Exams', 'value' => (int) Exam::where('school_id', $schoolId)->where('status', 'completed')->count()],
        ]);

        $attendanceMetrics = Attendance::where('school_id', $schoolId)
            ->where('attendable_type', Student::class)
            ->whereDate('date', '>=', Carbon::now()->subDays(30))
            ->select('status', DB::raw('count(*) as total'))
            ->groupBy('status')
            ->pluck('total', 'status');

        $totalAttendance = (int) $attendanceMetrics->sum();
        $presentCount    = (int) $attendanceMetrics->get('present', 0);

        $attendanceReport = collect([
            ['label' => 'Total Records (30 days)', 'value' => $totalAttendance],
            ['label' => 'Present', 'value' => $presentCount],
            ['label' => 'Absent', 'value' => (int) $attendanceMetrics->get('absent', 0)],
            ['label' => 'Late', 'value' => (int) $attendanceMetrics->get('late', 0)],
            ['label' => 'Attendance Rate', 'value' => $totalAttendance > 0 ? round($presentCount / $totalAttendance * 100, 1) . '%' : '0%'],
        ]);

        $totalFeeDue      = (float) FeeStructure::where('school_id', $schoolId)->where('is_active', true)->sum('amount');
        $totalFeeCollected = (float) FeePayment::where('school_id', $schoolId)->sum('amount_paid');
        $totalStaffPaid   = (float) Payroll::where('school_id', $schoolId)->where('status', 'paid')->sum('net_salary');
        $totalStaffDue    = (float) Payroll::where('school_id', $schoolId)->where('status', 'pending')->sum('net_salary');

        $financialReport = collect([
            ['label' => 'Total Fee Due', 'value' => 'Le ' . number_format($totalFeeDue, 2)],
            ['label' => 'Total Fee Collected', 'value' => 'Le ' . number_format($totalFeeCollected, 2)],
            ['label' => 'Fee Outstanding', 'value' => 'Le ' . number_format(max(0, $totalFeeDue - $totalFeeCollected), 2)],
            ['label' => 'Staff Salaries Paid', 'value' => 'Le ' . number_format($totalStaffPaid, 2)],
            ['label' => 'Staff Salaries Pending', 'value' => 'Le ' . number_format($totalStaffDue, 2)],
        ]);

        $totalStaffCount = (int) Staff::where('school_id', $schoolId)->count();
        $activeStaff     = (int) Staff::where('school_id', $schoolId)->where('status', 'active')->count();

        $staffReport = collect([
            ['label' => 'Total Staff', 'value' => $totalStaffCount],
            ['label' => 'Active', 'value' => $activeStaff],
            ['label' => 'Inactive', 'value' => $totalStaffCount - $activeStaff],
            ['label' => 'Teachers', 'value' => (int) Staff::where('school_id', $schoolId)->whereNotNull('teacher_type')->count()],
        ]);

        return Inertia::render('Principal/Reports', [
            'linked'             => true,
            'academicReport'     => $academicReport,
            'attendanceReport'   => $attendanceReport,
            'financialReport'    => $financialReport,
            'staffReport'        => $staffReport,
        ]);
    }

    /* ─────────────────────────────────────────────
       DOWNLOADS
    ───────────────────────────────────────────── */

    public function downloads()
    {
        $principal = $this->resolvePrincipal();
        if (! $principal) return $this->notLinked('Principal/Downloads');

        $schoolId = $principal->school_id;

        $staffDocuments = \App\Models\StaffDocument::where('school_id', $schoolId)
            ->orderByDesc('created_at')
            ->get()
            ->map(fn ($d) => [
                'id'         => $d->id,
                'title'      => $d->title,
                'file_type'  => $d->file_type,
                'file_size'  => $d->file_size,
                'file_url'   => $d->file_url,
                'staff_id'   => $d->staff_id,
                'date'       => $d->created_at->format('d M Y'),
            ]);

        return Inertia::render('Principal/Downloads', [
            'linked'           => true,
            'principal'        => ['full_name' => $principal->full_name],
            'staffDocuments'   => $staffDocuments,
        ]);
    }

    /* ─────────────────────────────────────────────
       PROFILE
    ───────────────────────────────────────────── */

    public function profile()
    {
        $principal = $this->resolvePrincipal();
        if (! $principal) return $this->notLinked('Principal/Profile');

        $principal->load('documents');

        return Inertia::render('Principal/Profile', [
            'linked'    => true,
            'principal' => [
                'id'            => $principal->id,
                'full_name'     => $principal->full_name,
                'emp_id'        => $principal->emp_id,
                'photo_url'     => $principal->photo_url,
                'gender'        => $principal->gender,
                'date_of_birth' => $principal->date_of_birth?->format('d M Y'),
                'blood_group'   => $principal->blood_group,
                'religion'      => $principal->religion,
                'nationality'   => $principal->nationality,
                'phone'         => $principal->phone,
                'email'         => $principal->email,
                'address'       => $principal->address,
                'joining_date'  => $principal->joining_date?->format('d M Y'),
                'status'        => $principal->status,
                'department'    => $principal->department?->name,
                'designation'   => $principal->designation?->name,
            ],
            'documents' => $principal->documents->map(fn ($d) => [
                'id'        => $d->id,
                'title'     => $d->title,
                'file_type' => $d->file_type,
                'file_size' => $d->file_size,
                'file_url'  => $d->file_url,
                'date'      => $d->created_at->format('d M Y'),
            ]),
        ]);
    }

    /* ─────────────────────────────────────────────
       APPROVALS
    ───────────────────────────────────────────── */

    public function approvals()
    {
        $principal = $this->resolvePrincipal();
        if (! $principal) return $this->notLinked('Principal/Approvals');

        $schoolId = $principal->school_id;

        $pendingExams = Exam::where('school_id', $schoolId)
            ->where('status', 'published')
            ->whereNotNull('submitted_at')
            ->whereNull('approved_at')
            ->with(['schoolClass:id,name', 'submittedByUser:id,name'])
            ->orderByDesc('submitted_at')
            ->get()
            ->map(fn ($e) => [
                'id'            => $e->id,
                'name'          => $e->name,
                'type'          => $e->type,
                'class'         => $e->schoolClass?->name,
                'start_date'    => $e->start_date?->format('d M Y'),
                'end_date'      => $e->end_date?->format('d M Y'),
                'submitted_by'  => $e->submittedByUser?->name,
                'submitted_at'  => $e->submitted_at?->format('d M Y H:i'),
            ]);

        $approvalHistory = Exam::where('school_id', $schoolId)
            ->whereIn('status', ['approved', 'rejected'])
            ->with(['schoolClass:id,name', 'approvedByUser:id,name'])
            ->orderByDesc('updated_at')
            ->limit(20)
            ->get()
            ->map(fn ($e) => [
                'id'           => $e->id,
                'name'         => $e->name,
                'type'         => $e->type,
                'class'        => $e->schoolClass?->name,
                'status'       => $e->status,
                'approved_by'  => $e->approvedByUser?->name,
                'approved_at'  => $e->approved_at?->format('d M Y H:i'),
            ]);

        return Inertia::render('Principal/Approvals', [
            'linked'           => true,
            'pendingExams'     => $pendingExams,
            'approvalHistory'  => $approvalHistory,
        ]);
    }

    public function approveExam(Request $request, Exam $exam)
    {
        $principal = $this->resolvePrincipal();
        if (! $principal) return back()->with('error', 'Account not linked');

        abort_unless($exam->school_id === $principal->school_id, 403);

        $exam->update([
            'status'      => 'approved',
            'approved_by' => auth()->id(),
            'approved_at' => now(),
        ]);

        return back()->with('success', "Exam \"{$exam->name}\" approved.");
    }

    public function rejectExam(Request $request, Exam $exam)
    {
        $principal = $this->resolvePrincipal();
        if (! $principal) return back()->with('error', 'Account not linked');

        abort_unless($exam->school_id === $principal->school_id, 403);

        $request->validate([
            'reason' => 'required|string|max:500',
        ]);

        $exam->update([
            'status'        => 'rejected',
            'approved_by'   => null,
            'approved_at'   => null,
            'submitted_by'  => null,
            'submitted_at'  => null,
        ]);

        return back()->with('success', "Exam \"{$exam->name}\" rejected. It has been returned to draft status.");
    }

    /* ─────────────────────────────────────────────
       AUDIT LOG
    ───────────────────────────────────────────── */

    public function auditLog()
    {
        $principal = $this->resolvePrincipal();
        if (! $principal) return $this->notLinked('Principal/AuditLog');

        $schoolId = $principal->school_id;

        $logs = \App\Models\AuditLog::where('school_id', $schoolId)
            ->with('user:id,name')
            ->orderByDesc('created_at')
            ->limit(200)
            ->get()
            ->map(fn ($l) => [
                'id'         => $l->id,
                'action'     => $l->event,
                'description'=> $l->event,
                'user'       => $l->user?->name ?? 'System',
                'created_at' => $l->created_at->format('d M Y H:i'),
            ]);

        return Inertia::render('Principal/AuditLog', [
            'linked' => true,
            'logs'   => $logs,
        ]);
    }
}
