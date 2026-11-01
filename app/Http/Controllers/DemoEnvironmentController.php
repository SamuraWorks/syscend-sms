<?php

namespace App\Http\Controllers;

use App\Models\School;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

class DemoEnvironmentController extends Controller
{
    private const SCHOOL_SLUG = 'freetown-international-academy';

    private const IDENTITIES = [
        'school-admin' => ['email' => 'mohamed.sesay@freetownacademy.edu', 'role' => 'school-admin'],
        'principal' => ['email' => 'fatima.bangura@freetownacademy.edu', 'role' => 'principal'],
        'teacher' => ['email' => 'amara.kamara@freetownacademy.edu', 'role' => 'teacher'],
        'accountant' => ['email' => 'ishmael.turay@freetownacademy.edu', 'role' => 'accountant'],
        'librarian' => ['email' => 'aminata.sesay@freetownacademy.edu', 'role' => 'librarian'],
        'student' => ['email' => 'student.demo@freetownacademy.edu', 'role' => 'student'],
        'parent' => ['email' => 'abubakarr.parent1@freetownacademy.edu', 'role' => 'parent'],
        'proprietor' => ['email' => 'abdulai.conteh@freetownacademy.edu', 'role' => 'proprietor'],
        'ministry-admin' => ['email' => 'ministry@freetownacademy.edu', 'role' => 'ministry-admin'],
        'district-officer' => ['email' => 'district@freetownacademy.edu', 'role' => 'district-officer'],
        'super-admin' => ['email' => 'superadmin.demo@freetownacademy.edu', 'role' => 'super-admin'],
        'receptionist' => ['email' => 'hawa.kallon@freetownacademy.edu', 'role' => 'receptionist'],
        'driver' => ['email' => 'sorie.conteh@freetownacademy.edu', 'role' => 'driver'],
        'warden' => ['email' => 'isatu.koroma@freetownacademy.edu', 'role' => 'warden'],
        'store-manager' => ['email' => 'musa.jalloh@freetownacademy.edu', 'role' => 'store-manager'],
    ];

    public function enter(Request $request, string $portal): RedirectResponse
    {
        $identity = self::IDENTITIES[$portal] ?? null;
        abort_unless($identity, 404);

        $school = School::query()->where('slug', self::SCHOOL_SLUG)->where('status', 'active')->first();
        $platformRole = in_array($identity['role'], ['super-admin', 'ministry-admin', 'district-officer'], true);
        $credentials = ['email' => $identity['email'], 'password' => 'Demo@123'];
        if (! $platformRole) {
            $credentials['school_id'] = $school?->id;
        }

        if ((! $platformRole && ! $school) || ! Auth::attempt($credentials)) {
            throw ValidationException::withMessages(['portal' => 'The isolated demo environment has not been seeded.']);
        }

        $user = Auth::user();
        if (! $user->hasRole($identity['role']) || (! $platformRole && (int) $user->school_id !== (int) $school->id) || ! $user->isActive()) {
            Auth::logout();
            throw ValidationException::withMessages(['portal' => 'The demo identity is not correctly configured.']);
        }

        $request->session()->regenerate();
        $request->session()->put(['demo_mode' => true, 'demo_school_id' => $school?->id, 'demo_portal' => $portal]);

        return redirect()->route('dashboard');
    }

    public function exit(Request $request): RedirectResponse
    {
        Auth::logout();
        $request->session()->forget(['demo_mode', 'demo_school_id', 'demo_portal']);
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/');
    }
}
