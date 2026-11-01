<?php

namespace App\Http\Controllers\SchoolAdmin;

use App\Support\SierraLeoneEducation;
use App\Http\Controllers\Controller;
use App\Models\Department;
use App\Models\School;
use App\Models\SchoolSetting;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SierraLeoneSettingsController extends Controller
{
    public function index(): Response
    {
        $sid = $this->getSchoolId();
        $s   = SchoolSetting::allFor($sid);

        return Inertia::render('SchoolAdmin/Settings/SierraLeone', [
            'school'    => School::findOrFail($sid)->only('id', 'name', 'country', 'currency', 'currency_symbol'),
            'settings'  => $s,
            'levels'    => array_keys(SierraLeoneEducation::SCHOOL_LEVELS),
            'departments' => Department::where('school_id', $sid)->academic()->get(),
            'examTypes' => SierraLeoneEducation::NATIONAL_EXAMINATIONS,
        ]);
    }

    public function saveEducationSystem(Request $request): RedirectResponse
    {
        $sid = $this->getSchoolId();

        $data = $request->validate([
            'country_code'     => 'required|string|max:5',
            'education_system' => 'required|string|max:50',
            'terms_per_year'   => 'required|integer|min:1|max:4',
            'ca_weight'        => 'required|numeric|min:0|max:100',
            'exam_weight'      => 'required|numeric|min:0|max:100',
            'grading_system'   => 'required|string|in:wassce,npse,percentage',
            'pass_mark'        => 'required|integer|min:0|max:100',
            'enable_ece'       => 'boolean',
            'enable_primary'   => 'boolean',
            'enable_jss'       => 'boolean',
            'enable_sss'       => 'boolean',
            'national_exam_npse'   => 'boolean',
            'national_exam_bece'   => 'boolean',
            'national_exam_wassce' => 'boolean',
            'section_format'   => 'required|string|in:letter,number,custom',
        ]);

        foreach ($data as $key => $value) {
            SchoolSetting::set($sid, $key, is_bool($value) ? ($value ? '1' : '0') : $value, 'sierra_leone');
        }

        return back()->with('success', 'Education system settings saved.');
    }

    public function saveSchoolLevels(Request $request): RedirectResponse
    {
        $sid = $this->getSchoolId();

        $data = $request->validate([
            'enabled_levels'   => 'required|array',
            'enabled_levels.*' => 'string|in:early_childhood,primary,junior_secondary,senior_secondary',
        ]);

        $allLevels = ['early_childhood', 'primary', 'junior_secondary', 'senior_secondary'];
        foreach ($allLevels as $level) {
            $enabled = in_array($level, $data['enabled_levels']);
            SchoolSetting::set($sid, "enable_{$level}", $enabled ? '1' : '0', 'sierra_leone');
        }

        return back()->with('success', 'School levels updated.');
    }
}
