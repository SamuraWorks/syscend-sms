<?php

namespace App\Http\Controllers\SchoolAdmin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\ReportCardTemplate;
use App\Models\School;
use App\Models\SchoolSetting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class SchoolIdentityController extends Controller
{
    public function index()
    {
        $sid    = $this->getSchoolId();
        $school = School::findOrFail($sid);

        $templates = ReportCardTemplate::where('school_id', $sid)
            ->with('creator:id,name')
            ->latest()
            ->get();

        return Inertia::render('SchoolAdmin/SchoolIdentity/Index', [
            'school'     => $this->schoolPayload($school),
            'settings'   => SchoolSetting::allFor($sid),
            'templates'  => $templates,
        ]);
    }

    /**
     * Save school identity fields not covered by the Settings page (motto, type, level, ownership).
     * Name, email, phone, address, colors are managed by SettingsController.
     */
    public function saveBasic(Request $request)
    {
        $sid    = $this->getSchoolId();
        $school = School::findOrFail($sid);

        $data = $request->validate([
            'short_name'      => 'nullable|string|max:50',
            'motto'           => 'nullable|string|max:200',
            'secondary_color' => 'nullable|string|max:20',
            'year_established'=> 'nullable|digits:4|integer|min:1800|max:' . date('Y'),
            'school_level'    => 'nullable|in:nursery,primary,junior_secondary,senior_secondary,combined',
            'school_type'     => 'nullable|in:government,government_assisted,private,community,faith_based',
            'ownership'       => 'nullable|string|max:150',
        ]);

        $school->update($data);

        $this->auditLog($school, 'identity_basic', [], $data);

        return back()->with('success', 'Basic identity updated.');
    }

    /**
     * Save registration & official information.
     */
    public function saveRegistration(Request $request)
    {
        $sid    = $this->getSchoolId();
        $school = School::findOrFail($sid);

        $data = $request->validate([
            'mbsse_registration_number'  => 'nullable|string|max:50',
            'emis_code'                   => 'nullable|string|max:50',
            'waec_centre_number'          => 'nullable|string|max:50',
            'npse_centre_number'          => 'nullable|string|max:50',
            'bece_centre_number'          => 'nullable|string|max:50',
            'wassce_centre_number'        => 'nullable|string|max:50',
            'business_registration_number'=> 'nullable|string|max:50',
            'tax_identification_number'   => 'nullable|string|max:50',
        ]);

        $old = $school->only(array_keys($data));
        $school->update($data);

        $this->auditLog($school, 'identity_registration', $old, $data);

        return back()->with('success', 'Registration details updated.');
    }

    /**
     * Save location-specific contact fields not on the Settings page.
     * Core contact (email, phone, address) is managed by SettingsController.
     */
    public function saveContact(Request $request)
    {
        $sid    = $this->getSchoolId();
        $school = School::findOrFail($sid);

        $data = $request->validate([
            'whatsapp_number'=> 'nullable|string|max:25',
            'district_name'  => 'nullable|string|max:100',
            'chiefdom'       => 'nullable|string|max:100',
            'province'       => 'nullable|string|max:100',
            'postal_address' => 'nullable|string|max:300',
            'website'        => 'nullable|url|max:200',
            'gps_latitude'   => 'nullable|numeric|between:-90,90',
            'gps_longitude'  => 'nullable|numeric|between:-180,180',
        ]);

        $old = $school->only(array_keys($data));
        $school->update($data);

        $this->auditLog($school, 'identity_contact', $old, $data);

        return back()->with('success', 'Contact information updated.');
    }

    /**
     * Save leadership information.
     */
    public function saveLeadership(Request $request)
    {
        $sid    = $this->getSchoolId();
        $school = School::findOrFail($sid);

        $data = $request->validate([
            'proprietor_name'    => 'nullable|string|max:150',
            'proprietor_photo'   => 'nullable|image|max:2048',
            'principal_name'     => 'nullable|string|max:150',
            'principal_photo'    => 'nullable|image|max:2048',
            'vice_principal_name'=> 'nullable|string|max:150',
            'bursar_name'        => 'nullable|string|max:150',
            'registrar_name'     => 'nullable|string|max:150',
        ]);

        // Handle photo uploads
        foreach (['proprietor_photo', 'principal_photo'] as $field) {
            if ($request->hasFile($field)) {
                $oldPath = $school->{$field};
                if ($oldPath) Storage::disk('public')->delete($oldPath);
                $data[$field] = $request->file($field)->store("schools/{$sid}/leadership", 'public');
            }
        }

        $textData = collect($data)->except(['proprietor_photo', 'principal_photo'])->toArray();
        $old = $school->only(array_keys($textData));
        $school->update($data);

        $this->auditLog($school, 'identity_leadership', $old, $textData);

        return back()->with('success', 'Leadership information updated.');
    }

    /**
     * Save school time fields not managed by SchoolTimeSettingsController.
     * CA/exam weights are managed via SierraLeone settings.
     */
    public function saveAcademic(Request $request)
    {
        $sid    = $this->getSchoolId();
        $school = School::findOrFail($sid);

        $data = $request->validate([
            'working_days'          => 'nullable|string|max:100',
            'school_opening_time'   => 'nullable|string|max:10',
            'school_closing_time'   => 'nullable|string|max:10',
        ]);

        $old = $school->only(array_keys($data));
        $school->update($data);

        $this->auditLog($school, 'identity_academic', $old, $data);

        return back()->with('success', 'Academic configuration updated.');
    }

    /**
     * Save identity-specific branding assets (badge, banner, signature, stamp).
     * Logo/favicon are managed by SettingsController.
     */
    public function saveBranding(Request $request)
    {
        $sid    = $this->getSchoolId();
        $school = School::findOrFail($sid);

        $request->validate([
            'badge'              => 'nullable|image|max:2048',
            'banner'             => 'nullable|image|max:4096',
            'official_signature' => 'nullable|image|max:1024',
            'official_stamp'     => 'nullable|image|max:1024',
        ]);

        $changed = [];

        foreach (['badge', 'banner', 'official_signature', 'official_stamp'] as $field) {
            if ($request->hasFile($field)) {
                $oldPath = $school->{$field};
                if ($oldPath) Storage::disk('public')->delete($oldPath);
                $path = $request->file($field)->store("schools/{$sid}/branding", 'public');
                $school->update([$field => $path]);
                $changed[$field] = $path;
            }
        }

        if (!empty($changed)) {
            $this->auditLog($school, 'identity_branding', [], $changed);
        }

        return back()->with('success', 'Branding assets updated.');
    }

    /**
     * Save public profile settings.
     */
    public function savePublicProfile(Request $request)
    {
        $sid    = $this->getSchoolId();
        $school = School::findOrFail($sid);

        $data = $request->validate([
            'public_profile_enabled' => 'boolean',
            'about_school'           => 'nullable|string|max:2000',
            'school_mission'         => 'nullable|string|max:1000',
            'school_vision'          => 'nullable|string|max:1000',
        ]);

        $data['public_profile_enabled'] = $request->boolean('public_profile_enabled');

        $old = $school->only(array_keys($data));
        $school->update($data);

        $this->auditLog($school, 'identity_public_profile', $old, $data);

        return back()->with('success', 'Public profile updated.');
    }

    /**
     * Remove a branding asset (logo, badge, banner, etc.).
     */
    public function removeAsset(Request $request)
    {
        $sid    = $this->getSchoolId();
        $school = School::findOrFail($sid);

        $field = $request->validate(['field' => 'required|in:logo,badge,banner,official_signature,official_stamp,proprietor_photo,principal_photo']);

        $fieldName = $field['field'];
        $oldPath = $school->{$fieldName};
        if ($oldPath) {
            Storage::disk('public')->delete($oldPath);
            $school->update([$fieldName => null]);
            $this->auditLog($school, 'identity_asset_removed', [$fieldName => $oldPath], [$fieldName => null]);
        }

        return back()->with('success', 'Asset removed.');
    }

    /**
     * Get branding data as JSON (for AJAX polling / cross-component sync).
     */
    public function branding()
    {
        $school = School::findOrFail($this->getSchoolId());
        return response()->json($school->branding);
    }

    // ── Helpers ────────────────────────────────────────────

    private function schoolPayload(School $school): array
    {
        return array_merge(
            $school->toArray(),
            [
                'logo_url'       => $school->logo_url,
                'badge_url'      => $school->badge_url,
                'banner_url'     => $school->banner_url,
                'signature_url'  => $school->signature_url,
                'stamp_url'      => $school->stamp_url,
                'branding'       => $school->branding,
            ]
        );
    }

    private function auditLog(School $school, string $section, array $old, array $new): void
    {
        AuditLog::create([
            'school_id'       => $school->id,
            'user_id'         => auth()->id(),
            'event'           => $section,
            'auditable_type'  => School::class,
            'auditable_id'    => $school->id,
            'old_values'      => $old,
            'new_values'      => $new,
            'ip_address'      => request()->ip(),
        ]);
    }
}
