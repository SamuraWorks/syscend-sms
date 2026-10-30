<?php

namespace App\Http\Controllers;

use App\Models\School;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class DemoPortalController extends Controller
{
    private const SCHOOL_SLUG = 'freetown-international-academy';

    private const PORTALS = [
        ['role' => 'school-admin', 'label' => 'School Admin', 'email' => 'mohamed.sesay@freetownacademy.edu'],
        ['role' => 'principal', 'label' => 'Principal', 'email' => 'fatima.bangura@freetownacademy.edu'],
        ['role' => 'teacher', 'label' => 'Teacher', 'email' => 'amara.kamara@freetownacademy.edu'],
        ['role' => 'accountant', 'label' => 'Accountant', 'email' => 'ishmael.turay@freetownacademy.edu'],
        ['role' => 'librarian', 'label' => 'Librarian', 'email' => 'aminata.sesay@freetownacademy.edu'],
        ['role' => 'student', 'label' => 'Student', 'email' => 'student.demo@freetownacademy.edu'],
        ['role' => 'parent', 'label' => 'Parent / Guardian', 'email' => 'abubakarr.parent1@freetownacademy.edu'],
        ['role' => 'proprietor', 'label' => 'Proprietor', 'email' => 'abdulai.conteh@freetownacademy.edu'],
        ['role' => 'ministry-admin', 'label' => 'Ministry Admin', 'email' => 'ministry@freetownacademy.edu'],
        ['role' => 'district-officer', 'label' => 'District Officer', 'email' => 'district@freetownacademy.edu'],
    ];

    public function index(): Response
    {
        return Inertia::render('Public/DemoPortal', ['portals' => self::PORTALS]);
    }

    public function login(Request $request): RedirectResponse
    {
        $data = $request->validate(['role' => ['required', 'string']]);
        $portal = collect(self::PORTALS)->firstWhere('role', $data['role']);
        $school = School::where('slug', self::SCHOOL_SLUG)->where('status', 'active')->first();

        $platformRole = in_array($portal['role'] ?? null, ['ministry-admin', 'district-officer'], true);
        $credentials = ['email' => $portal['email'], 'password' => 'Demo@123'];
        if (! $platformRole) $credentials['school_id'] = $school?->id;

        if (! $portal || (! $platformRole && ! $school) || ! Auth::attempt($credentials)) {
            throw ValidationException::withMessages(['role' => 'This demo portal is not available. Run the demo data seed before opening it.']);
        }

        $user = Auth::user();
        if (! $user->hasRole($portal['role']) || (! $platformRole && (int) $user->school_id !== (int) $school->id) || ! $user->isActive()) {
            Auth::logout();
            throw ValidationException::withMessages(['role' => 'The demo identity is not correctly configured.']);
        }

        $request->session()->regenerate();
        $request->session()->put('demo_mode', true);
        $request->session()->put('demo_school_id', $school->id);

        return redirect()->route('dashboard');
    }

    public function exit(Request $request): RedirectResponse
    {
        Auth::logout();
        $request->session()->forget(['demo_mode', 'demo_school_id']);
        $request->session()->invalidate();
        $request->session()->regenerateToken();
        return redirect()->route('demo.portal');
    }
}
