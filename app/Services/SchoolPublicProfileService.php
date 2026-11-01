<?php

namespace App\Services;

use App\Models\School;
use App\Models\SchoolSetting;

/**
 * Builds the public-facing school profile payload rendered on the school
 * homepage. Shared by the installation homepage (HomeController) and the
 * per-school /{schoolSlug} public website.
 */
class SchoolPublicProfileService
{
    public static function for(School $school): array
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