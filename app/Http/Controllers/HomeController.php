<?php

namespace App\Http\Controllers;

use App\Models\School;
use App\Services\SchoolPublicProfileService;
use Inertia\Inertia;

class HomeController extends Controller
{
    public function __invoke()
    {
        $school = $this->resolveInstallationSchool();

        if ($school?->public_profile_enabled) {
            return Inertia::render('Public/SchoolHomepage', [
                'school' => SchoolPublicProfileService::for($school),
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
}