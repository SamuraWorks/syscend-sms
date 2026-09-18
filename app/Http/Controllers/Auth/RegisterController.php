<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\School;
use Inertia\Inertia;
use Inertia\Response;

class RegisterController extends Controller
{
    public function create(): Response
    {
        $schools = School::where('status', 'active')
            ->select('id', 'name', 'slug')
            ->orderBy('name')
            ->get();

        return Inertia::render('Auth/Register', [
            'schools' => $schools,
        ]);
    }
}
