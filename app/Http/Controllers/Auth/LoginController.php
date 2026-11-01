<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\School;
use App\Services\RoleRegistry;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class LoginController extends Controller
{
    public function create(Request $request): Response
    {
        $school = null;
        if ($slug = $request->route('schoolSlug')) {
            $school = School::where('slug', $slug)->where('status', 'active')->first();
        }

        return Inertia::render('Auth/Login', [
            'school_slug' => $school?->slug,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $credentials = $request->validate([
            'email'    => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        // A login can be scoped to a school either via the /{schoolSlug}/login
        // route or the optional school_slug field. This guarantees a visitor
        // can only authenticate against the account of the school they are on.
        $slug = $request->route('schoolSlug') ?: $request->input('school_slug');
        $school = null;

        if ($slug) {
            $school = School::where('slug', $slug)->first();

            if (! $school || $school->status !== 'active') {
                throw ValidationException::withMessages([
                    'email' => 'This school is not currently available. Please contact the Syscend Campus team.',
                ]);
            }
        }

        $attemptCredentials = $credentials;

        // Scope the authentication lookup to the school so credentials of a
        // different school can never authenticate transitively.
        if ($school) {
            $attemptCredentials['school_id'] = $school->id;
        }

        if (! Auth::attempt($attemptCredentials, $request->boolean('remember'))) {
            throw ValidationException::withMessages([
                'email' => __('auth.failed'),
            ]);
        }

        $user = Auth::user();

        // A user authenticating against a specific school must belong to it.
        if ($school && (int) $user->school_id !== (int) $school->id) {
            Auth::logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();

            throw ValidationException::withMessages([
                'email' => __('auth.failed'),
            ]);
        }

        // Suspended/inactive accounts must not be able to authenticate, otherwise
        // SchoolUserController::suspend()/bulkSuspend() have no effect at all.
        if (! $user->isActive()) {
            Auth::logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();

            throw ValidationException::withMessages([
                'email' => 'Your account is not active. Please contact your school administrator.',
            ]);
        }

        // Accounts of suspended/inactive schools may not sign in. School-scoped
        // users are bound to their school's status; platform roles are exempt.
        if ($user->school_id && ! $user->hasAnyRole(RoleRegistry::PORTAL_ROLES)) {
            $userSchool = School::find($user->school_id);

            if ($userSchool && $userSchool->status !== 'active') {
                Auth::logout();
                $request->session()->invalidate();
                $request->session()->regenerateToken();

                throw ValidationException::withMessages([
                    'email' => 'Your school account is currently inactive. Please contact the Syscend Campus team.',
                ]);
            }
        }

        $request->session()->regenerate();

        $user->update(['last_login_at' => now()]);

        activity()
            ->causedBy($user)
            ->withProperties(['ip' => $request->ip(), 'user_agent' => $request->userAgent()])
            ->log('User logged in');

        return redirect()->route('dashboard');
    }

    public function destroy(Request $request): RedirectResponse
    {
        Auth::logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('login');
    }
}