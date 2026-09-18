<?php

namespace App\Http\Controllers\SchoolAdmin;

use App\Http\Controllers\Controller;
use App\Models\Attendance;
use App\Models\AttendanceCorrection;
use App\Models\AttendanceSession;
use App\Models\SchoolClass;
use App\Models\Section;
use App\Models\Staff;
use App\Models\Student;
use App\Models\User;
use App\Services\NotificationDispatchService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class AttendanceController extends Controller
{
    /**
     * Determine the current user's attendance role and assigned classes.
     *
     * Returns:
     *  - role: 'class_teacher' | 'admin' | 'principal'
     *  - assignedClasses: array of SchoolClass models (for class teachers)
     */
    private function resolveAttendanceRole(): array
    {
        $user = auth()->user();
        $schoolId = $this->getSchoolId();

        $staff = Staff::where('school_id', $schoolId)
            ->where('user_id', $user->id)
            ->first();

        if (! $staff) {
            return ['role' => 'admin', 'assignedClasses' => []];
        }

        $isClassTeacher = SchoolClass::where('school_id', $schoolId)
            ->where('class_teacher_id', $staff->id)
            ->where('is_active', true)
            ->exists();

        $isAdminOrPrincipal = $user->hasAnyRole(['school-admin', 'super-admin', 'principal']);

        if ($isClassTeacher && ! $isAdminOrPrincipal) {
            $assignedClasses = SchoolClass::where('school_id', $schoolId)
                ->where('class_teacher_id', $staff->id)
                ->where('is_active', true)
                ->get(['id', 'name']);

            return ['role' => 'class_teacher', 'assignedClasses' => $assignedClasses];
        }

        return ['role' => 'admin', 'assignedClasses' => []];
    }

    /**
     * Check if the current user can manage (approve) attendance.
     */
    private function canApproveAttendance(): bool
    {
        return auth()->user()->hasAnyRole(['school-admin', 'super-admin', 'principal']);
    }

    /**
     * Student attendance — daily mark page with session support.
     *
     * Class teachers see only their assigned class(es).
     * Admins/principals see all classes.
     */
    public function index(Request $request): Response
    {
        $date      = $request->date ?? today()->toDateString();
        $sessionId = $request->session_id;

        ['role' => $role, 'assignedClasses' => $assignedClasses] = $this->resolveAttendanceRole();
        $canApprove = $this->canApproveAttendance();

        // For class teachers, auto-select their assigned class
        if ($role === 'class_teacher' && $assignedClasses->isNotEmpty()) {
            $classId = (string) $assignedClasses->first()->id;
        } else {
            $classId = $request->class_id;
        }

        $sectionId = $request->section_id;

        $students = collect();
        $existing = collect();

        if ($classId) {
            $students = Student::with('section:id,name')
                ->where('class_id', $classId)
                ->when($sectionId, fn ($q) => $q->where('section_id', $sectionId))
                ->where('status', 'active')
                ->orderBy('roll_no')
                ->get(['id', 'first_name', 'last_name', 'roll_no', 'section_id', 'gender']);

            $existing = Attendance::where([
                'school_id'       => $this->getSchoolId(),
                'date'            => $date,
                'attendable_type' => Student::class,
            ])->whereIn('attendable_id', $students->pluck('id'))
              ->when($sessionId, fn ($q) => $q->where('session_id', $sessionId))
              ->get(['attendable_id', 'status', 'remarks', 'session_id', 'status_draft', 'submitted_by', 'submitted_at', 'approved_by', 'approved_at'])
              ->keyBy('attendable_id');
        }

        // Class teachers only see their assigned classes; admins see all
        $classes = $role === 'class_teacher'
            ? $assignedClasses
            : SchoolClass::orderBy('numeric_name')->get(['id', 'name']);

        return Inertia::render('SchoolAdmin/Attendance/Index', [
            'classes'     => $classes,
            'sections'    => Section::orderBy('name')->get(['id', 'class_id', 'name']),
            'sessions'    => AttendanceSession::active()->orderBy('sort_order')->get(['id', 'name', 'slug', 'start_time', 'end_time']),
            'students'    => $students,
            'existing'    => $existing,
            'role'        => $role,
            'canApprove'  => $canApprove,
            'filters'     => [
                'date'       => $date,
                'class_id'   => $classId,
                'section_id' => $sectionId,
                'session_id' => $sessionId,
            ],
        ]);
    }

    /**
     * Bulk upsert student attendance for a class+date with session support.
     *
     * Class teachers can only save for their assigned class.
     * Admins/principals can save for any class.
     */
    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'date'              => 'required|date',
            'class_id'          => 'required|exists:classes,id',
            'session_id'        => 'nullable|exists:attendance_sessions,id',
            'submit_immediately'=> 'boolean',
            'records'           => 'required|array|min:1',
            'records.*.student_id' => 'required|exists:students,id',
            'records.*.status'     => 'required|in:present,absent,late,half_day',
            'records.*.remarks'    => 'nullable|string|max:200',
        ]);

        // Enforce class teacher restriction
        ['role' => $role, 'assignedClasses' => $assignedClasses] = $this->resolveAttendanceRole();

        if ($role === 'class_teacher') {
            $allowedIds = $assignedClasses->pluck('id')->toArray();
            if (! in_array($data['class_id'], $allowedIds)) {
                return back()->with('error', 'You can only mark attendance for your assigned class.');
            }
        }

        $schoolId = $this->getSchoolId();

        try {
            $absentStudents = [];

            DB::transaction(function () use ($data, $schoolId, &$absentStudents) {
                foreach ($data['records'] as $record) {
                    $existing = Attendance::where([
                        'school_id'       => $schoolId,
                        'date'            => $data['date'],
                        'attendable_type' => Student::class,
                        'attendable_id'   => $record['student_id'],
                    ]);

                    if (!empty($data['session_id'])) {
                        $existing->where('session_id', $data['session_id']);
                    }

                    $existing = $existing->first();

                    if ($existing && $existing->isSubmitted()) {
                        continue;
                    }

                    $isSubmitted = !empty($data['submit_immediately']);

                    Attendance::updateOrCreate(
                        [
                            'school_id'       => $schoolId,
                            'date'            => $data['date'],
                            'attendable_type' => Student::class,
                            'attendable_id'   => $record['student_id'],
                        ],
                        [
                            'status'          => $record['status'],
                            'status_draft'    => $isSubmitted ? 'submitted' : 'draft',
                            'session_id'      => $data['session_id'] ?? null,
                            'remarks'         => $record['remarks'] ?? null,
                            'submitted_by'    => $isSubmitted ? auth()->id() : null,
                            'submitted_at'    => $isSubmitted ? now() : null,
                        ]
                    );

                    if (in_array($record['status'], ['absent', 'late'])) {
                        $student = Student::with('guardian.user')->find($record['student_id']);
                        if ($student && $student->guardian?->user_id) {
                            $absentStudents[] = $student;
                        }
                    }
                }
            });

            foreach ($absentStudents as $student) {
                NotificationDispatchService::notifyUser(
                    $student->guardian->user,
                    'Student Absent',
                    "{$student->full_name} was marked " . ($student->pivot->status ?? 'absent') . " on " . Carbon::parse($data['date'])->format('d M Y') . '.',
                    '/school/parent/attendance'
                );
            }

            return back()->with('success', 'Attendance saved for ' . Carbon::parse($data['date'])->format('d M Y') . '.');
        } catch (\Throwable $e) {
            return back()->withInput()->with('error', 'Failed to save attendance: ' . $e->getMessage());
        }
    }

    /**
     * Submit attendance records for approval (draft → submitted).
     *
     * Class teachers can only submit for their assigned class.
     * Admins/principals can also submit.
     */
    public function submit(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'date'       => 'required|date',
            'class_id'   => 'required|exists:classes,id',
            'session_id' => 'nullable|exists:attendance_sessions,id',
        ]);

        // Enforce class teacher restriction
        ['role' => $role, 'assignedClasses' => $assignedClasses] = $this->resolveAttendanceRole();

        if ($role === 'class_teacher') {
            $allowedIds = $assignedClasses->pluck('id')->toArray();
            if (! in_array($data['class_id'], $allowedIds)) {
                return back()->with('error', 'You can only submit attendance for your assigned class.');
            }
        }

        $schoolId = $this->getSchoolId();

        $updated = Attendance::where([
            'school_id'       => $schoolId,
            'date'            => $data['date'],
            'attendable_type' => Student::class,
        ])
            ->whereHas('attendable', fn ($q) => $q->where('class_id', $data['class_id']))
            ->when(!empty($data['session_id']), fn ($q) => $q->where('session_id', $data['session_id']))
            ->whereNotNull('status_draft')
            ->whereNull('submitted_at')
            ->update([
                'status_draft' => 'submitted',
                'submitted_by' => auth()->id(),
                'submitted_at' => now(),
            ]);

        return back()->with('success', "{$updated} attendance records submitted for approval.");
    }

    /**
     * Bulk approve submitted attendance records.
     *
     * Only admins and principals can approve. Class teachers cannot.
     */
    public function bulkApprove(Request $request): RedirectResponse
    {
        if (! $this->canApproveAttendance()) {
            return back()->with('error', 'Only administrators and principals can approve attendance.');
        }

        $data = $request->validate([
            'date'         => 'required|date',
            'class_id'     => 'required|exists:classes,id',
            'session_id'   => 'nullable|exists:attendance_sessions,id',
            'attendance_ids' => 'nullable|array',
            'attendance_ids.*' => 'exists:attendances,id',
        ]);

        $schoolId = $this->getSchoolId();

        $query = Attendance::where([
            'school_id'       => $schoolId,
            'date'            => $data['date'],
            'attendable_type' => Student::class,
        ])
            ->whereHas('attendable', fn ($q) => $q->where('class_id', $data['class_id']))
            ->when(!empty($data['session_id']), fn ($q) => $q->where('session_id', $data['session_id']))
            ->whereNotNull('submitted_at')
            ->whereNull('approved_at');

        if (!empty($data['attendance_ids'])) {
            $query->whereIn('id', $data['attendance_ids']);
        }

        $updated = $query->update([
            'status_draft' => 'approved',
            'approved_by'  => auth()->id(),
            'approved_at'  => now(),
        ]);

        return back()->with('success', "{$updated} attendance records approved.");
    }

    /**
     * Monthly calendar view for a single student.
     */
    public function studentCalendar(Request $request, Student $student): Response
    {
        $month = $request->month ?? today()->format('Y-m');
        [$year, $mon] = explode('-', $month);

        $records = Attendance::where([
            'school_id'       => $this->getSchoolId(),
            'attendable_type' => Student::class,
            'attendable_id'   => $student->id,
        ])
        ->whereYear('date', $year)
        ->whereMonth('date', $mon)
        ->with('session:id,name')
        ->get(['date', 'status', 'status_draft', 'remarks', 'session_id'])
        ->keyBy(fn ($r) => $r->date->toDateString());

        $student->load(['schoolClass:id,name', 'section:id,name']);

        return Inertia::render('SchoolAdmin/Attendance/StudentCalendar', [
            'student' => $student,
            'records' => $records,
            'month'   => $month,
        ]);
    }

    /**
     * Staff attendance — daily mark page.
     */
    public function staffIndex(Request $request): Response
    {
        $date         = $request->date ?? today()->toDateString();
        $departmentId = $request->department_id;

        $staff = Staff::with('department:id,name', 'designation:id,name')
            ->when($departmentId, fn ($q) => $q->where('department_id', $departmentId))
            ->where('status', 'active')
            ->orderBy('first_name')
            ->get(['id', 'first_name', 'last_name', 'emp_id', 'department_id', 'designation_id']);

        $existing = Attendance::where([
            'school_id'       => $this->getSchoolId(),
            'date'            => $date,
            'attendable_type' => Staff::class,
        ])->whereIn('attendable_id', $staff->pluck('id'))
          ->get(['attendable_id', 'status', 'remarks'])
          ->keyBy('attendable_id');

        return Inertia::render('SchoolAdmin/Attendance/StaffIndex', [
            'staffList'   => $staff,
            'existing'    => $existing,
            'departments' => \App\Models\Department::orderBy('name')->get(['id', 'name']),
            'filters'     => [
                'date'          => $date,
                'department_id' => $departmentId,
            ],
        ]);
    }

    /**
     * Bulk upsert staff attendance for a date.
     */
    public function staffStore(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'date'                 => 'required|date',
            'records'              => 'required|array|min:1',
            'records.*.staff_id'   => 'required|exists:staff,id',
            'records.*.status'     => 'required|in:present,absent,late,half_day',
            'records.*.remarks'    => 'nullable|string|max:200',
        ]);

        $schoolId = $this->getSchoolId();

        try {
            DB::transaction(function () use ($data, $schoolId) {
                foreach ($data['records'] as $record) {
                    $existing = Attendance::where([
                        'school_id'       => $schoolId,
                        'date'            => $data['date'],
                        'attendable_type' => Staff::class,
                        'attendable_id'   => $record['staff_id'],
                    ])->first();

                    if ($existing && $existing->approved_at) {
                        continue;
                    }

                    Attendance::updateOrCreate(
                        [
                            'school_id'       => $schoolId,
                            'date'            => $data['date'],
                            'attendable_type' => Staff::class,
                            'attendable_id'   => $record['staff_id'],
                        ],
                        [
                            'status'  => $record['status'],
                            'remarks' => $record['remarks'] ?? null,
                        ]
                    );
                }
            });

            return back()->with('success', 'Staff attendance saved for ' . Carbon::parse($data['date'])->format('d M Y') . '.');
        } catch (\Throwable $e) {
            return back()->withInput()->with('error', 'Failed to save staff attendance: ' . $e->getMessage());
        }
    }

    /**
     * List pending correction requests.
     */
    public function correctionIndex(Request $request): Response
    {
        $corrections = AttendanceCorrection::with(['attendance', 'requester', 'reviewer'])
            ->where('school_id', $this->getSchoolId())
            ->when($request->status, fn ($q) => $q->where('status', $request->status))
            ->latest()
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('SchoolAdmin/Attendance/Corrections', [
            'corrections' => [
                'data' => $corrections->items(),
                'meta' => [
                    'total' => $corrections->total(), 'per_page' => $corrections->perPage(),
                    'current_page' => $corrections->currentPage(), 'last_page' => $corrections->lastPage(),
                    'from' => $corrections->firstItem(), 'to' => $corrections->lastItem(),
                ],
            ],
            'filters' => $request->only('status'),
        ]);
    }

    /**
     * Request a correction for an attendance record.
     */
    public function correctionRequest(Request $request, Attendance $attendance): RedirectResponse
    {
        $data = $request->validate([
            'new_status' => 'required|in:present,absent,late,half_day',
            'reason'     => 'required|string|max:500',
        ]);

        if ($attendance->approved_at) {
            return back()->with('error', 'Cannot request correction for approved attendance.');
        }

        try {
            AttendanceCorrection::create([
                'school_id'       => $this->getSchoolId(),
                'attendance_id'   => $attendance->id,
                'requested_by'    => auth()->id(),
                'original_status' => $attendance->status ?? $attendance->status_draft,
                'new_status'      => $data['new_status'],
                'reason'          => $data['reason'],
                'status'          => 'pending',
            ]);

            return back()->with('success', 'Correction request submitted.');
        } catch (\Throwable $e) {
            return back()->with('error', 'Failed to submit correction: ' . $e->getMessage());
        }
    }

    /**
     * Approve or reject a correction request.
     */
    public function correctionReview(Request $request, AttendanceCorrection $correction): RedirectResponse
    {
        $data = $request->validate([
            'action'         => 'required|in:approve,reject',
            'reviewer_notes' => 'nullable|string|max:500',
        ]);

        if ($correction->status !== 'pending') {
            return back()->with('error', 'This correction has already been reviewed.');
        }

        try {
            DB::transaction(function () use ($data, $correction) {
                $correction->update([
                    'status'         => $data['action'] === 'approve' ? 'approved' : 'rejected',
                    'reviewed_by'    => auth()->id(),
                    'reviewer_notes' => $data['reviewer_notes'] ?? null,
                    'reviewed_at'    => now(),
                ]);

                if ($data['action'] === 'approve') {
                    $correction->attendance->update([
                        'status_draft' => null,
                        'status'       => $correction->new_status,
                    ]);
                }
            });

            return back()->with('success', 'Correction ' . ($data['action'] === 'approve' ? 'approved' : 'rejected') . '.');
        } catch (\Throwable $e) {
            return back()->with('error', 'Failed to review correction: ' . $e->getMessage());
        }
    }
}
