<?php

namespace App\Http\Controllers;

use App\Models\Announcement;
use App\Models\Attendance;
use App\Models\FeePayment;
use App\Models\Guardian;
use App\Models\Mark;
use App\Models\Message;
use App\Models\ReportCard;
use App\Models\Student;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class ParentPortalController extends Controller
{
    /** Child id from ?child= only when it belongs to this guardian; null means "all children". */
    private ?int $validatedChildId = null;

    public function dashboard()
    {
        $user     = auth()->user();
        $guardian = Guardian::with('students.schoolClass:id,name', 'students.section:id,name')
            ->where('school_id', $user->school_id)
            ->where('user_id', $user->id)
            ->first();

        if (! $guardian) {
            return Inertia::render('Parent/Dashboard', [
                'guardian'  => null,
                'linked'    => false,
                'children'  => [],
                'announcements' => [],
            ]);
        }

        $now   = Carbon::now();
        $today = $now->toDateString();

        [$childIndex, $childrenModels] = $this->selectChildren($guardian);

        $children = $childrenModels->map(function (Student $student) use ($now, $today) {

            /* Attendance this month */
            $attRows = Attendance::where('school_id', $student->school_id)
                ->where('attendable_type', Student::class)
                ->where('attendable_id', $student->id)
                ->whereMonth('date', $now->month)
                ->whereYear('date', $now->year)
                ->select('status')
                ->get();

            $total   = $attRows->count();
            $present = $attRows->where('status', 'present')->count();

            /* Fee summary */
            $fee = FeePayment::where('school_id', $student->school_id)
                ->where('student_id', $student->id)
                ->select(DB::raw('SUM(amount_due) as due, SUM(amount_paid) as paid'))
                ->first();

            $balance = (float) ($fee->due ?? 0) - (float) ($fee->paid ?? 0);

            /* Recent marks — only from approved exams */
            $marks = $this->publishableMarkQuery($student->school_id, $student->id)
                ->with(['exam:id,name', 'subject:id,name'])
                ->orderByDesc('created_at')
                ->limit(5)
                ->get()
                ->map(fn ($m) => [
                    'exam'    => $m->exam?->name,
                    'subject' => $m->subject?->name,
                    'marks'   => $m->marks_obtained,
                    'grade'   => $m->grade,
                    'absent'  => $m->is_absent,
                ]);

            /* Recent fee payments */
            $recentFees = FeePayment::where('school_id', $student->school_id)
                ->where('student_id', $student->id)
                ->orderByDesc('payment_date')
                ->limit(3)
                ->get()
                ->map(fn ($f) => [
                    'month'   => $f->month_year,
                    'paid'    => (float) $f->amount_paid,
                    'balance' => (float) ($f->amount_due - $f->amount_paid),
                    'status'  => $f->status,
                ]);

            return [
                'id'           => $student->id,
                'full_name'    => $student->full_name,
                'admission_no' => $student->admission_no,
                'class'        => $student->schoolClass?->name,
                'section'      => $student->section?->name,
                'photo_url'    => $student->photo_url,
                'attendance'   => [
                    'total'      => $total,
                    'present'    => $present,
                    'absent'     => $attRows->where('status', 'absent')->count(),
                    'percentage' => $total ? round(($present / $total) * 100) : 0,
                ],
                'fees' => [
                    'total_due'  => (float) ($fee->due ?? 0),
                    'total_paid' => (float) ($fee->paid ?? 0),
                    'balance'    => $balance,
                    'recent'     => $recentFees,
                ],
                'marks'      => $marks,
            ];
        });

        /* Announcements for parents */
        $announcements = Announcement::where('school_id', $user->school_id)
            ->where(fn ($q) => $q->where('audience', 'all')->orWhere('audience', 'parents'))
            ->orderByDesc('published_at')
            ->limit(5)
            ->get()
            ->map(fn ($a) => [
                'id'     => $a->id,
                'title'  => $a->title,
                'body'   => $a->body,
                'pinned' => $a->is_pinned,
                'date'   => $a->published_at ? Carbon::parse($a->published_at)->diffForHumans() : null,
            ]);

        return Inertia::render('Parent/Dashboard', [
            'linked'       => true,
            'guardian'     => [
                'id'    => $guardian->id,
                'name'  => $guardian->name,
                'phone' => $guardian->phone,
                'email' => $guardian->email,
            ],
            'children'     => $children,
            'childrenIndex'=> $childIndex,
            'selectedChild'=> $this->validatedChildId,
            'announcements'=> $announcements,
        ]);
    }

    private function resolveGuardian()
    {
        $user = auth()->user();
        return Guardian::with('students.schoolClass:id,name', 'students.section:id,name')
            ->where('school_id', $user->school_id)
            ->where('user_id', $user->id)
            ->first();
    }

    private function notLinked(string $page)
    {
        return Inertia::render($page, ['linked' => false, 'guardian' => null, 'children' => []]);
    }

    /**
     * All active children of this guardian across BOTH link sources
     * (guardian_student pivot and legacy students.guardian_id), deduplicated.
     */
    private function childrenUnion(Guardian $guardian)
    {
        return $guardian->children()
            ->where('students.status', 'active')
            ->with('schoolClass:id,name', 'section:id,name')
            ->get()
            ->merge(
                $guardian->students()->where('status', 'active')->with('schoolClass:id,name', 'section:id,name')->get()
            )
            ->unique('id')
            ->values();
    }

    /**
     * Child-switcher support (?child=<id>): returns [childIndex, filteredChildren].
     * An invalid or foreign child id falls back to showing all children.
     */
    private function selectChildren(Guardian $guardian): array
    {
        $children = $this->childrenUnion($guardian);

        $index = $children->map(fn ($s) => ['id' => $s->id, 'full_name' => $s->full_name])->values();

        $childId = request('child');
        if ($childId !== null && $childId !== '') {
            $selected = $children->firstWhere('id', (int) $childId);
            if ($selected) {
                $this->validatedChildId = (int) $childId;
                return [$index, collect([$selected])];
            }
        }
        $this->validatedChildId = null;

        return [$index, $children];
    }

    /** Marks are visible to parents only once the exam's approval workflow completed. */
    private function publishableMarkQuery(int $schoolId, int $studentId)
    {
        return Mark::where('marks.school_id', $schoolId)
            ->where('marks.student_id', $studentId)
            ->join('exams', 'exams.id', '=', 'marks.exam_id')
            ->whereNotNull('exams.approved_at')
            ->where(function ($q) {
                $q->whereNull('exams.publication_date')
                  ->orWhere('exams.publication_date', '<=', now());
            })
            ->select('marks.*');
    }

    public function attendance()
    {
        $guardian = $this->resolveGuardian();
        if (! $guardian) return $this->notLinked('Parent/Attendance');

        $now      = Carbon::now();
        [$childIndex, $childrenModels] = $this->selectChildren($guardian);
        $children = $childrenModels->map(function (Student $student) use ($now) {
            $months = [];
            for ($m = 0; $m < 3; $m++) {
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
            return [
                'id'        => $student->id,
                'full_name' => $student->full_name,
                'class'     => $student->schoolClass?->name,
                'section'   => $student->section?->name,
                'months'    => $months,
            ];
        });

        return Inertia::render('Parent/Attendance', [
            'linked'   => true,
            'guardian' => ['name' => $guardian->name],
            'children' => $children,
            'childrenIndex'=> $childIndex,
            'selectedChild'=> $this->validatedChildId,
        ]);
    }

    public function results()
    {
        $guardian = $this->resolveGuardian();
        if (! $guardian) return $this->notLinked('Parent/Results');

        [$childIndex, $childrenModels] = $this->selectChildren($guardian);
        $children = $childrenModels->map(function (Student $student) {
            /* Only marks from exams whose approval workflow is complete */
            $marks = $this->publishableMarkQuery($student->school_id, $student->id)
                ->with(['exam:id,name,type', 'subject:id,name'])
                ->orderByDesc('created_at')
                ->get()
                ->map(fn ($m) => [
                    'exam'    => $m->exam?->name,
                    'type'    => $m->exam?->type,
                    'subject' => $m->subject?->name,
                    'marks'   => $m->marks_obtained,
                    'total'   => $m->total_marks,
                    'grade'   => $m->grade,
                    'absent'  => $m->is_absent,
                ]);
            return [
                'id'        => $student->id,
                'full_name' => $student->full_name,
                'class'     => $student->schoolClass?->name,
                'marks'     => $marks,
            ];
        });

        return Inertia::render('Parent/Results', [
            'linked'   => true,
            'guardian' => ['name' => $guardian->name],
            'children' => $children,
            'childrenIndex'=> $childIndex,
            'selectedChild'=> $this->validatedChildId,
        ]);
    }

    public function fees()
    {
        $guardian = $this->resolveGuardian();
        if (! $guardian) return $this->notLinked('Parent/Fees');

        [$childIndex, $childrenModels] = $this->selectChildren($guardian);
        $children = $childrenModels->map(function (Student $student) {
            $summary = FeePayment::where('school_id', $student->school_id)
                ->where('student_id', $student->id)
                ->selectRaw('SUM(amount_due) as total_due, SUM(amount_paid) as total_paid')
                ->first();

            $payments = FeePayment::where('school_id', $student->school_id)
                ->where('student_id', $student->id)
                ->orderByDesc('payment_date')
                ->get(['id', 'month_year', 'amount_due', 'amount_paid', 'status', 'payment_date'])
                ->map(fn ($f) => [
                    'month'        => $f->month_year ?? '',
                    'due'          => (float) $f->amount_due,
                    'paid'         => (float) $f->amount_paid,
                    'balance'      => (float) ($f->amount_due - $f->amount_paid),
                    'status'       => $f->status,
                    'payment_date' => $f->payment_date ? Carbon::parse($f->payment_date)->format('d M Y') : null,
                ]);

            return [
                'id'         => $student->id,
                'full_name'  => $student->full_name,
                'class'      => $student->schoolClass?->name,
                'total_due'  => (float) ($summary->total_due ?? 0),
                'total_paid' => (float) ($summary->total_paid ?? 0),
                'balance'    => (float) ($summary->total_due ?? 0) - (float) ($summary->total_paid ?? 0),
                'payments'   => $payments,
            ];
        });

        return Inertia::render('Parent/Fees', [
            'linked'   => true,
            'guardian' => ['name' => $guardian->name],
            'children' => $children,
            'childrenIndex'=> $childIndex,
            'selectedChild'=> $this->validatedChildId,
        ]);
    }

    public function announcements()
    {
        $user     = auth()->user();
        $guardian = Guardian::where('school_id', $user->school_id)->where('user_id', $user->id)->first();
        if (! $guardian) return $this->notLinked('Parent/Announcements');

        $announcements = Announcement::where('school_id', $user->school_id)
            ->where(fn ($q) => $q->where('audience', 'all')->orWhere('audience', 'parents'))
            ->orderByDesc('published_at')
            ->get(['id', 'title', 'body', 'is_pinned', 'published_at'])
            ->map(fn ($a) => [
                'id'     => $a->id,
                'title'  => $a->title,
                'body'   => $a->body,
                'pinned' => $a->is_pinned,
                'date'   => $a->published_at ? Carbon::parse($a->published_at)->format('d M Y') : null,
            ]);

        return Inertia::render('Parent/Announcements', [
            'linked'        => true,
            'guardian'      => ['name' => $guardian->name],
            'announcements' => $announcements,
        ]);
    }

    public function reportCards()
    {
        $user    = auth()->user();
        $guardian = $this->resolveGuardian();
        if (! $guardian) return $this->notLinked('Parent/ReportCards');

        [$childIndex, $childrenModels] = $this->selectChildren($guardian);
        $studentIds = $childrenModels->pluck('id');

        $reportCards = ReportCard::where('school_id', $user->school_id)
            ->whereIn('student_id', $studentIds)
            ->where('status', 'published')
            ->with(['student:id,first_name,last_name,admission_no', 'academicYear:id,name', 'term:id,name', 'schoolClass:id,name'])
            ->orderByDesc('created_at')
            ->get()
            ->map(fn ($rc) => [
                'id'              => $rc->id,
                'student'         => $rc->student?->full_name,
                'class'           => $rc->schoolClass?->name,
                'academic_year'   => $rc->academicYear?->name,
                'term'            => $rc->term?->name,
                'percentage'      => $rc->percentage,
                'grade'           => $rc->grade,
                'rank'            => $rc->rank,
                'status'          => $rc->status,
                'promotion_status' => $rc->promotion_status,
                'attendance'      => [
                    'total'  => $rc->total_school_days,
                    'present'=> $rc->days_present,
                ],
            ]);

        return Inertia::render('Parent/ReportCards', [
            'linked'      => true,
            'guardian'    => ['name' => $guardian->name],
            'reportCards' => $reportCards,
            'childrenIndex'=> $childIndex,
            'selectedChild'=> $this->validatedChildId,
        ]);
    }

    public function timetable()
    {
        $guardian = $this->resolveGuardian();
        if (! $guardian) return $this->notLinked('Parent/Timetable');

        $days = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];

        [$childIndex, $childrenModels] = $this->selectChildren($guardian);
        $children = $childrenModels->map(function (Student $student) use ($days) {
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

            return [
                'id'        => $student->id,
                'full_name' => $student->full_name,
                'class'     => $student->schoolClass?->name,
                'section'   => $student->section?->name,
                'timetable' => $timetable,
            ];
        });

        return Inertia::render('Parent/Timetable', [
            'linked'   => true,
            'guardian' => ['name' => $guardian->name],
            'children' => $children,
            'childrenIndex'=> $childIndex,
            'selectedChild'=> $this->validatedChildId,
            'today'    => strtolower(Carbon::now()->format('l')),
        ]);
    }

    public function profile()
    {
        $guardian = $this->resolveGuardian();
        if (! $guardian) return $this->notLinked('Parent/Profile');

        $children = $this->childrenUnion($guardian)->map(fn ($s) => [
            'id'           => $s->id,
            'full_name'    => $s->full_name,
            'admission_no' => $s->admission_no,
            'class'        => $s->schoolClass?->name,
            'section'      => $s->section?->name,
        ]);

        return Inertia::render('Parent/Profile', [
            'linked'   => true,
            'guardian' => [
                'id'        => $guardian->id,
                'name'      => $guardian->name,
                'phone'     => $guardian->phone,
                'email'     => $guardian->email,
                'relation'  => $guardian->relation ?? null,
                'address'   => $guardian->address ?? null,
                'occupation' => $guardian->occupation ?? null,
            ],
            'children' => $children,
        ]);
    }

    public function schoolInfo()
    {
        $guardian = $this->resolveGuardian();
        if (! $guardian) return $this->notLinked('Parent/SchoolInfo');

        $school = \App\Models\School::findOrFail(auth()->user()->school_id);

        return Inertia::render('Parent/SchoolInfo', [
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

    public function downloads()
    {
        $guardian = $this->resolveGuardian();
        if (! $guardian) return $this->notLinked('Parent/Downloads');

        [$childIndex, $childrenModels] = $this->selectChildren($guardian);
        $studentIds = $childrenModels->pluck('id');

        /* Only documents the school has explicitly shared with parents */
        $documents = \App\Models\StudentDocument::where('school_id', auth()->user()->school_id)
            ->where('visible_to_parent', true)
            ->whereIn('student_id', $studentIds)
            ->with('student:id,first_name,last_name')
            ->orderByDesc('created_at')
            ->get()
            ->map(fn ($d) => [
                'id'        => $d->id,
                'title'     => $d->title,
                'student'   => $d->student?->full_name,
                'file_type' => $d->file_type,
                'file_size' => $d->file_size,
                'download_url' => route('parent.documents.download', $d->id),
                'date'      => $d->created_at->format('d M Y'),
            ]);

        return Inertia::render('Parent/Downloads', [
            'linked'    => true,
            'guardian'  => ['name' => $guardian->name],
            'documents' => $documents,
            'childrenIndex'=> $childIndex,
            'selectedChild'=> $this->validatedChildId,
        ]);
    }

    /**
     * Secure document download: verifies the requesting parent is linked to
     * the owning student AND that the school marked the document shareable.
     */
    public function downloadDocument(int $documentId)
    {
        $user     = auth()->user();
        $guardian = Guardian::where('school_id', $user->school_id)->where('user_id', $user->id)->first();

        if (! $guardian) abort(404);

        $allowedStudentIds = $this->childrenUnion($guardian)->pluck('id')->all();

        $document = \App\Models\StudentDocument::where('school_id', $user->school_id)
            ->where('visible_to_parent', true)
            ->whereIn('student_id', $allowedStudentIds)
            ->find($documentId);

        if (! $document) abort(404);

        if (! \Illuminate\Support\Facades\Storage::disk('private')->exists($document->file_path)) {
            abort(404);
        }

        activity()
            ->causedBy($user)
            ->withProperties(['school_id' => $user->school_id, 'document_id' => $document->id])
            ->log('Parent downloaded a student document');

        return \Illuminate\Support\Facades\Storage::disk('private')->download(
            $document->file_path,
            $this->safeDownloadName($document->title, $document->file_type)
        );
    }

    private function safeDownloadName(string $title, string $fileType): string
    {
        $base = preg_replace('/[^A-Za-z0-9 _\-]/', '', $title) ?: 'document';
        return str_contains(strtolower($fileType), 'pdf') ? "{$base}.pdf" : "{$base}.{$fileType}";
    }

    public function communication()
    {
        $guardian = $this->resolveGuardian();
        if (! $guardian) return $this->notLinked('Parent/Communication');

        $messages = Message::where('school_id', auth()->user()->school_id)
            ->where('recipient_id', auth()->id())
            ->with('sender:id,name')
            ->orderByDesc('created_at')
            ->limit(50)
            ->get()
            ->map(fn ($m) => [
                'id'         => $m->id,
                'subject'    => $m->subject ?? 'Message',
                'body'       => $m->body ?? '',
                'sender'     => $m->sender?->name ?? 'System',
                'is_read'    => ! is_null($m->read_at),
                'created_at' => $m->created_at->format('d M Y H:i'),
            ]);

        return Inertia::render('Parent/Communication', [
            'linked'    => true,
            'guardian'  => ['name' => $guardian->name],
            'messages'  => $messages,
        ]);
    }
}
