<?php

namespace App\Http\Controllers\SchoolAdmin;

use App\Http\Controllers\Controller;
use App\Models\{AcademicYear, SchedulePeriod, School, SchoolSetting, SchoolSetupProgress, SchoolTimeSetting};
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class SettingsController extends Controller
{
    public function index()
    {
        $sid    = $this->getSchoolId();
        $school = School::findOrFail($sid);
        $s      = SchoolSetting::allFor($sid);
        $s['primary_color']   = $school->primary_color;
        $s['secondary_color'] = $school->secondary_color;

        $completedSteps = SchoolSetupProgress::getCompletedSteps($sid);
        $isConfigured   = $school->is_configured;

        $currentYear = AcademicYear::where('school_id', $sid)->where('is_current', true)->first();
        $timeSettings = SchoolTimeSetting::where('school_id', $sid)
            ->when($currentYear, fn ($q) => $q->where('academic_year_id', $currentYear->id))
            ->first();
        $periods = SchedulePeriod::where('school_id', $sid)
            ->when($currentYear, fn ($q) => $q->where('academic_year_id', $currentYear->id))
            ->with('eventType')
            ->ordered()
            ->get();

        return Inertia::render('SchoolAdmin/Settings/Index', [
            'school'          => $school->only('id','name','email','phone','address','city','state','country','timezone','currency','language','logo','is_configured'),
            'logoUrl'         => $school->logo_url,
            'settings'        => $s,
            'setupProgress'   => $completedSteps,
            'isConfigured'    => $isConfigured,
            'timeSettings'    => $timeSettings,
            'periods'         => $periods,
            'academicYear'    => $currentYear,
        ]);
    }

    public function saveGeneral(Request $request)
    {
        $sid    = $this->getSchoolId();
        $school = School::findOrFail($sid);

        $data = $request->validate([
            'name'     => 'required|string|max:150',
            'email'    => 'nullable|email|max:150',
            'phone'    => 'nullable|string|max:25',
            'address'  => 'nullable|string|max:500',
            'city'     => 'nullable|string|max:100',
            'state'    => 'nullable|string|max:100',
            'country'  => 'nullable|string|max:100',
            'timezone' => 'nullable|string|max:60',
            'currency' => 'nullable|string|max:10',
            'language' => 'nullable|string|max:10',
        ]);

        try {
            $school->update($data);
            return back()->with('success', 'General settings saved.');
        } catch (\Throwable $e) {
            return back()->withInput()->with('error', 'Failed to save settings: ' . $e->getMessage());
        }
    }

    public function saveBranding(Request $request)
    {
        $sid    = $this->getSchoolId();
        $school = School::findOrFail($sid);

        $request->validate([
            'logo'        => 'nullable|image|max:2048',
            'favicon'     => 'nullable|image|max:512',
            'tagline'     => 'nullable|string|max:200',
            'footer_text' => 'nullable|string|max:500',
            'primary_color' => 'nullable|string|max:20',
            'secondary_color' => 'nullable|string|max:20',
        ]);

        try {
            if ($request->hasFile('logo')) {
                if ($school->logo) {
                    Storage::disk('public')->delete($school->logo);
                }
                $path = $request->file('logo')->store("schools/{$sid}", 'public');
                $school->update(['logo' => $path]);
            }

            if ($request->has('primary_color')) {
                $school->update(['primary_color' => $request->input('primary_color')]);
            }

            if ($request->has('secondary_color')) {
                $school->update(['secondary_color' => $request->input('secondary_color')]);
            }

            if ($request->hasFile('favicon')) {
                $old = SchoolSetting::get($sid, 'favicon');
                if ($old) Storage::disk('public')->delete($old);
                $path = $request->file('favicon')->store("schools/{$sid}", 'public');
                SchoolSetting::set($sid, 'favicon', $path, 'branding');
            }

            foreach (['tagline', 'footer_text'] as $key) {
                if ($request->has($key)) {
                    SchoolSetting::set($sid, $key, $request->input($key), 'branding');
                }
            }

            return back()->with('success', 'Branding saved.');
        } catch (\Throwable $e) {
            return back()->withInput()->with('error', 'Failed to save branding: ' . $e->getMessage());
        }
    }

    public function saveAcademic(Request $request)
    {
        $sid = $this->getSchoolId();

        $request->validate([
            'academic_year'  => 'nullable|string|max:20',
            'year_start'     => 'nullable|string|max:10',
            'terms_per_year' => 'nullable|integer|min:1|max:4',
            'grading_scale'  => 'nullable|string|in:percentage,letter,gpa',
            'pass_mark'      => 'nullable|integer|min:0|max:100',
            'result_show_position'           => 'nullable|string|in:overall,class,subject,none',
            'result_position_type'           => 'nullable|string|in:rank,position,dense',
            'result_show_teacher_comment'     => 'nullable|boolean',
            'result_show_principal_comment'   => 'nullable|boolean',
            'result_show_form_master_comment' => 'nullable|boolean',
            'result_show_conduct'            => 'nullable|boolean',
            'result_show_behaviour'          => 'nullable|boolean',
        ]);

        try {
            foreach (['academic_year','year_start','terms_per_year','grading_scale','pass_mark'] as $key) {
                SchoolSetting::set($sid, $key, $request->input($key), 'academic');
            }

            $resultSettings = [
                'result_show_position', 'result_position_type',
                'result_show_teacher_comment', 'result_show_principal_comment',
                'result_show_form_master_comment', 'result_show_conduct', 'result_show_behaviour',
            ];
            foreach ($resultSettings as $key) {
                if ($request->has($key)) {
                    $value = $request->input($key);
                    SchoolSetting::set($sid, $key, is_bool($value) ? ($value ? '1' : '0') : $value, 'results');
                }
            }

            return back()->with('success', 'Academic settings saved.');
        } catch (\Throwable $e) {
            return back()->withInput()->with('error', 'Failed to save academic settings: ' . $e->getMessage());
        }
    }

    public function saveNotifications(Request $request)
    {
        $sid = $this->getSchoolId();

        $toggles = [
            'notify_attendance_email','notify_attendance_sms',
            'notify_fee_due_email',   'notify_fee_due_sms',
            'notify_exam_email',      'notify_exam_sms',
            'notify_homework_email',  'notify_homework_sms',
            'notify_announcement_email','notify_announcement_sms',
        ];

        try {
            foreach ($toggles as $key) {
                SchoolSetting::set($sid, $key, $request->boolean($key) ? '1' : '0', 'notifications');
            }

            return back()->with('success', 'Notification preferences saved.');
        } catch (\Throwable $e) {
            return back()->withInput()->with('error', 'Failed to save notification preferences: ' . $e->getMessage());
        }
    }
}
