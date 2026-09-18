<?php

namespace App\Http\Controllers\Registration;

use App\Http\Controllers\Controller;
use App\Models\School;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class RegistrationLandingController extends Controller
{
    public function __invoke(Request $request, string $schoolSlug): Response
    {
        $school = School::where('slug', $schoolSlug)
            ->where('status', 'active')
            ->firstOrFail();

        return Inertia::render('Registration/Landing', [
            'school' => $school->only('id', 'name', 'slug', 'code'),
        ]);
    }
}
