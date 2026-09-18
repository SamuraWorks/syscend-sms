<?php

namespace App\Http\Controllers;

use App\Models\School;
use App\Services\SchoolAdminOnboardingService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Inertia\Response;

class StartTrialController extends Controller
{
    public function create(): Response
    {
        return Inertia::render('Public/StartTrial');
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            // School info
            'name'    => ['required', 'string', 'max:255'],
            'email'   => ['nullable', 'email', 'max:255'],
            'phone'   => ['nullable', 'string', 'max:25'],
            'address' => ['nullable', 'string', 'max:500'],
            'city'    => ['nullable', 'string', 'max:100'],

            // School admin account
            'admin_name'  => ['required', 'string', 'max:255'],
            'admin_email' => ['required', 'email', 'unique:users,email'],
            'admin_phone' => ['nullable', 'string', 'max:25'],
            'password'    => ['required', 'confirmed', Password::min(8)],
        ]);

        // Ensure a unique public slug for the school
        $base = Str::slug($data['name']);
        $slug = $base;
        $i = 2;
        while (School::where('slug', $slug)->exists()) {
            $slug = $base.'-'.($i++);
        }

        $result = (new SchoolAdminOnboardingService)->createSchoolWithAdmin(
            [
                'name'    => $data['name'],
                'slug'    => $slug,
                'email'   => $data['email'] ?? null,
                'phone'   => $data['phone'] ?? null,
                'address' => $data['address'] ?? null,
                'city'    => $data['city'] ?? null,
            ],
            [
                'name'  => $data['admin_name'],
                'email' => $data['admin_email'],
                'phone' => $data['admin_phone'] ?? null,
            ],
            null,
            $data['password']
        );

        auth()->login($result['admin']);

        activity()
            ->performedOn($result['school'])
            ->withProperties(['ip' => $request->ip(), 'user_agent' => $request->userAgent()])
            ->log('School self-registered via free trial');

        return redirect()
            ->route('school.school-setup')
            ->with('success', "Welcome to Syscend Campus, {$result['school']->name}! Your 14-day free trial is active — let's set up your school.");
    }
}