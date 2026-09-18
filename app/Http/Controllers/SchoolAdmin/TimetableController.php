<?php

namespace App\Http\Controllers\SchoolAdmin;

use App\Http\Controllers\Controller;
use App\Models\{AcademicYear, SchedulePeriod, School, SchoolClass, Section, Staff, Subject, Timetable};
use Illuminate\Http\{JsonResponse, RedirectResponse, Request};
use Inertia\Inertia;
use Inertia\Response;

class TimetableController extends Controller
{
    public function index(Request $request): Response
    {
        $schoolId = $this->getSchoolId();
        $classId   = $request->class_id;
        $sectionId = $request->section_id;

        // Get configured periods from DB. Periods stamped with the current
        // academic year OR left un-stamped (NULL = all years) both apply.
        $currentYear = AcademicYear::where('school_id', $schoolId)->where('is_current', true)->first();
        $periods = SchedulePeriod::where('school_id', $schoolId)
            ->when($currentYear, fn ($q) => $q->where(
                fn ($w) => $w->where('academic_year_id', $currentYear->id)->orWhereNull('academic_year_id')
            ))
            ->active()
            ->ordered()
            ->get();

        // If no periods configured, do NOT generate defaults here. The school must
        // explicitly configure its schedule via School Time Settings. Showing
        // generated defaults risks displaying fake timetable data.

        $timetableEntries = collect();
        if ($classId) {
            $timetableEntries = Timetable::with(['subject:id,name,code', 'teacher:id,first_name,last_name'])
                ->where('class_id', $classId)
                ->when($sectionId, fn ($q) => $q->where('section_id', $sectionId))
                ->get();
        }

        // Index by day+start_time for easy grid lookup
        $grid = [];
        foreach ($timetableEntries as $p) {
            $grid[$p->day_of_week][$p->start_time] = $p;
        }

        // Compute overall status
        $statusCounts = $timetableEntries->groupBy('status')->map(fn ($g) => $g->count())->toArray();
        $overallStatus = empty($timetableEntries) ? 'empty' : (
            ($statusCounts['published'] ?? 0) === $timetableEntries->count() ? 'published' : (
                ($statusCounts['draft'] ?? 0) === $timetableEntries->count() ? 'draft' : 'mixed'
            )
        );

        $school = School::find($schoolId);
        $days = !empty($school->working_days)
            ? array_map('trim', explode(',', $school->working_days))
            : ['monday','tuesday','wednesday','thursday','friday'];

        return Inertia::render('SchoolAdmin/Timetable/Index', [
            'classes'      => SchoolClass::where('school_id', $schoolId)->orderBy('numeric_name')->get(['id', 'name']),
            'sections'     => Section::where('school_id', $schoolId)->orderBy('name')->get(['id', 'class_id', 'name']),
            'subjects'     => $classId ? Subject::where('class_id', $classId)->orderBy('name')->get(['id', 'name', 'code']) : collect(),
            'teachers'     => Staff::where('school_id', $schoolId)->where('status', 'active')->orderBy('first_name')->get(['id', 'first_name', 'last_name']),
            'periods'      => $timetableEntries,
            'schedulePeriods' => $periods,
            'grid'         => $grid,
            'days'         => $days,
            'filters'      => ['class_id' => $classId, 'section_id' => $sectionId],
            'hasConfiguredPeriods' => $periods->isNotEmpty() && $periods->first()->id > 0,
            'overallStatus' => $overallStatus,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'class_id'    => 'required|exists:classes,id',
            'section_id'  => 'nullable|exists:sections,id',
            'subject_id'  => 'required|exists:subjects,id',
            'teacher_id'  => 'nullable|exists:staff,id',
            'day_of_week' => 'required|in:monday,tuesday,wednesday,thursday,friday,saturday,sunday',
            'start_time'  => 'required|date_format:H:i',
            'end_time'    => 'required|date_format:H:i|after:start_time',
            'room'        => 'nullable|string|max:50',
            'notes'       => 'nullable|string|max:200',
        ]);

        // Teacher conflict check — detect any overlapping period for same teacher on same day
        if (!empty($data['teacher_id'])) {
            $conflict = Timetable::where('school_id', $this->getSchoolId())
                ->where('teacher_id', $data['teacher_id'])
                ->where('day_of_week', $data['day_of_week'])
                ->where('start_time', '<', $data['end_time'])
                ->where('end_time', '>', $data['start_time'])
                ->exists();

            if ($conflict) {
                return back()->withErrors(['teacher_id' => 'This teacher already has a class during this time slot.']);
            }
        }

        // Warn if teacher is not assigned to this subject (soft validation)
        if (!empty($data['teacher_id']) && !empty($data['subject_id'])) {
            $subject = Subject::find($data['subject_id']);
            if ($subject) {
                $offering = \App\Models\SubjectOffering::where('school_id', $this->getSchoolId())
                    ->where('subject_id', $data['subject_id'])
                    ->where('class_id', $data['class_id'])
                    ->first();

                if ($offering) {
                    $isAssigned = \App\Models\TeacherSubjectAssignment::where('school_id', $this->getSchoolId())
                        ->where('staff_id', $data['teacher_id'])
                        ->where('subject_offering_id', $offering->id)
                        ->where('is_active', true)
                        ->exists();

                    if (!$isAssigned) {
                        return back()->withErrors(['teacher_id' => 'This teacher is not assigned to this subject. Assign them in Teacher Assignments first.']);
                    }
                }
            }
        }

        Timetable::updateOrCreate(
            [
                'school_id'   => $this->getSchoolId(),
                'class_id'    => $data['class_id'],
                'section_id'  => $data['section_id'] ?? null,
                'day_of_week' => $data['day_of_week'],
                'start_time'  => $data['start_time'],
            ],
            array_merge($data, ['school_id' => $this->getSchoolId()])
        );

        return back()->with('success', 'Period saved.');
    }

    public function destroy(Timetable $timetable): RedirectResponse
    {
        $timetable->delete();
        return back()->with('success', 'Period removed.');
    }

    public function publish(Request $request): RedirectResponse
    {
        $schoolId = $this->getSchoolId();
        $classId = $request->input('class_id');

        $query = Timetable::where('school_id', $schoolId);
        if ($classId) $query->where('class_id', $classId);

        $query->update(['status' => 'published']);

        return back()->with('success', 'Timetable published. Students and teachers can now see it.');
    }

    public function unpublish(Request $request): RedirectResponse
    {
        $schoolId = $this->getSchoolId();
        $classId = $request->input('class_id');

        $query = Timetable::where('school_id', $schoolId);
        if ($classId) $query->where('class_id', $classId);

        $query->update(['status' => 'draft']);

        return back()->with('success', 'Timetable unpublished. It is now hidden from students and teachers.');
    }

    /**
     * Teacher's personal weekly schedule.
     */
    public function teacherSchedule(Request $request): Response
    {
        $schoolId = $this->getSchoolId();
        $teacherId = $request->teacher_id;

        $currentYear = AcademicYear::where('school_id', $schoolId)->where('is_current', true)->first();
        $schedulePeriods = SchedulePeriod::where('school_id', $schoolId)
            ->when($currentYear, fn ($q) => $q->where(
                fn ($w) => $w->where('academic_year_id', $currentYear->id)->orWhereNull('academic_year_id')
            ))
            ->active()
            ->ordered()
            ->get();

        $periods = collect();
        if ($teacherId) {
            $periods = Timetable::with(['schoolClass:id,name', 'section:id,name', 'subject:id,name'])
                ->where('school_id', $schoolId)
                ->where('teacher_id', $teacherId)
                ->where('status', 'published')
                ->get();
        }

        $grid = [];
        foreach ($periods as $p) {
            $grid[$p->day_of_week][$p->start_time] = $p;
        }

        $defaultSlots = $schedulePeriods->map(fn ($p) => [
            'start' => substr($p->start_time, 0, 5),
            'end'   => substr($p->end_time, 0, 5),
        ])->values()->toArray();

        // If no schedule periods are configured, do not fabricate default slots.
        // The frontend should indicate that the school has not configured periods.
        if (empty($defaultSlots)) {
            $defaultSlots = [];
        }

        return Inertia::render('SchoolAdmin/Timetable/TeacherSchedule', [
            'teachers'      => Staff::where('school_id', $schoolId)->where('status', 'active')->orderBy('first_name')->get(['id', 'first_name', 'last_name', 'emp_id']),
            'periods'       => $periods,
            'defaultSlots'  => $defaultSlots,
            'grid'          => $grid,
            'days'          => ['monday','tuesday','wednesday','thursday','friday','saturday'],
            'filters'       => ['teacher_id' => $teacherId],
        ]);
    }
}
