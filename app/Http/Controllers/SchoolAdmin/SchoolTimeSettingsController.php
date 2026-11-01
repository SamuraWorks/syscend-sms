<?php

namespace App\Http\Controllers\SchoolAdmin;

use App\Http\Controllers\Controller;
use App\Models\{AcademicYear, ScheduleEventType, SchedulePeriod, SchoolTimeSetting};
use Illuminate\Http\{RedirectResponse, Request};
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class SchoolTimeSettingsController extends Controller
{
    /**
     * School Time Settings overview page.
     */
    public function index(): Response
    {
        $schoolId = $this->getSchoolId();

        $currentYear = AcademicYear::where('school_id', $schoolId)->where('is_current', true)->first();

        // Rows stamped with the current year OR left un-stamped (NULL = all years)
        // both count as the school's active configuration.
        $yearScope = fn ($q) => $currentYear
            ? $q->where(fn ($w) => $w->where('academic_year_id', $currentYear->id)->orWhereNull('academic_year_id'))
            : $q;

        $settings = SchoolTimeSetting::where('school_id', $schoolId)
            ->where($yearScope)
            ->orderByRaw('academic_year_id IS NULL')
            ->first();

        $eventTypes = ScheduleEventType::where('school_id', $schoolId)
            ->ordered()
            ->get();

        $periods = SchedulePeriod::where('school_id', $schoolId)
            ->where($yearScope)
            ->with('eventType')
            ->ordered()
            ->get();

        return Inertia::render('SchoolAdmin/Settings/SchoolTime', [
            'settings'   => $settings,
            'eventTypes' => $eventTypes,
            'periods'    => $periods,
            'academicYear' => $currentYear,
            'allYears'   => AcademicYear::where('school_id', $schoolId)->orderByDesc('is_current')->get(['id', 'name', 'is_current']),
        ]);
    }

    /**
     * Save/update school time settings.
     */
    public function saveSettings(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'academic_year_id' => 'nullable|exists:academic_years,id',
            'opening_time'     => 'required|date_format:H:i',
            'closing_time'     => 'required|date_format:H:i|after:opening_time',
            'working_days'     => 'required|string|max:200',
            'timezone'         => 'nullable|string|max:50',
            'clock_format'     => 'required|in:12h,24h',
            'day_start'        => 'required|date_format:H:i',
            'day_end'          => 'required|date_format:H:i',
        ]);

        try {
            // Default the settings row to the current academic year so the
            // year-scoped reader in index() finds it.
            if (empty($data['academic_year_id'])) {
                $currentYear = AcademicYear::where('school_id', $this->getSchoolId())->where('is_current', true)->first();
                $data['academic_year_id'] = $currentYear?->id;
            }

            SchoolTimeSetting::updateOrCreate(
                [
                    'school_id'        => $this->getSchoolId(),
                    'academic_year_id' => $data['academic_year_id'] ?? null,
                ],
                array_merge($data, ['school_id' => $this->getSchoolId()])
            );

            return redirect()->route('school.settings.school-time')->with('success', 'School time settings saved.');
        } catch (\Throwable $e) {
            return back()->withInput()->with('error', 'Failed to save: ' . $e->getMessage());
        }
    }

    /**
     * CRUD for schedule event types.
     */
    public function storeEventType(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'name'               => 'required|string|max:100',
            'color'              => 'nullable|string|max:20',
            'icon'               => 'nullable|string|max:50',
            'is_instructional'   => 'boolean',
            'attendance_required'=> 'boolean',
        ]);

        try {
            $slug = \Str::slug($data['name']);
            $maxOrder = ScheduleEventType::where('school_id', $this->getSchoolId())->max('sort_order') ?? 0;

            ScheduleEventType::create(array_merge($data, [
                'school_id'  => $this->getSchoolId(),
                'slug'       => $slug,
                'sort_order' => $maxOrder + 1,
                'is_active'  => true,
            ]));

            return redirect()->route('school.settings.school-time')->with('success', 'Event type created.');
        } catch (\Throwable $e) {
            return back()->withInput()->with('error', 'Failed: ' . $e->getMessage());
        }
    }

    public function updateEventType(Request $request, ScheduleEventType $eventType): RedirectResponse
    {
        $data = $request->validate([
            'name'               => 'required|string|max:100',
            'color'              => 'nullable|string|max:20',
            'is_instructional'   => 'boolean',
            'attendance_required'=> 'boolean',
            'is_active'          => 'boolean',
        ]);

        $eventType->update($data);
        return redirect()->route('school.settings.school-time')->with('success', 'Event type updated.');
    }

    public function destroyEventType(ScheduleEventType $eventType): RedirectResponse
    {
        $eventType->delete();
        return redirect()->route('school.settings.school-time')->with('success', 'Event type deleted.');
    }

    /**
     * CRUD for schedule periods.
     */
    public function storePeriod(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'name'            => 'required|string|max:100',
            'event_type_id'   => 'nullable|exists:schedule_event_types,id',
            'period_number'   => 'nullable|integer|min:0',
            'start_time'      => 'required|date_format:H:i',
            'end_time'        => 'required|date_format:H:i|after:start_time',
            'is_break'        => 'boolean',
        ]);

        try {
            // Check for overlap
            $overlap = SchedulePeriod::where('school_id', $this->getSchoolId())
                ->where('start_time', '<', $data['end_time'])
                ->where('end_time', '>', $data['start_time'])
                ->exists();

            if ($overlap) {
                return back()->withErrors(['start_time' => 'This period overlaps with an existing period.']);
            }

            // Stamp the period with the current academic year so year-scoped
            // readers (timetable builder, this settings page) find it.
            $currentYear = AcademicYear::where('school_id', $this->getSchoolId())->where('is_current', true)->first();

            $maxOrder = SchedulePeriod::where('school_id', $this->getSchoolId())->max('sort_order') ?? 0;

            $period = SchedulePeriod::create(array_merge($data, [
                'school_id'        => $this->getSchoolId(),
                'academic_year_id' => $currentYear?->id,
                'sort_order'       => $maxOrder + 1,
                'is_active'        => true,
            ]));

            return redirect()->route('school.settings.school-time')->with('success', "Period created ({$period->duration} minutes).");
        } catch (\Throwable $e) {
            return back()->withInput()->with('error', 'Failed: ' . $e->getMessage());
        }
    }

    public function updatePeriod(Request $request, SchedulePeriod $period): RedirectResponse
    {
        $data = $request->validate([
            'name'            => 'required|string|max:100',
            'event_type_id'   => 'nullable|exists:schedule_event_types,id',
            'period_number'   => 'nullable|integer|min:0',
            'start_time'      => 'required|date_format:H:i',
            'end_time'        => 'required|date_format:H:i|after:start_time',
            'is_break'        => 'boolean',
            'is_active'       => 'boolean',
        ]);

        $period->update($data);
        return redirect()->route('school.settings.school-time')->with('success', 'Period updated.');
    }

    public function destroyPeriod(SchedulePeriod $period): RedirectResponse
    {
        $period->delete();
        return redirect()->route('school.settings.school-time')->with('success', 'Period deleted.');
    }

    /**
     * Reorder periods (drag-and-drop).
     */
    public function reorderPeriods(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'period_ids'   => 'required|array',
            'period_ids.*' => 'integer|exists:schedule_periods,id',
        ]);

        foreach ($data['period_ids'] as $index => $periodId) {
            SchedulePeriod::where('id', $periodId)
                ->where('school_id', $this->getSchoolId())
                ->update(['sort_order' => $index + 1]);
        }

        return redirect()->route('school.settings.school-time')->with('success', 'Periods reordered.');
    }

    /**
     * Copy schedule to another academic year/term.
     */
    public function copySchedule(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'target_academic_year_id' => 'required|exists:academic_years,id',
        ]);

        $schoolId = $this->getSchoolId();
        $currentYear = AcademicYear::where('school_id', $schoolId)->where('is_current', true)->first();

        if (!$currentYear) {
            return back()->with('error', 'No current academic year found.');
        }

        try {
            DB::transaction(function () use ($schoolId, $currentYear, $data) {
                // Copy periods
                $periods = SchedulePeriod::where('school_id', $schoolId)
                    ->where('academic_year_id', $currentYear->id)
                    ->get();

                foreach ($periods as $period) {
                    $clone = $period->replicate();
                    $clone->academic_year_id = $data['target_academic_year_id'];
                    $clone->push();
                }
            });

            return redirect()->route('school.settings.school-time')->with('success', 'Schedule copied to new academic year.');
        } catch (\Throwable $e) {
            return back()->with('error', 'Failed to copy: ' . $e->getMessage());
        }
    }
}
