<?php

namespace App\Http\Controllers;

use App\Models\School;
use App\Models\SchoolSetting;
use Inertia\Inertia;

class HomeController extends Controller
{
    public function __invoke()
    {
        $school = $this->resolveInstallationSchool();

        if ($school?->public_profile_enabled) {
            return Inertia::render('Public/SchoolHomepage', [
                'school' => $this->schoolPublicProfile($school),
            ]);
        }

        return Inertia::render('Public/Homepage');
    }

    /**
     * Resolve the single school this installation belongs to. A configured
     * installation school id wins; otherwise a single active school is used.
     * Ambiguous setups fall back to the platform marketing homepage.
     */
    private function resolveInstallationSchool(): ?School
    {
        $configuredId = config('app.installation_school_id');

        if ($configuredId) {
            return School::where('id', $configuredId)->where('status', 'active')->first();
        }

        $active = School::where('status', 'active')->get();

        return $active->count() === 1 ? $active->first() : null;
    }

    private function schoolPublicProfile(School $school): array
    {
        return array_merge($school->branding, [
            'id'          => $school->id,
            'slug'        => $school->slug,
            'email'       => $school->email,
            'phone'       => $school->phone,
            'address'     => $school->address,
            'city'        => $school->city,
            'state'       => $school->state,
            'country'     => $school->country,
            'footer_text' => SchoolSetting::get($school->id, 'footer_text')
                ?? ('© ' . date('Y') . ' ' . ($school->name) . '.'),
        ]);
    }
}