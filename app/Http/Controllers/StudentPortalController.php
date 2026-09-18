<?php

namespace App\Http\Controllers;

use App\Models\Announcement;
use App\Models\Attendance;
use App\Models\Exam;
use App\Models\FeePayment;
use App\Models\Homework;
use App\Models\Mark;
use App\Models\ReportCard;
use App\Models\Student;
use App\Models\Timetable;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class StudentPortalController extends Controller
{
    public function dashboard()
    {
        $user    = auth()->user();
        $student = Student::with(['schoolClass:id,name', 'section:id,name', 'guardian:id,name,phone,email'])
            ->where('school_id', $user->school_id)
            ->where('user_id', $user->id)
            ->first();

        if (! $student) {
            return Inertia::render('Student/Dashboard', [
                'student'      => null,
                'linked'       => false,
                'attendance'   => [],
                'exams'        => [],
                'homework'     => [],
                'fees'         => [],
                'marks'        => [],
                'announcements'=> [],
                'timetableToday' => [],
            ]);
        }

        $now   = Carbon::now();
        $today = $now->toDateString();

        /* ── Attendance (this month) ── */
        $attendanceRaw = Attendance::where('school_id', $user->school_id)
            ->where('attendable_type', Student::class)
            ->where('attendable_id', $student->id)
            ->whereMonth('date', $now->month)
            ->whereYear('date', $now->year)
            ->select('date', 'status')
            ->orderBy('date')
            ->get();

        $totalDays   = $attendanceRaw->count();
        $presentDays = $attendanceRaw->where('status', 'present')->count();
        $attendance  = [
            'total'      => $totalDays,
            'present'    => $presentDays,
            'absent'     => $attendanceRaw->where('status', 'absent')->count(),
            'late'       => $attendanceRaw->where('status', 'late')->count(),
            'percentage' => $totalDays ? round(($presentDays / $totalDays) * 100) : 0,
            'today'      => $attendanceRaw->firstWhere('date', $today)?->status ?? 'not-marked',
            'calendar'   => $attendanceRaw->map(fn ($a) => ['date' => $a->date, 'status' => $a->status]),
        ];

        /* ── Upcoming Exams ── */
        $exams = Exam::where('school_id', $user->school_id)
            ->where('class_id', $student->class_id)
            ->where('start_date', '>=', $today)
            ->orderBy('start_date')
            ->limit(5)
            ->get(['id', 'name', 'type', 'start_date', 'end_date', 'status'])
            ->map(fn ($e) => [
                'id'         => $e->id,
                'name'       => $e->name,
                'type'       => $e->type,
                'start_date' => $e->start_date->format('d M Y'),
                'days_away'  => (int) ceil($now->floatDiffInDays($e->start_date)),
            ]);

        /* ── Homework due soon ── */
        $homework = Homework::where('school_id', $user->school_id)
            ->where('class_id', $student->class_id)
            ->where('due_date', '>=', $today)
            ->where('is_active', true)
            ->with('subject:id,name')
            ->orderBy('due_date')
            ->limit(6)
            ->get()
            ->map(fn ($h) => [
                'id'      => $h->id,
                'title'   => $h->title,
                'subject' => $h->subject?->name,
                'due'     => Carbon::parse($h->due_date)->format('d M'),
                'overdue' => $h->due_date < $today,
            ]);

        /* ── Fee Summary ── */
        $feeData   = FeePayment::where('school_id', $user->school_id)
            ->where('student_id', $student->id)
            ->select(DB::raw('SUM(amount_due) as total_due, SUM(amount_paid) as total_paid, SUM(amount_due - amount_paid) as balance'))
            ->first();

        $recentFees = FeePayment::where('school_id', $user->school_id)
            ->where('student_id', $student->id)
            ->orderByDesc('payment_date')
            ->limit(5)
            ->get(['id', 'amount_due', 'amount_paid', 'status', 'month_year', 'payment_date'])
            ->map(fn ($f) => [
                'id'        => $f->id,
                'month'     => $f->month_year,
                'due'       => (float) $f->amount_due,
                'paid'      => (float) $f->amount_paid,
                'balance'   => (float) ($f->amount_due - $f->amount_paid),
                'status'    => $f->status,
                'date'      => $f->payment_date ? Carbon::parse($f->payment_date)->format('d M Y') : null,
            ]);

        $fees = [
            'total_due'  => (float) ($feeData->total_due ?? 0),
            'total_paid' => (float) ($feeData->total_paid ?? 0),
            'balance'    => (float) ($feeData->balance ?? 0),
            'recent'     => $recentFees,
        ];

        /* ── Recent Exam Marks ── */
        $marks = Mark::where('school_id', $user->school_id)
            ->where('student_id', $student->id)
            ->with(['exam:id,name,type', 'subject:id,name'])
            ->orderByDesc('created_at')
            ->limit(8)
            ->get()
            ->map(fn ($m) => [
                'exam'    => $m->exam?->name,
                'subject' => $m->subject?->name,
                'marks'   => $m->marks_obtained,
                'grade'   => $m->grade,
                'absent'  => $m->is_absent,
            ]);

        /* ── Today's Timetable ── */
        $dayOfWeek    = strtolower($now->format('l')); // monday, tuesday…
        $timetableToday = Timetable::where('school_id', $user->school_id)
            ->where('class_id', $student->class_id)
            ->where('section_id', $student->section_id)
            ->where('day_of_week', $dayOfWeek)
            ->where('status', 'published')
            ->with('subject:id,name')
            ->orderBy('start_time')
            ->get()
            ->map(fn ($t) => [
                'subject'    => $t->subject?->name,
                'start_time' => substr($t->start_time, 0, 5),
                'end_time'   => substr($t->end_time, 0, 5),
                'room'       => $t->room,
            ]);

        /* ── Announcements ── */
        $announcements = Announcement::where('school_id', $user->school_id)
            ->where(fn ($q) => $q->where('audience', 'all')
                ->orWhere('audience', 'students')
                ->orWhere(fn ($q2) => $q2->where('audience', 'class')->where('class_id', $student->class_id))
            )
            ->orderByDesc('published_at')
            ->limit(5)
            ->get(['id', 'title', 'body', 'is_pinned', 'published_at'])
            ->map(fn ($a) => [
                'id'       => $a->id,
                'title'    => $a->title,
                'body'     => $a->body,
                'pinned'   => $a->is_pinned,
                'date'     => $a->published_at ? Carbon::parse($a->published_at)->diffForHumans() : null,
            ]);

        return Inertia::render('Student/Dashboard', [
            'linked'         => true,
            'student'        => [
                'id'           => $student->id,
                'full_name'    => $student->full_name,
                'admission_no' => $student->admission_no,
                'class'        => $student->schoolClass?->name,
                'section'      => $student->section?->name,
                'photo_url'    => $student->photo_url,
                'guardian'     => $student->guardian ? [
                    'name'  => $student->guardian->name,
                    'phone' => $student->guardian->phone,
                ] : null,
            ],
            'attendance'     => $attendance,
            'exams'          => $exams,
            'homework'       => $homework,
            'fees'           => $fees,
            'marks'          => $marks,
            'timetableToday' => $timetableToday,
            'announcements'  => $announcements,
        ]);
    }

    /* ── Helper: resolve student or redirect ── */
    private function resolveStudent()
    {
        $user = auth()->user();
        return Student::with(['schoolClass:id,name', 'section:id,name'])
            ->where('school_id', $user->school_id)
            ->where('user_id', $user->id)
            ->first();
    }

    public function subjects()
    {
        $student = $this->resolveStudent();
        if (! $student) return $this->notLinked('Student/Subjects');

        $user = auth()->user();
        $currentYear = \App\Models\AcademicYear::where('school_id', $user->school_id)
            ->where('is_current', true)->first();

        $enrollments = \App\Models\StudentSubjectEnrollment::where('school_id', $user->school_id)
            ->where('student_id', $student->id)
            ->when($currentYear, fn ($q) => $q->where('academic_year_id', $currentYear->id))
            ->where('status', 'enrolled')
            ->with(['subjectOffering' => function ($q) {
                $q->with(['subject:id,name,code', 'section:id,name']);
            }])
            ->get();

        $subjects = $enrollments->map(function ($enrollment) use ($user) {
            $offering = $enrollment->subjectOffering;
            if (! $offering) return null;

            $teacherAssignment = \App\Models\TeacherSubjectAssignment::where('school_id', $user->school_id)
                ->where('subject_offering_id', $offering->id)
                ->where('is_active', true)
                ->with(['staff:id,first_name,last_name,phone,email,department_id'])
                ->first();

            $timetable = \App\Models\Timetable::where('school_id', $user->school_id)
                ->where('class_id', $offering->class_id)
                ->where('subject_id', $offering->subject_id)
                ->where('status', 'published')
                ->when($offering->section_id, fn ($q) => $q->where('section_id', $offering->section_id))
                ->get(['day_of_week', 'start_time', 'end_time', 'room']);

            return [
                'id'            => $offering->id,
                'subject_name'  => $offering->subject_name,
                'subject_code'  => $offering->subject_code,
                'subject_type'  => $offering->subject_type,
                'class_name'    => $offering->schoolClass?->name,
                'section_name'  => $offering->section?->name,
                'teacher'       => $teacherAssignment?->staff ? [
                    'full_name' => $teacherAssignment->staff->full_name,
                    'email'     => $teacherAssignment->staff->email,
                ] : null,
                'timetable'     => $timetable->map(fn ($t) => [
                    'day'        => $t->day_of_week,
                    'start_time' => $t->start_time,
                    'end_time'   => $t->end_time,
                    'room'       => $t->room,
                ]),
            ];
        })->filter()->values();

        return Inertia::render('Student/Subjects', [
            'linked'   => true,
            'student'  => [
                'full_name' => $student->full_name,
                'class'     => $student->schoolClass?->name,
                'section'   => $student->section?->name,
            ],
            'subjects' => $subjects,
        ]);
    }

    public function timetable()
    {
        $student = $this->resolveStudent();
        if (! $student) return $this->notLinked('Student/Timetable');

        $days = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];
        $timetable = [];
        foreach ($days as $day) {
            $slots = \App\Models\Timetable::where('school_id', $student->school_id)
                ->where('class_id', $student->class_id)
                ->where('section_id', $student->section_id)
                ->where('day_of_week', $day)
                ->where('status', 'published')
                ->with('subject:id,name')
                ->orderBy('start_time')
                ->get()
                ->map(fn ($t) => [
                    'subject'    => $t->subject?->name,
                    'start_time' => substr($t->start_time, 0, 5),
                    'end_time'   => substr($t->end_time, 0, 5),
                    'room'       => $t->room,
                ]);
            if ($slots->isNotEmpty()) $timetable[$day] = $slots;
        }

        return Inertia::render('Student/Timetable', [
            'linked'    => true,
            'student'   => ['full_name' => $student->full_name, 'class' => $student->schoolClass?->name, 'section' => $student->section?->name],
            'timetable' => $timetable,
            'today'     => strtolower(Carbon::now()->format('l')),
        ]);
    }

    public function attendance()
    {
        $student = $this->resolveStudent();
        if (! $student) return $this->notLinked('Student/Attendance');

        $now = Carbon::now();
        $months = [];
        for ($m = 0; $m < 6; $m++) {
            $month = $now->copy()->subMonths($m);
            $rows  = Attendance::where('school_id', $student->school_id)
                ->where('attendable_type', Student::class)
                ->where('attendable_id', $student->id)
                ->whereMonth('date', $month->month)
                ->whereYear('date', $month->year)
                ->orderBy('date')
                ->get(['date', 'status']);

            $total   = $rows->count();
            $present = $rows->where('status', 'present')->count();
            $months[] = [
                'label'      => $month->format('M Y'),
                'total'      => $total,
                'present'    => $present,
                'absent'     => $rows->where('status', 'absent')->count(),
                'late'       => $rows->where('status', 'late')->count(),
                'percentage' => $total ? round($present / $total * 100) : 0,
                'calendar'   => $rows->map(fn ($r) => ['date' => $r->date, 'status' => $r->status]),
            ];
        }

        return Inertia::render('Student/Attendance', [
            'linked'  => true,
            'student' => ['full_name' => $student->full_name, 'class' => $student->schoolClass?->name],
            'months'  => $months,
        ]);
    }

    public function results()
    {
        $student = $this->resolveStudent();
        if (! $student) return $this->notLinked('Student/Results');

        $exams = Exam::where('school_id', $student->school_id)
            ->where('class_id', $student->class_id)
            ->with(['marks' => fn ($q) => $q->where('student_id', $student->id)->with('subject:id,name')])
            ->orderByDesc('start_date')
            ->get()
            ->filter(fn ($e) => $e->marks->isNotEmpty())
            ->map(fn ($e) => [
                'id'     => $e->id,
                'name'   => $e->name,
                'type'   => $e->type,
                'date'   => $e->start_date?->format('M Y'),
                'marks'  => $e->marks->map(fn ($m) => [
                    'subject' => $m->subject?->name,
                    'marks'   => $m->marks_obtained,
                    'total'   => $m->total_marks,
                    'grade'   => $m->grade,
                    'absent'  => $m->is_absent,
                ]),
            ])->values();

        return Inertia::render('Student/Results', [
            'linked'  => true,
            'student' => ['full_name' => $student->full_name, 'class' => $student->schoolClass?->name],
            'exams'   => $exams,
        ]);
    }

    public function homework()
    {
        $student = $this->resolveStudent();
        if (! $student) return $this->notLinked('Student/Homework');

        $now      = Carbon::now()->toDateString();
        $homework = Homework::where('school_id', $student->school_id)
            ->where('class_id', $student->class_id)
            ->where('is_active', true)
            ->with('subject:id,name')
            ->orderByDesc('due_date')
            ->get()
            ->map(fn ($h) => [
                'id'          => $h->id,
                'title'       => $h->title,
                'description' => $h->description,
                'subject'     => $h->subject?->name,
                'due'         => $h->due_date,
                'due_label'   => Carbon::parse($h->due_date)->format('d M Y'),
                'overdue'     => $h->due_date < $now,
            ]);

        return Inertia::render('Student/Homework', [
            'linked'   => true,
            'student'  => ['full_name' => $student->full_name, 'class' => $student->schoolClass?->name],
            'homework' => $homework,
        ]);
    }

    public function fees()
    {
        $student = $this->resolveStudent();
        if (! $student) return $this->notLinked('Student/Fees');

        $summary = FeePayment::where('school_id', $student->school_id)
            ->where('student_id', $student->id)
            ->selectRaw('SUM(amount_due) as total_due, SUM(amount_paid) as total_paid, SUM(amount_due - amount_paid) as balance')
            ->first();

        $payments = FeePayment::where('school_id', $student->school_id)
            ->where('student_id', $student->id)
            ->orderByDesc('payment_date')
            ->get(['id', 'month_year', 'amount_due', 'amount_paid', 'status', 'payment_date'])
            ->map(fn ($f) => [
                'id'           => $f->id,
                'month'        => $f->month_year,
                'due'          => (float) $f->amount_due,
                'paid'         => (float) $f->amount_paid,
                'balance'      => (float) ($f->amount_due - $f->amount_paid),
                'status'       => $f->status,
                'payment_date' => $f->payment_date ? Carbon::parse($f->payment_date)->format('d M Y') : null,
            ]);

        return Inertia::render('Student/Fees', [
            'linked'   => true,
            'student'  => ['full_name' => $student->full_name, 'class' => $student->schoolClass?->name],
            'summary'  => [
                'total_due'  => (float) ($summary->total_due ?? 0),
                'total_paid' => (float) ($summary->total_paid ?? 0),
                'balance'    => (float) ($summary->balance ?? 0),
            ],
            'payments' => $payments,
        ]);
    }

    public function announcements()
    {
        $student = $this->resolveStudent();
        if (! $student) return $this->notLinked('Student/Announcements');

        $announcements = Announcement::where('school_id', $student->school_id)
            ->where(fn ($q) => $q->where('audience', 'all')
                ->orWhere('audience', 'students')
                ->orWhere(fn ($q2) => $q2->where('audience', 'class')->where('class_id', $student->class_id))
            )
            ->orderByDesc('published_at')
            ->get(['id', 'title', 'body', 'is_pinned', 'published_at'])
            ->map(fn ($a) => [
                'id'     => $a->id,
                'title'  => $a->title,
                'body'   => $a->body,
                'pinned' => $a->is_pinned,
                'date'   => $a->published_at ? Carbon::parse($a->published_at)->format('d M Y') : null,
            ]);

        return Inertia::render('Student/Announcements', [
            'linked'        => true,
            'student'       => ['full_name' => $student->full_name],
            'announcements' => $announcements,
        ]);
    }

    public function reportCards()
    {
        $student = $this->resolveStudent();
        if (! $student) return $this->notLinked('Student/ReportCards');

        $reportCards = ReportCard::where('school_id', $student->school_id)
            ->where('student_id', $student->id)
            ->where('status', 'published')
            ->with(['academicYear:id,name', 'term:id,name'])
            ->orderByDesc('created_at')
            ->get()
            ->map(fn ($rc) => [
                'id'              => $rc->id,
                'academic_year'   => $rc->academicYear?->name,
                'term'            => $rc->term?->name,
                'percentage'      => $rc->percentage,
                'grade'           => $rc->grade,
                'gpa'             => $rc->gpa,
                'rank'            => $rc->rank,
                'status'          => $rc->status,
                'promotion_status' => $rc->promotion_status,
                'attendance'      => [
                    'total'  => $rc->total_school_days,
                    'present'=> $rc->days_present,
                    'absent' => $rc->days_absent,
                    'late'   => $rc->days_late,
                ],
            ]);

        return Inertia::render('Student/ReportCards', [
            'linked'      => true,
            'student'     => ['full_name' => $student->full_name, 'class' => $student->schoolClass?->name],
            'reportCards' => $reportCards,
        ]);
    }

    public function profile()
    {
        $student = $this->resolveStudent();
        if (! $student) return $this->notLinked('Student/Profile');

        $student->load(['guardian:id,name,phone,email', 'department:id,name', 'documents']);

        return Inertia::render('Student/Profile', [
            'linked'  => true,
            'student' => [
                'id'                  => $student->id,
                'full_name'           => $student->full_name,
                'admission_no'        => $student->admission_no,
                'student_id'          => $student->student_id,
                'emis_number'         => $student->emis_number,
                'roll_no'             => $student->roll_no,
                'class'               => $student->schoolClass?->name,
                'section'             => $student->section?->name,
                'department'          => $student->department?->name,
                'gender'              => $student->gender,
                'date_of_birth'       => $student->date_of_birth?->format('d M Y'),
                'blood_group'         => $student->blood_group,
                'religion'            => $student->religion,
                'nationality'         => $student->nationality,
                'phone'               => $student->phone,
                'email'               => $student->email,
                'address'             => $student->address,
                'photo_url'           => $student->photo_url,
                'admission_date'      => $student->admission_date?->format('d M Y'),
                'previous_school'     => $student->previous_school,
                'status'              => $student->status,
                'medical_info'        => $student->medical_info,
                'npse_index_number'   => $student->npse_index_number,
                'bece_index_number'   => $student->bece_index_number,
                'wassce_index_number' => $student->wassce_index_number,
                'guardian'            => $student->guardian ? [
                    'name'  => $student->guardian->name,
                    'phone' => $student->guardian->phone,
                    'email' => $student->guardian->email,
                ] : null,
            ],
        ]);
    }

    public function downloads()
    {
        $student = $this->resolveStudent();
        if (! $student) return $this->notLinked('Student/Downloads');

        $documents = $student->documents()
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

        return Inertia::render('Student/Downloads', [
            'linked'    => true,
            'student'   => ['full_name' => $student->full_name, 'class' => $student->schoolClass?->name],
            'documents' => $documents,
        ]);
    }

    public function examinationCentre()
    {
        $student = $this->resolveStudent();
        if (! $student) return $this->notLinked('Student/ExaminationCentre');

        $user = auth()->user();
        $exams = \App\Models\NationalExamination::where('school_id', $user->school_id)
            ->where('student_id', $student->id)
            ->with(['academicYear:id,name', 'term:id,name'])
            ->orderByDesc('exam_year')
            ->get()
            ->map(fn ($e) => [
                'id'            => $e->id,
                'exam_type'     => $e->exam_type,
                'exam_type_label' => $e->exam_type_label,
                'index_number'  => $e->index_number,
                'exam_year'     => $e->exam_year,
                'total_score'   => $e->total_score,
                'overall_grade' => $e->overall_grade,
                'overall_result'=> $e->overall_result,
                'subject_scores'=> $e->subject_scores,
                'status'        => $e->status,
                'academic_year' => $e->academicYear?->name,
                'term'          => $e->term?->name,
            ]);

        return Inertia::render('Student/ExaminationCentre', [
            'linked'    => true,
            'student'   => [
                'full_name'           => $student->full_name,
                'class'               => $student->schoolClass?->name,
                'npse_index_number'   => $student->npse_index_number,
                'bece_index_number'   => $student->bece_index_number,
                'wassce_index_number' => $student->wassce_index_number,
            ],
            'exams' => $exams,
        ]);
    }

    public function academicProgress()
    {
        $student = $this->resolveStudent();
        if (! $student) return $this->notLinked('Student/AcademicProgress');

        $user = auth()->user();

        $reportCards = ReportCard::where('school_id', $user->school_id)
            ->where('student_id', $student->id)
            ->with(['academicYear:id,name', 'term:id,name'])
            ->orderByDesc('created_at')
            ->get()
            ->map(fn ($rc) => [
                'id'            => $rc->id,
                'academic_year' => $rc->academicYear?->name,
                'term'          => $rc->term?->name,
                'percentage'    => $rc->percentage,
                'grade'         => $rc->grade,
                'gpa'           => $rc->gpa,
                'rank'          => $rc->rank,
                'total_marks'   => $rc->total_marks,
                'obtained_marks'=> $rc->obtained_marks,
                'attendance'    => [
                    'total'   => $rc->total_school_days,
                    'present' => $rc->days_present,
                    'absent'  => $rc->days_absent,
                    'late'    => $rc->days_late,
                ],
            ]);

        $marksByTerm = Mark::where('school_id', $user->school_id)
            ->where('student_id', $student->id)
            ->with(['exam:id,name,term_id', 'subject:id,name'])
            ->orderByDesc('created_at')
            ->get()
            ->groupBy(fn ($m) => $m->exam?->term_id ?? 'unknown')
            ->map(function ($termMarks) {
                return $termMarks->map(fn ($m) => [
                    'subject' => $m->subject?->name,
                    'marks'   => $m->marks_obtained,
                    'total'   => $m->total_marks,
                    'grade'   => $m->grade,
                ]);
            })
            ->values();

        return Inertia::render('Student/AcademicProgress', [
            'linked'      => true,
            'student'     => ['full_name' => $student->full_name, 'class' => $student->schoolClass?->name],
            'reportCards' => $reportCards,
            'marksByTerm' => $marksByTerm,
        ]);
    }

    public function schoolInfo()
    {
        $student = $this->resolveStudent();
        if (! $student) return $this->notLinked('Student/SchoolInfo');

        $school = \App\Models\School::findOrFail(auth()->user()->school_id);

        return Inertia::render('Student/SchoolInfo', [
            'linked' => true,
            'school' => [
                'name'            => $school->name,
                'email'           => $school->email,
                'phone'           => $school->phone,
                'address'         => $school->address,
                'city'            => $school->city,
                'state'           => $school->state,
                'country'         => $school->country,
                'logo_url'        => $school->logo_url,
                'currency'        => $school->currency,
                'currency_symbol' => $school->currency_symbol,
            ],
        ]);
    }

    private function notLinked(string $page)
    {
        return Inertia::render($page, ['linked' => false]);
    }
}
