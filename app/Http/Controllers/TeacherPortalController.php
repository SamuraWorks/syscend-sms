<?php

namespace App\Http\Controllers;

use App\Models\Announcement;
use App\Models\Attendance;
use App\Models\AcademicYear;
use App\Models\AcademicTerm;
use App\Models\Exam;
use App\Models\Homework;
use App\Models\HomeworkSubmission;
use App\Models\LessonPlan;
use App\Models\Mark;
use App\Models\Message;
use App\Models\NationalExamination;
use App\Models\OnlineClass;
use App\Models\ReportCard;
use App\Models\School;
use App\Models\Staff;
use App\Models\Student;
use App\Models\Subject;
use App\Models\Syllabus;
use App\Models\TeacherSubjectAssignment;
use App\Models\Timetable;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class TeacherPortalController extends Controller
{
    private function resolveTeacher(): ?Staff
    {
        $user = auth()->user();
        return Staff::with([
            'department:id,name',
            'designation:id,name',
            'formMasterSection:id,name,class_id',
            'formMasterClass:id,name',
        ])
            ->where('school_id', $user->school_id)
            ->where('user_id', $user->id)
            ->first();
    }

    private function getTeacherClassIds(Staff $teacher): array
    {
        $classIds = Timetable::where('school_id', $teacher->school_id)
            ->where('teacher_id', $teacher->id)
            ->pluck('class_id')
            ->unique()
            ->values()
            ->toArray();

        if ($teacher->isFormMaster() && $teacher->form_master_class_id) {
            $classIds[] = $teacher->form_master_class_id;
        }

        if ($classTeacherId = \App\Models\SchoolClass::where('class_teacher_id', $teacher->id)->value('id')) {
            $classIds[] = $classTeacherId;
        }

        $assignmentClassIds = TeacherSubjectAssignment::where('school_id', $teacher->school_id)
            ->where('staff_id', $teacher->id)
            ->where('is_active', true)
            ->with('subjectOffering:id,class_id')
            ->get()
            ->pluck('subjectOffering.class_id')
            ->filter()
            ->values()
            ->toArray();
        $classIds = array_merge($classIds, $assignmentClassIds);

        return array_unique($classIds);
    }

    private function getTeacherSectionIds(Staff $teacher): array
    {
        $sectionIds = Timetable::where('school_id', $teacher->school_id)
            ->where('teacher_id', $teacher->id)
            ->pluck('section_id')
            ->unique()
            ->values()
            ->toArray();

        if ($teacher->isFormMaster() && $teacher->form_master_section_id) {
            $sectionIds[] = $teacher->form_master_section_id;
        }

        $assignmentSections = TeacherSubjectAssignment::where('school_id', $teacher->school_id)
            ->where('staff_id', $teacher->id)
            ->where('is_active', true)
            ->with('subjectOffering:id,section_id')
            ->get()
            ->pluck('subjectOffering.section_id')
            ->filter()
            ->values()
            ->toArray();
        $sectionIds = array_merge($sectionIds, $assignmentSections);

        return array_unique($sectionIds);
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
        $teacher = $this->resolveTeacher();
        if (! $teacher) return $this->notLinked('Teacher/Dashboard');

        $user     = auth()->user();
        $now      = Carbon::now();
        $today    = $now->toDateString();
        $schoolId = $user->school_id;

        $assignedSubjects = Timetable::where('school_id', $schoolId)
            ->where('teacher_id', $teacher->id)
            ->where('status', 'published')
            ->with('subject:id,name')
            ->get()
            ->pluck('subject')
            ->unique('id')
            ->values();

        $assignedClasses = Timetable::where('school_id', $schoolId)
            ->where('teacher_id', $teacher->id)
            ->where('status', 'published')
            ->with(['schoolClass:id,name', 'section:id,name'])
            ->get()
            ->map(fn ($t) => ['class' => $t->schoolClass?->name, 'section' => $t->section?->name])
            ->values();

        if ($teacher->isFormMaster() && $teacher->form_master_class_id) {
            $fmClass = \App\Models\SchoolClass::where('id', $teacher->form_master_class_id)->first(['id', 'name']);
            $fmSection = $teacher->formMasterSection?->name;
            if ($fmClass && !$assignedClasses->contains(fn ($c) => $c['class'] === $fmClass->name && $c['section'] === $fmSection)) {
                $assignedClasses->push(['class' => $fmClass->name, 'section' => $fmSection]);
            }
        }

        $subjectAssignmentClasses = TeacherSubjectAssignment::where('school_id', $schoolId)
            ->where('staff_id', $teacher->id)
            ->where('is_active', true)
            ->with('subjectOffering.schoolClass:id,name', 'subjectOffering.section:id,name')
            ->get()
            ->pluck('subjectOffering')
            ->filter()
            ->map(fn ($o) => ['class' => $o->schoolClass?->name, 'section' => $o->section?->name])
            ->values();

        foreach ($subjectAssignmentClasses as $saClass) {
            if ($saClass['class'] && !$assignedClasses->contains(fn ($c) => $c['class'] === $saClass['class'] && $c['section'] === $saClass['section'])) {
                $assignedClasses->push($saClass);
            }
        }

        $assignedClasses = $assignedClasses->unique(fn ($v) => ($v['class'] ?? '') . ($v['section'] ?? ''))->values();

        $classIds  = $this->getTeacherClassIds($teacher);
        $sectionIds = $this->getTeacherSectionIds($teacher);

        $totalStudents = Student::where('school_id', $schoolId)
            ->whereIn('class_id', $classIds)
            ->when($teacher->isFormMaster() && $teacher->form_master_section_id, fn ($q) => $q->where('section_id', $teacher->form_master_section_id))
            ->count();

        $attendanceToday = Attendance::where('school_id', $schoolId)
            ->where('date', $today)
            ->where('attendable_type', Student::class)
            ->whereIn('attendable_id', Student::whereIn('class_id', $classIds)->pluck('id'))
            ->count();

        $pendingHomework = Homework::where('school_id', $schoolId)
            ->where('teacher_id', $teacher->id)
            ->where('is_active', true)
            ->count();

        $examsAwaitingMarks = Exam::where('school_id', $schoolId)
            ->whereIn('class_id', $classIds)
            ->where('status', '!=', 'completed')
            ->count();

        $unreadMessages = Message::where('school_id', $schoolId)
            ->where('recipient_id', $user->id)
            ->whereNull('read_at')
            ->count();

        $timetableToday = Timetable::where('school_id', $schoolId)
            ->where('teacher_id', $teacher->id)
            ->where('day_of_week', strtolower($now->format('l')))
            ->where('status', 'published')
            ->with(['subject:id,name', 'schoolClass:id,name', 'section:id,name'])
            ->orderBy('start_time')
            ->get()
            ->map(fn ($t) => [
                'subject'    => $t->subject?->name,
                'class'      => $t->schoolClass?->name,
                'section'    => $t->section?->name,
                'start_time' => substr($t->start_time, 0, 5),
                'end_time'   => substr($t->end_time, 0, 5),
                'room'       => $t->room,
            ]);

        $upcomingExams = Exam::where('school_id', $schoolId)
            ->whereIn('class_id', $classIds)
            ->where('start_date', '>=', $today)
            ->orderBy('start_date')
            ->limit(5)
            ->get(['id', 'name', 'type', 'start_date', 'class_id']);

        $upcomingHomework = Homework::where('school_id', $schoolId)
            ->where('teacher_id', $teacher->id)
            ->where('due_date', '>=', $today)
            ->where('is_active', true)
            ->with('schoolClass:id,name')
            ->orderBy('due_date')
            ->limit(5)
            ->get(['id', 'title', 'due_date', 'class_id']);

        $recentAnnouncements = Announcement::where('school_id', $schoolId)
            ->where(fn ($q) => $q->where('audience', 'all')
                ->orWhere('audience', 'teachers')
                ->orWhere(fn ($q2) => $q2->where('audience', 'class')->whereIn('class_id', $classIds))
            )
            ->orderByDesc('published_at')
            ->limit(5)
            ->get(['id', 'title', 'body', 'is_pinned', 'published_at']);

        $academicYear = AcademicYear::where('school_id', $schoolId)->where('is_current', true)->first();
        $academicTerm = AcademicTerm::where('school_id', $schoolId)->where('is_current', true)->first();

        $currentLesson = $timetableToday->first(fn ($t) => $t['start_time'] <= $now->format('H:i') && $t['end_time'] >= $now->format('H:i'));

        return Inertia::render('Teacher/Dashboard', [
            'linked'             => true,
            'teacher'            => [
                'id'             => $teacher->id,
                'full_name'      => $teacher->full_name,
                'emp_id'         => $teacher->emp_id,
                'photo_url'      => $teacher->photo_url,
                'designation'    => $teacher->designation?->name,
                'department'     => $teacher->department?->name,
                'teacher_type'   => $teacher->teacher_type,
                'is_form_master' => $teacher->isFormMaster(),
                'is_subject_teacher' => $teacher->isSubjectTeacher(),
            ],
            'academicYear'       => $academicYear?->name,
            'academicTerm'       => $academicTerm?->name,
            'assignedSubjects'   => $assignedSubjects,
            'assignedClasses'    => $assignedClasses,
            'stats'              => [
                'classes_teaching'      => count($assignedClasses),
                'total_students'        => $totalStudents,
                'attendance_today'      => $attendanceToday,
                'homework_pending'      => $pendingHomework,
                'exams_awaiting_marks'  => $examsAwaitingMarks,
                'unread_messages'       => $unreadMessages,
            ],
            'timetableToday'     => $timetableToday,
            'currentLesson'      => $currentLesson,
            'upcomingExams'      => $upcomingExams,
            'upcomingHomework'   => $upcomingHomework,
            'recentAnnouncements'=> $recentAnnouncements,
        ]);
    }

    /* ─────────────────────────────────────────────
       ACADEMIC
    ───────────────────────────────────────────── */

    public function academic()
    {
        $teacher = $this->resolveTeacher();
        if (! $teacher) return $this->notLinked('Teacher/Academic');

        $schoolId   = $teacher->school_id;
        $classIds   = $this->getTeacherClassIds($teacher);
        $sectionIds = $this->getTeacherSectionIds($teacher);

        $assignedSubjects = Timetable::where('school_id', $schoolId)
            ->where('teacher_id', $teacher->id)
            ->where('status', 'published')
            ->with('subject:id,name,code')
            ->get()
            ->pluck('subject')
            ->filter()
            ->unique('id')
            ->values();

        $assignmentSubjects = TeacherSubjectAssignment::where('school_id', $schoolId)
            ->where('staff_id', $teacher->id)
            ->where('is_active', true)
            ->with('subjectOffering.subject:id,name,code')
            ->get()
            ->pluck('subjectOffering.subject')
            ->filter()
            ->unique('id')
            ->values();

        foreach ($assignmentSubjects as $as) {
            if (!$assignedSubjects->contains('id', $as->id)) {
                $assignedSubjects->push($as);
            }
        }

        $teachingLoad = Timetable::where('school_id', $schoolId)
            ->where('teacher_id', $teacher->id)
            ->where('status', 'published')
            ->with(['subject:id,name', 'schoolClass:id,name', 'section:id,name'])
            ->get()
            ->groupBy(fn ($t) => $t->schoolClass?->name . ' - ' . $t->section?->name)
            ->map(fn ($slots, $label) => [
                'label'   => $label,
                'classes' => $slots->map(fn ($s) => [
                    'subject'    => $s->subject?->name,
                    'day'        => $s->day_of_week,
                    'start_time' => substr($s->start_time, 0, 5),
                    'end_time'   => substr($s->end_time, 0, 5),
                    'room'       => $s->room,
                ])->values(),
            ])
            ->values();

        $assignmentLoad = TeacherSubjectAssignment::where('school_id', $schoolId)
            ->where('staff_id', $teacher->id)
            ->where('is_active', true)
            ->with(['subjectOffering.schoolClass:id,name', 'subjectOffering.section:id,name', 'subjectOffering.subject:id,name'])
            ->get()
            ->pluck('subjectOffering')
            ->filter()
            ->groupBy(fn ($o) => ($o->schoolClass?->name ?? 'Unassigned') . ' - ' . ($o->section?->name ?? 'General'))
            ->map(fn ($offerings, $label) => [
                'label'   => $label,
                'classes' => $offerings->map(fn ($o) => [
                    'subject'    => $o->subject?->name ?? $o->subject_name,
                    'day'        => null,
                    'start_time' => null,
                    'end_time'   => null,
                    'room'       => null,
                ])->values(),
            ])
            ->values();

        foreach ($assignmentLoad as $al) {
            if (!$teachingLoad->contains('label', $al['label'])) {
                $teachingLoad->push($al);
            }
        }

        $studentsPerClass = Student::where('school_id', $schoolId)
            ->whereIn('class_id', $classIds)
            ->with(['schoolClass:id,name', 'section:id,name'])
            ->get()
            ->groupBy(fn ($s) => ($s->schoolClass?->name ?? 'Unknown') . ' - ' . ($s->section?->name ?? 'Unassigned'))
            ->map(fn ($students, $label) => ['label' => $label, 'count' => $students->count()])
            ->values();

        $academicYear = AcademicYear::where('school_id', $schoolId)->where('is_current', true)->first();
        $academicTerm = AcademicTerm::where('school_id', $schoolId)->where('is_current', true)->first();

        return Inertia::render('Teacher/Academic', [
            'linked'           => true,
            'teacher'          => [
                'full_name'    => $teacher->full_name,
                'teacher_type' => $teacher->teacher_type,
            ],
            'assignedSubjects' => $assignedSubjects,
            'teachingLoad'     => $teachingLoad,
            'studentsPerClass' => $studentsPerClass,
            'academicYear'     => $academicYear?->name,
            'academicTerm'     => $academicTerm?->name,
        ]);
    }

    /* ─────────────────────────────────────────────
       MY CLASSES
    ───────────────────────────────────────────── */

    public function classes()
    {
        $teacher = $this->resolveTeacher();
        if (! $teacher) return $this->notLinked('Teacher/MyClasses');

        $schoolId   = $teacher->school_id;
        $classIds   = $this->getTeacherClassIds($teacher);
        $sectionIds = $this->getTeacherSectionIds($teacher);

        $classSections = Timetable::where('school_id', $schoolId)
            ->where('teacher_id', $teacher->id)
            ->where('status', 'published')
            ->with(['schoolClass:id,name', 'section:id,name', 'subject:id,name'])
            ->get()
            ->toBase()
            ->groupBy(fn ($t) => $t->class_id . '-' . $t->section_id)
            ->map(function ($slots, $key) use ($schoolId) {
                $first      = $slots->first();
                $classId    = $first->class_id;
                $sectionId  = $first->section_id;
                $studentCount = Student::where('school_id', $schoolId)
                    ->where('class_id', $classId)
                    ->where('section_id', $sectionId)
                    ->count();

                return [
                    'class_id'      => $classId,
                    'section_id'    => $sectionId,
                    'class_name'    => $first->schoolClass?->name ?? '—',
                    'section_name'  => $first->section?->name ?? '—',
                    'subjects'      => $slots->pluck('subject')->filter()->unique('id')->values(),
                    'student_count' => $studentCount,
                    'slots'         => $slots->count(),
                ];
            })
            ->values();

        $existingKeys = $classSections
            ->map(fn ($cs) => $cs['class_id'] . '-' . $cs['section_id'])
            ->toArray();

        $assignmentClasses = TeacherSubjectAssignment::where('school_id', $schoolId)
            ->where('staff_id', $teacher->id)
            ->where('is_active', true)
            ->with(['subjectOffering.schoolClass:id,name', 'subjectOffering.section:id,name', 'subjectOffering.subject:id,name'])
            ->get()
            ->toBase()
            ->pluck('subjectOffering')
            ->filter()
            ->filter(fn ($o) => !in_array($o->class_id . '-' . ($o->section_id ?? ''), $existingKeys))
            ->groupBy(fn ($o) => $o->class_id . '-' . $o->section_id)
            ->map(function ($offerings, $key) use ($schoolId) {
                $first = $offerings->first();
                $classId = $first->class_id;
                $sectionId = $first->section_id;
                $studentCount = Student::where('school_id', $schoolId)
                    ->where('class_id', $classId)
                    ->where('section_id', $sectionId)
                    ->count();

                return [
                    'class_id'      => $classId,
                    'section_id'    => $sectionId,
                    'class_name'    => $first->schoolClass?->name ?? '—',
                    'section_name'  => $first->section?->name ?? '—',
                    'subjects'      => $offerings->pluck('subject')->filter()->unique('id')->values(),
                    'student_count' => $studentCount,
                    'slots'         => $offerings->count(),
                ];
            })
            ->values();

        $classSections = $classSections->merge($assignmentClasses);

        $formMasterInfo = null;
        if ($teacher->isFormMaster() && $teacher->form_master_class_id) {
            $fmStudentCount = Student::where('school_id', $schoolId)
                ->where('class_id', $teacher->form_master_class_id)
                ->where('section_id', $teacher->form_master_section_id)
                ->count();

            $formMasterInfo = [
                'class_id'      => $teacher->form_master_class_id,
                'section_id'    => $teacher->form_master_section_id,
                'class_name'    => $teacher->formMasterClass?->name ?? '—',
                'section_name'  => $teacher->formMasterSection?->name ?? '—',
                'student_count' => $fmStudentCount,
            ];
        }

        return Inertia::render('Teacher/MyClasses', [
            'linked'           => true,
            'teacher'          => [
                'full_name'    => $teacher->full_name,
                'teacher_type' => $teacher->teacher_type,
            ],
            'classes'          => $classSections,
            'formMasterInfo'   => $formMasterInfo,
        ]);
    }

    /* ─────────────────────────────────────────────
       STUDENTS
    ───────────────────────────────────────────── */

    public function students()
    {
        $teacher = $this->resolveTeacher();
        if (! $teacher) return $this->notLinked('Teacher/Students');

        $schoolId   = $teacher->school_id;
        $classIds   = $this->getTeacherClassIds($teacher);
        $sectionIds = $this->getTeacherSectionIds($teacher);

        $students = Student::where('school_id', $schoolId)
            ->whereIn('class_id', $classIds)
            ->with(['schoolClass:id,name', 'section:id,name', 'guardian:id,name,phone'])
            ->orderBy('first_name')
            ->get()
            ->map(fn ($s) => [
                'id'            => $s->id,
                'full_name'     => $s->full_name,
                'admission_no'  => $s->admission_no,
                'student_id'    => $s->student_id,
                'gender'        => $s->gender,
                'class'         => $s->schoolClass?->name,
                'section'       => $s->section?->name,
                'class_id'      => $s->class_id,
                'section_id'    => $s->section_id,
                'photo_url'     => $s->photo_url,
                'status'        => $s->status,
                'guardian_name' => $s->guardian?->name,
                'guardian_phone'=> $s->guardian?->phone,
            ]);

        return Inertia::render('Teacher/Students', [
            'linked'   => true,
            'teacher'  => ['full_name' => $teacher->full_name],
            'students' => $students,
        ]);
    }

    public function studentProfile($id)
    {
        $teacher = $this->resolveTeacher();
        if (! $teacher) return $this->notLinked('Teacher/StudentProfile');

        $student = Student::with([
            'schoolClass:id,name', 'section:id,name', 'department:id,name',
            'guardian:id,name,phone,email,relation',
        ])
            ->where('school_id', $teacher->school_id)
            ->where('id', $id)
            ->first();

        if (! $student) return redirect()->route('teacher.students');

        $attendance = Attendance::where('school_id', $teacher->school_id)
            ->where('attendable_type', Student::class)
            ->where('attendable_id', $student->id)
            ->select('status', DB::raw('count(*) as total'))
            ->groupBy('status')
            ->pluck('total', 'status');

        $marks = Mark::where('school_id', $teacher->school_id)
            ->where('student_id', $student->id)
            ->with(['exam:id,name', 'subject:id,name'])
            ->orderByDesc('created_at')
            ->limit(10)
            ->get();

        $homework = Homework::where('school_id', $teacher->school_id)
            ->where('class_id', $student->class_id)
            ->with('submissions')
            ->orderByDesc('due_date')
            ->limit(10)
            ->get()
            ->map(fn ($h) => [
                'id'          => $h->id,
                'title'       => $h->title,
                'subject'     => $h->subject?->name,
                'due_date'    => $h->due_date,
                'submitted'   => $h->submissions->contains('student_id', $student->id),
                'status'      => $h->submissions->firstWhere('student_id', $student->id)?->status ?? 'pending',
            ]);

        return Inertia::render('Teacher/StudentProfile', [
            'linked'     => true,
            'teacher'    => ['full_name' => $teacher->full_name],
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
            'attendance' => $attendance->toArray(),
            'marks'      => $marks->map(fn ($m) => [
                'exam'    => $m->exam?->name,
                'subject' => $m->subject?->name,
                'marks'   => $m->marks_obtained,
                'grade'   => $m->grade,
                'absent'  => $m->is_absent,
            ]),
            'homework'   => $homework,
        ]);
    }

    /* ─────────────────────────────────────────────
       TIMETABLE
    ───────────────────────────────────────────── */

    public function timetable()
    {
        $teacher = $this->resolveTeacher();
        if (! $teacher) return $this->notLinked('Teacher/Timetable');

        $days = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];
        $timetable = [];

        $slots = Timetable::where('school_id', $teacher->school_id)
            ->where('teacher_id', $teacher->id)
            ->where('status', 'published')
            ->with(['subject:id,name', 'schoolClass:id,name', 'section:id,name'])
            ->orderBy('start_time')
            ->get();

        foreach ($days as $day) {
            $daySlots = $slots->where('day_of_week', $day)->values();
            if ($daySlots->isNotEmpty()) {
                $timetable[$day] = $daySlots->map(fn ($t) => [
                    'subject'    => $t->subject?->name,
                    'class'      => $t->schoolClass?->name,
                    'section'    => $t->section?->name,
                    'start_time' => substr($t->start_time, 0, 5),
                    'end_time'   => substr($t->end_time, 0, 5),
                    'room'       => $t->room,
                ]);
            }
        }

        return Inertia::render('Teacher/Timetable', [
            'linked'    => true,
            'teacher'   => ['full_name' => $teacher->full_name],
            'timetable' => $timetable,
            'today'     => strtolower(Carbon::now()->format('l')),
        ]);
    }

    /* ─────────────────────────────────────────────
       ATTENDANCE
    ───────────────────────────────────────────── */

    public function attendance()
    {
        $teacher = $this->resolveTeacher();
        if (! $teacher) return $this->notLinked('Teacher/Attendance');

        $schoolId   = $teacher->school_id;
        $classIds   = $this->getTeacherClassIds($teacher);
        $sectionIds = $this->getTeacherSectionIds($teacher);

        $classes = DB::table('classes')
            ->whereIn('id', $classIds)
            ->get(['id', 'name']);

        $sections = DB::table('sections')
            ->whereIn('id', $sectionIds)
            ->get(['id', 'name', 'class_id']);

        $recentAttendance = Attendance::where('school_id', $schoolId)
            ->where('attendable_type', Student::class)
            ->whereDate('date', '>=', Carbon::now()->subDays(30))
            ->whereIn('attendable_id', Student::whereIn('class_id', $classIds)->pluck('id'))
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

        return Inertia::render('Teacher/Attendance', [
            'linked'            => true,
            'teacher'           => ['full_name' => $teacher->full_name, 'is_form_master' => $teacher->isFormMaster()],
            'classes'           => $classes,
            'sections'          => $sections,
            'recentAttendance'  => $recentAttendance,
        ]);
    }

    /**
     * Get class IDs where this teacher is the assigned class teacher.
     */
    private function getClassTeacherClassIds(Staff $teacher): array
    {
        return \App\Models\SchoolClass::where('school_id', $teacher->school_id)
            ->where('class_teacher_id', $teacher->id)
            ->pluck('id')
            ->toArray();
    }

    public function attendanceTake(Request $request)
    {
        $teacher = $this->resolveTeacher();
        if (! $teacher) return $this->notLinked('Teacher/AttendanceTake');

        $classId   = $request->query('class_id');
        $sectionId = $request->query('section_id');
        $date      = $request->query('date', Carbon::now()->toDateString());

        // Enforce: class teacher can only take attendance for their assigned class
        $allowedClassIds = $this->getClassTeacherClassIds($teacher);
        if (! empty($allowedClassIds) && ! in_array((int) $classId, $allowedClassIds)) {
            return redirect()->route('teacher.attendance')
                ->with('error', 'You can only take attendance for your assigned class.');
        }

        $studentQuery = Student::where('school_id', $teacher->school_id)
            ->where('class_id', $classId)
            ->with('schoolClass:id,name', 'section:id,name');

        if ($sectionId) {
            $studentQuery->where('section_id', $sectionId);
        }

        $students = $studentQuery->orderBy('first_name')->get()
            ->map(fn ($s) => [
                'id'         => $s->id,
                'full_name'  => $s->full_name,
                'admission_no' => $s->admission_no,
                'photo_url'  => $s->photo_url,
            ]);

        $existing = Attendance::where('school_id', $teacher->school_id)
            ->where('attendable_type', Student::class)
            ->whereDate('date', $date)
            ->whereIn('attendable_id', $students->pluck('id'))
            ->pluck('status', 'attendable_id')
            ->toArray();

        // Only show the assigned class in the dropdown
        $classes  = DB::table('classes')->whereIn('id', ! empty($allowedClassIds) ? $allowedClassIds : $this->getTeacherClassIds($teacher))->get(['id', 'name']);
        $sections = DB::table('sections')->whereIn('id', $this->getTeacherSectionIds($teacher))->get(['id', 'name', 'class_id']);

        return Inertia::render('Teacher/AttendanceTake', [
            'linked'    => true,
            'teacher'   => ['full_name' => $teacher->full_name, 'is_form_master' => $teacher->isFormMaster()],
            'students'  => $students,
            'existing'  => $existing,
            'date'      => $date,
            'classId'   => (int) $classId,
            'sectionId' => $sectionId ? (int) $sectionId : null,
            'classes'   => $classes,
            'sections'  => $sections,
        ]);
    }

    public function attendanceStore(Request $request)
    {
        $teacher = $this->resolveTeacher();
        if (! $teacher) return back()->withErrors(['error' => 'Teacher not linked']);

        $request->validate([
            'date'       => 'required|date',
            'class_id'   => 'required|integer',
            'section_id' => 'nullable|integer',
            'records'    => 'required|array',
            'records.*.student_id' => 'required|integer',
            'records.*.status'     => 'required|in:present,absent,late,excused,medical_leave',
        ]);

        // Enforce: class teacher can only save attendance for their assigned class
        $allowedClassIds = $this->getClassTeacherClassIds($teacher);
        if (! empty($allowedClassIds) && ! in_array((int) $request->class_id, $allowedClassIds)) {
            return back()->with('error', 'You can only save attendance for your assigned class.');
        }

        $schoolId = $teacher->school_id;

        foreach ($request->records as $record) {
            Attendance::updateOrCreate(
                [
                    'school_id'        => $schoolId,
                    'attendable_type'  => Student::class,
                    'attendable_id'    => $record['student_id'],
                    'date'             => $request->date,
                ],
                [
                    'status'           => $record['status'],
                    'academic_year_id' => AcademicYear::where('school_id', $schoolId)->where('is_current', true)->value('id'),
                ]
            );
        }

        return back()->with('success', 'Attendance saved successfully.');
    }

    /* ─────────────────────────────────────────────
       EXAMINATIONS
    ───────────────────────────────────────────── */

    public function exams()
    {
        $teacher = $this->resolveTeacher();
        if (! $teacher) return $this->notLinked('Teacher/Exams');

        $schoolId = $teacher->school_id;
        $classIds = $this->getTeacherClassIds($teacher);

        $exams = Exam::where('school_id', $schoolId)
            ->whereIn('class_id', $classIds)
            ->with(['schoolClass:id,name', 'academicYear:id,name', 'term:id,name'])
            ->orderByDesc('start_date')
            ->get()
            ->map(fn ($e) => [
                'id'            => $e->id,
                'name'          => $e->name,
                'type'          => $e->type,
                'start_date'    => $e->start_date?->format('d M Y'),
                'end_date'      => $e->end_date?->format('d M Y'),
                'status'        => $e->status,
                'class'         => $e->schoolClass?->name,
                'academic_year' => $e->academicYear?->name,
                'term'          => $e->term?->name,
                'marks_count'   => $e->marks()->count(),
            ]);

        $subjects = Subject::where('school_id', $schoolId)
            ->whereIn('class_id', $classIds)
            ->get(['id', 'name', 'class_id']);

        $classes = DB::table('classes')->whereIn('id', $classIds)->get(['id', 'name']);

        return Inertia::render('Teacher/Exams', [
            'linked'   => true,
            'teacher'  => ['full_name' => $teacher->full_name],
            'exams'    => $exams,
            'subjects' => $subjects,
            'classes'  => $classes,
        ]);
    }

    public function gradeEntry($examId)
    {
        $teacher = $this->resolveTeacher();
        if (! $teacher) return $this->notLinked('Teacher/GradeEntry');

        $exam = Exam::where('school_id', $teacher->school_id)
            ->where('id', $examId)
            ->with(['schoolClass:id,name', 'marks' => fn ($q) => $q->with('student:id,first_name,last_name,admission_no')->with('subject:id,name')])
            ->first();

        if (! $exam) return redirect()->route('teacher.exams');

        $subjectId = request()->query('subject_id');
        $students  = Student::where('school_id', $teacher->school_id)
            ->where('class_id', $exam->class_id)
            ->orderBy('first_name')
            ->get(['id', 'first_name', 'last_name', 'admission_no']);

        $subjects = Timetable::where('school_id', $teacher->school_id)
            ->where('teacher_id', $teacher->id)
            ->where('class_id', $exam->class_id)
            ->where('status', 'published')
            ->with('subject:id,name')
            ->get()
            ->pluck('subject')
            ->unique('id')
            ->values();

        $existingMarks = $exam->marks
            ->filter(fn ($m) => ! $subjectId || $m->subject_id == $subjectId)
            ->keyBy(fn ($m) => "{$m->student_id}_{$m->subject_id}");

        return Inertia::render('Teacher/GradeEntry', [
            'linked'        => true,
            'teacher'       => ['full_name' => $teacher->full_name],
            'exam'          => [
                'id'         => $exam->id,
                'name'       => $exam->name,
                'type'       => $exam->type,
                'class'      => $exam->schoolClass?->name,
                'class_id'   => $exam->class_id,
                'ca_weight'  => $exam->ca_weight,
                'exam_weight'=> $exam->exam_weight,
            ],
            'students'      => $students,
            'subjects'      => $subjects,
            'existingMarks' => $existingMarks->values(),
            'subjectId'     => $subjectId ? (int) $subjectId : null,
        ]);
    }

    public function gradeStore(Request $request, $examId)
    {
        $teacher = $this->resolveTeacher();
        if (! $teacher) return back()->withErrors(['error' => 'Teacher not linked']);

        $request->validate([
            'subject_id'              => 'required|integer',
            'marks'                   => 'required|array',
            'marks.*.student_id'      => 'required|integer',
            'marks.*.marks_obtained'  => 'nullable|numeric|min:0',
            'marks.*.is_absent'       => 'boolean',
        ]);

        $schoolId = $teacher->school_id;

        foreach ($request->marks as $m) {
            if (isset($m['is_absent']) && $m['is_absent']) {
                Mark::updateOrCreate(
                    ['school_id' => $schoolId, 'exam_id' => $examId, 'student_id' => $m['student_id'], 'subject_id' => $request->subject_id],
                    ['is_absent' => true, 'marks_obtained' => 0, 'status' => 'draft']
                );
            } elseif (isset($m['marks_obtained']) && $m['marks_obtained'] !== null) {
                Mark::updateOrCreate(
                    ['school_id' => $schoolId, 'exam_id' => $examId, 'student_id' => $m['student_id'], 'subject_id' => $request->subject_id],
                    ['marks_obtained' => $m['marks_obtained'], 'is_absent' => false, 'status' => 'draft']
                );
            }
        }

        return back()->with('success', 'Marks saved successfully.');
    }

    /* ─────────────────────────────────────────────
       HOMEWORK
    ───────────────────────────────────────────── */

    public function homework()
    {
        $teacher = $this->resolveTeacher();
        if (! $teacher) return $this->notLinked('Teacher/Homework');

        $hw = Homework::where('school_id', $teacher->school_id)
            ->where('teacher_id', $teacher->id)
            ->with(['schoolClass:id,name', 'subject:id,name'])
            ->orderByDesc('created_at')
            ->get()
            ->map(fn ($h) => [
                'id'          => $h->id,
                'title'       => $h->title,
                'description' => $h->description,
                'subject'     => $h->subject?->name,
                'class'       => $h->schoolClass?->name,
                'due_date'    => $h->due_date?->format('d M Y'),
                'is_active'   => $h->is_active,
                'submissions' => $h->submissions()->count(),
                'attachment'  => $h->attachment,
            ]);

        $classes  = DB::table('classes')->whereIn('id', $this->getTeacherClassIds($teacher))->get(['id', 'name']);
        $subjects = Subject::where('school_id', $teacher->school_id)
            ->whereIn('class_id', $this->getTeacherClassIds($teacher))
            ->get(['id', 'name', 'class_id']);

        return Inertia::render('Teacher/Homework', [
            'linked'   => true,
            'teacher'  => ['full_name' => $teacher->full_name],
            'homework' => $hw,
            'classes'  => $classes,
            'subjects' => $subjects,
        ]);
    }

    public function homeworkCreate()
    {
        $teacher = $this->resolveTeacher();
        if (! $teacher) return $this->notLinked('Teacher/HomeworkCreate');

        $classes  = DB::table('classes')->whereIn('id', $this->getTeacherClassIds($teacher))->get(['id', 'name']);
        $sections = DB::table('sections')->whereIn('id', $this->getTeacherSectionIds($teacher))->get(['id', 'name', 'class_id']);
        $subjects = Subject::where('school_id', $teacher->school_id)
            ->whereIn('class_id', $this->getTeacherClassIds($teacher))
            ->get(['id', 'name', 'class_id']);

        return Inertia::render('Teacher/HomeworkCreate', [
            'linked'   => true,
            'teacher'  => ['full_name' => $teacher->full_name],
            'classes'  => $classes,
            'sections' => $sections,
            'subjects' => $subjects,
        ]);
    }

    public function homeworkStore(Request $request)
    {
        $teacher = $this->resolveTeacher();
        if (! $teacher) return back()->withErrors(['error' => 'Teacher not linked']);

        $request->validate([
            'title'       => 'required|string|max:255',
            'description' => 'nullable|string',
            'class_id'    => 'required|exists:classes,id',
            'subject_id'  => 'required|exists:subjects,id',
            'due_date'    => 'required|date',
            'attachment'  => 'nullable|file|max:10240',
        ]);

        $data = [
            'school_id'   => $teacher->school_id,
            'class_id'    => $request->class_id,
            'subject_id'  => $request->subject_id,
            'teacher_id'  => $teacher->id,
            'title'       => $request->title,
            'description' => $request->description,
            'due_date'    => $request->due_date,
            'is_active'   => true,
        ];

        if ($request->hasFile('attachment')) {
            $data['attachment'] = $request->file('attachment')->store('homework', 'public');
        }

        Homework::create($data);

        return redirect()->route('teacher.homework')->with('success', 'Homework created successfully.');
    }

    public function homeworkDestroy($id)
    {
        $teacher = $this->resolveTeacher();
        if (! $teacher) return back()->withErrors(['error' => 'Teacher not linked']);

        Homework::where('school_id', $teacher->school_id)
            ->where('teacher_id', $teacher->id)
            ->where('id', $id)
            ->delete();

        return back()->with('success', 'Homework deleted.');
    }

    /* ─────────────────────────────────────────────
       LESSON PLANS
    ───────────────────────────────────────────── */

    public function lessonPlans()
    {
        $teacher = $this->resolveTeacher();
        if (! $teacher) return $this->notLinked('Teacher/LessonPlans');

        $plans = LessonPlan::where('school_id', $teacher->school_id)
            ->where('teacher_id', $teacher->id)
            ->with(['schoolClass:id,name', 'subject:id,name'])
            ->orderByDesc('week_start')
            ->get()
            ->map(fn ($p) => [
                'id'         => $p->id,
                'title'      => $p->title,
                'objectives' => $p->objectives,
                'content'    => $p->content,
                'class'      => $p->schoolClass?->name,
                'subject'    => $p->subject?->name,
                'week_start' => $p->week_start?->format('d M Y'),
                'status'     => $p->status,
            ]);

        $classes  = DB::table('classes')->whereIn('id', $this->getTeacherClassIds($teacher))->get(['id', 'name']);
        $subjects = Subject::where('school_id', $teacher->school_id)
            ->whereIn('class_id', $this->getTeacherClassIds($teacher))
            ->get(['id', 'name', 'class_id']);

        return Inertia::render('Teacher/LessonPlans', [
            'linked'    => true,
            'teacher'   => ['full_name' => $teacher->full_name],
            'plans'     => $plans,
            'classes'   => $classes,
            'subjects'  => $subjects,
        ]);
    }

    public function lessonPlanStore(Request $request)
    {
        $teacher = $this->resolveTeacher();
        if (! $teacher) return back()->withErrors(['error' => 'Teacher not linked']);

        $request->validate([
            'title'      => 'required|string|max:255',
            'class_id'   => 'required|exists:classes,id',
            'subject_id' => 'required|exists:subjects,id',
            'objectives' => 'nullable|string',
            'content'    => 'nullable|string',
            'week_start' => 'required|date',
        ]);

        LessonPlan::create([
            'school_id'        => $teacher->school_id,
            'class_id'         => $request->class_id,
            'subject_id'       => $request->subject_id,
            'teacher_id'       => $teacher->id,
            'title'            => $request->title,
            'objectives'       => $request->objectives,
            'content'          => $request->content,
            'teaching_methods' => $request->teaching_methods,
            'resources'        => $request->resources,
            'week_start'       => $request->week_start,
            'status'           => 'pending',
        ]);

        return back()->with('success', 'Lesson plan created.');
    }

    /* ─────────────────────────────────────────────
       SYLLABUS
    ───────────────────────────────────────────── */

    public function syllabus()
    {
        $teacher = $this->resolveTeacher();
        if (! $teacher) return $this->notLinked('Teacher/Syllabus');

        $syllabi = Syllabus::where('school_id', $teacher->school_id)
            ->whereIn('class_id', $this->getTeacherClassIds($teacher))
            ->with(['schoolClass:id,name', 'subject:id,name'])
            ->orderByDesc('created_at')
            ->get()
            ->map(fn ($s) => [
                'id'                => $s->id,
                'title'             => $s->title,
                'class'             => $s->schoolClass?->name,
                'subject'           => $s->subject?->name,
                'academic_year'     => $s->academic_year,
                'completion_percent'=> (float) $s->completion_percent,
                'topics'            => $s->topics,
            ]);

        return Inertia::render('Teacher/Syllabus', [
            'linked'  => true,
            'teacher' => ['full_name' => $teacher->full_name],
            'syllabi' => $syllabi,
        ]);
    }

    /* ─────────────────────────────────────────────
       ONLINE CLASSES
    ───────────────────────────────────────────── */

    public function onlineClasses()
    {
        $teacher = $this->resolveTeacher();
        if (! $teacher) return $this->notLinked('Teacher/OnlineClasses');

        $classes = OnlineClass::where('school_id', $teacher->school_id)
            ->where('teacher_id', $teacher->id)
            ->with(['schoolClass:id,name', 'subject:id,name'])
            ->orderByDesc('scheduled_at')
            ->get()
            ->map(fn ($c) => [
                'id'               => $c->id,
                'title'            => $c->title,
                'platform'         => $c->platform,
                'meeting_url'      => $c->meeting_url,
                'scheduled_at'     => $c->scheduled_at?->format('d M Y H:i'),
                'duration_minutes' => $c->duration_minutes,
                'status'           => $c->status,
                'class'            => $c->schoolClass?->name,
                'subject'          => $c->subject?->name,
            ]);

        return Inertia::render('Teacher/OnlineClasses', [
            'linked'   => true,
            'teacher'  => ['full_name' => $teacher->full_name],
            'classes'  => $classes,
        ]);
    }

    /* ─────────────────────────────────────────────
       COMMUNICATION
    ───────────────────────────────────────────── */

    public function announcements()
    {
        $teacher  = $this->resolveTeacher();
        if (! $teacher) return $this->notLinked('Teacher/Announcements');

        $schoolId = $teacher->school_id;
        $classIds = $this->getTeacherClassIds($teacher);

        $announcements = Announcement::where('school_id', $schoolId)
            ->where(fn ($q) => $q->where('audience', 'all')
                ->orWhere('audience', 'teachers')
                ->orWhere(fn ($q2) => $q2->where('audience', 'class')->whereIn('class_id', $classIds))
            )
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

        return Inertia::render('Teacher/Announcements', [
            'linked'        => true,
            'teacher'       => ['full_name' => $teacher->full_name],
            'announcements' => $announcements,
        ]);
    }

    public function messages()
    {
        $user    = auth()->user();
        $teacher = $this->resolveTeacher();
        if (! $teacher) return $this->notLinked('Teacher/Messages');

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

        return Inertia::render('Teacher/Messages', [
            'linked'   => true,
            'teacher'  => ['full_name' => $teacher->full_name],
            'inbox'    => $inbox,
            'sent'     => $sent,
            'users'    => $users,
        ]);
    }

    public function messageSend(Request $request)
    {
        $teacher = $this->resolveTeacher();
        if (! $teacher) return back()->withErrors(['error' => 'Teacher not linked']);

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

    public function notifications()
    {
        $teacher = $this->resolveTeacher();
        if (! $teacher) return $this->notLinked('Teacher/Notifications');

        $user = auth()->user();

        $upcomingHomework = Homework::where('school_id', $user->school_id)
            ->where('teacher_id', $teacher->id)
            ->where('due_date', '>=', Carbon::now())
            ->where('due_date', '<=', Carbon::now()->addDays(7))
            ->count();

        $upcomingExams = Exam::where('school_id', $user->school_id)
            ->whereIn('class_id', $this->getTeacherClassIds($teacher))
            ->where('start_date', '>=', Carbon::now())
            ->where('start_date', '<=', Carbon::now()->addDays(7))
            ->count();

        $unreadMessages = Message::where('school_id', $user->school_id)
            ->where('recipient_id', $user->id)
            ->whereNull('read_at')
            ->count();

        $recentAnnouncements = Announcement::where('school_id', $user->school_id)
            ->where(fn ($q) => $q->where('audience', 'all')->orWhere('audience', 'teachers'))
            ->where('published_at', '>=', Carbon::now()->subDays(7))
            ->count();

        return Inertia::render('Teacher/Notifications', [
            'linked'             => true,
            'teacher'            => ['full_name' => $teacher->full_name],
            'upcomingHomework'   => $upcomingHomework,
            'upcomingExams'      => $upcomingExams,
            'unreadMessages'     => $unreadMessages,
            'recentAnnouncements'=> $recentAnnouncements,
        ]);
    }

    /* ─────────────────────────────────────────────
       REPORTS
    ───────────────────────────────────────────── */

    public function reports()
    {
        $teacher  = $this->resolveTeacher();
        if (! $teacher) return $this->notLinked('Teacher/Reports');

        $schoolId = $teacher->school_id;
        $classIds = $this->getTeacherClassIds($teacher);

        $attendanceSummary = Attendance::where('school_id', $schoolId)
            ->where('attendable_type', Student::class)
            ->whereDate('date', '>=', Carbon::now()->subDays(30))
            ->whereIn('attendable_id', Student::whereIn('class_id', $classIds)->pluck('id'))
            ->select('status', DB::raw('count(*) as total'))
            ->groupBy('status')
            ->pluck('total', 'status')
            ->toArray();

        $examPerformance = Mark::where('school_id', $schoolId)
            ->whereIn('subject_id', Timetable::where('teacher_id', $teacher->id)->where('status', 'published')->pluck('subject_id'))
            ->with('exam:id,name')
            ->get()
            ->groupBy(fn ($m) => $m->exam?->name ?? 'Unknown')
            ->map(function ($marks, $examName) {
                $scores = $marks->where('is_absent', false)->pluck('marks_obtained')->filter();
                return [
                    'exam'     => $examName,
                    'average'  => $scores->count() ? round($scores->avg(), 1) : 0,
                    'highest'  => $scores->max() ?? 0,
                    'lowest'   => $scores->min() ?? 0,
                    'pass_rate'=> $scores->count() ? round($scores->filter(fn ($s) => $s >= 40)->count() / $scores->count() * 100) : 0,
                    'count'    => $marks->count(),
                ];
            })
            ->values();

        $homeworkStats = Homework::where('school_id', $schoolId)
            ->where('teacher_id', $teacher->id)
            ->withCount('submissions')
            ->get()
            ->map(fn ($h) => [
                'title'           => $h->title,
                'submissions'     => $h->submissions_count,
                'students_in_class'=> Student::where('class_id', $h->class_id)->count(),
            ]);

        return Inertia::render('Teacher/Reports', [
            'linked'            => true,
            'teacher'           => ['full_name' => $teacher->full_name],
            'attendanceSummary' => $attendanceSummary,
            'examPerformance'   => $examPerformance,
            'homeworkStats'     => $homeworkStats,
        ]);
    }

    /* ─────────────────────────────────────────────
       DOWNLOADS
    ───────────────────────────────────────────── */

    public function downloads()
    {
        $teacher = $this->resolveTeacher();
        if (! $teacher) return $this->notLinked('Teacher/Downloads');

        $schoolId = $teacher->school_id;
        $user     = auth()->user();

        $documents = \App\Models\StaffDocument::where('school_id', $schoolId)
            ->where('staff_id', $teacher->id)
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

        return Inertia::render('Teacher/Downloads', [
            'linked'    => true,
            'teacher'   => ['full_name' => $teacher->full_name],
            'documents' => $documents,
        ]);
    }

    /* ─────────────────────────────────────────────
       PROFILE
    ───────────────────────────────────────────── */

    public function profile()
    {
        $teacher = $this->resolveTeacher();
        if (! $teacher) return $this->notLinked('Teacher/Profile');

        $teacher->load('documents');

        $assignedSubjects = Timetable::where('school_id', $teacher->school_id)
            ->where('teacher_id', $teacher->id)
            ->where('status', 'published')
            ->with('subject:id,name')
            ->get()
            ->pluck('subject')
            ->unique('id')
            ->values();

        $assignedClasses = Timetable::where('school_id', $teacher->school_id)
            ->where('teacher_id', $teacher->id)
            ->where('status', 'published')
            ->with(['schoolClass:id,name', 'section:id,name'])
            ->get()
            ->map(fn ($t) => ['class' => $t->schoolClass?->name, 'section' => $t->section?->name])
            ->unique(fn ($v) => $v['class'] . $v['section'])
            ->values();

        return Inertia::render('Teacher/Profile', [
            'linked'           => true,
            'teacher'          => [
                'id'             => $teacher->id,
                'full_name'      => $teacher->full_name,
                'emp_id'         => $teacher->emp_id,
                'photo_url'      => $teacher->photo_url,
                'gender'         => $teacher->gender,
                'date_of_birth'  => $teacher->date_of_birth?->format('d M Y'),
                'blood_group'    => $teacher->blood_group,
                'religion'       => $teacher->religion,
                'nationality'    => $teacher->nationality,
                'phone'          => $teacher->phone,
                'email'          => $teacher->email,
                'address'        => $teacher->address,
                'joining_date'   => $teacher->joining_date?->format('d M Y'),
                'status'         => $teacher->status,
                'teacher_type'   => $teacher->teacher_type,
                'department'     => $teacher->department?->name,
                'designation'    => $teacher->designation?->name,
                'is_form_master' => $teacher->isFormMaster(),
                'is_subject_teacher' => $teacher->isSubjectTeacher(),
                'form_master_class'  => $teacher->formMasterClass?->name,
                'form_master_section'=> $teacher->formMasterSection?->name,
            ],
            'assignedSubjects' => $assignedSubjects,
            'assignedClasses'  => $assignedClasses,
        ]);
    }
}
