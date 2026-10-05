<?php

namespace App\Http\Controllers;

use App\Models\School;
use App\Services\RoleRegistry;

abstract class Controller
{
    /**
     * Resolve the school_id for the current request.
     *
     * Resolution order:
     *  1. The authenticated user's own school_id (school-scoped users).
     *  2. The configured installation school (single-school installs).
     *  3. The sole school in the database.
     *  4. For platform roles only, the lowest-id school.
     *
     * Step 4 exists because platform roles (super-admin, ministry-admin,
     * district-officer) carry no school_id and are already exempt from the
     * SchoolScope global scope, so they can read every school's data anyway.
     * Falling back to the first school lets them preview the interface instead
     * of hitting a 404. It cannot widen access for a school-scoped user,
     * because those always resolve at step 1.
     *
     * Fails closed (404) when no context can be resolved at all.
     */
    protected function getSchoolId(): int
    {
        $user = auth()->user();

        $userSchoolId = $user?->school_id;

        if ($userSchoolId) {
            return (int) $userSchoolId;
        }

        $configured = config('app.installation_school_id');

        if ($configured) {
            return (int) $configured;
        }

        $schoolIds = School::orderBy('id')->pluck('id');

        if ($schoolIds->count() === 1) {
            return (int) $schoolIds->first();
        }

        if ($user && $user->hasAnyRole(RoleRegistry::PORTAL_ROLES)) {
            $first = $schoolIds->first();

            if ($first) {
                return (int) $first;
            }
        }

        abort(404, 'No school context is available for this account.');
    }
}