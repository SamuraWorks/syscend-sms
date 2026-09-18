<?php

namespace App\Http\Controllers;

use App\Models\School;

abstract class Controller
{
    /**
     * Resolve the school_id for the current request.
     *
     * Resolution order:
     *  1. The authenticated user's own school_id (school-scoped users).
     *  2. The configured installation school (single-school installs).
     *  3. The sole school in the database.
     *
     * Fails closed (404) when no context can be resolved, instead of
     * silently picking an arbitrary school.
     */
    protected function getSchoolId(): int
    {
        $userSchoolId = auth()->user()?->school_id;

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

        abort(404, 'No school context is available for this account.');
    }
}