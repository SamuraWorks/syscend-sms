<?php

namespace App\Http\Controllers\Registration;

use App\Http\Controllers\Controller;
use App\Models\{School, Student, User};
use App\Services\RegistryVerificationService;
use Illuminate\Http\{RedirectResponse, Request};
use Illuminate\Support\Facades\{Auth, Hash, RateLimiter};
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Inertia\Response;

class StudentRegistrationController extends Controller
{
    private string $throttleKey = 'registration-verify-student';

    public function show(Request $request, string $schoolSlug): Response
    {
        $school = School::where('slug', $schoolSlug)
            ->where('status', 'active')
            ->firstOrFail();

        return Inertia::render('Registration/Student', [
            'school' => $school->only('id', 'name', 'slug', 'code'),
        ]);
    }

    public function verify(Request $request, string $schoolSlug)
    {
        if (RateLimiter::tooManyAttempts($this->throttleKey . ':' . $request->ip(), 5)) {
            $seconds = RateLimiter::availableIn($this->throttleKey . ':' . $request->ip());
            return back()->withErrors([
                'student_id' => 'Too many verification attempts. Please try again in ' . $seconds . ' seconds.',
            ]);
        }

        $school = School::where('slug', $schoolSlug)->firstOrFail();

        $data = $request->validate([
            'student_id'  => 'required|string|max:50',
            'full_name'   => 'nullable|string|max:255',
            'surname'     => 'nullable|string|max:100',
            'other_names' => 'nullable|string|max:150',
            'email'       => 'nullable|email|max:255',
        ]);

        $hasSplit   = !empty($data['surname']) && !empty($data['other_names']);
        $hasFullName = !empty($data['full_name']);

        if (!$hasFullName && !$hasSplit) {
            return back()->withErrors(['surname' => 'Please enter your surname and other names.']);
        }

        // Build candidate name orderings — match either "Other Names Surname" or "Surname Other Names"
        $candidates = $hasSplit ? [
            trim($data['other_names']) . ' ' . trim($data['surname']),
            trim($data['surname']) . ' ' . trim($data['other_names']),
        ] : [$data['full_name']];

        RateLimiter::hit($this->throttleKey . ':' . $request->ip(), 60);

        $service = new RegistryVerificationService();
        $result = $service->verifyStudent($school->id, $data['student_id'], $candidates, $data['email'] ?? null);

        if (!$result['success']) {
            RateLimiter::hit($this->throttleKey . ':' . $request->ip(), 60);
            $errors = ['student_id' => $result['message']];
            if (isset($result['requires_email'])) {
                $errors['email'] = $result['message'];
                unset($errors['student_id']);
            }
            return back()->withErrors($errors)->onlyInput('student_id', 'full_name', 'surname', 'other_names');
        }

        $verificationToken = bin2hex(random_bytes(32));
        session([
            "registration.verify_{$verificationToken}" => [
                'student_id' => $result['student']->id,
                'school_id'  => $school->id,
                'expires_at' => now()->addMinutes(15)->timestamp,
            ],
            'registration.verify_token' => $verificationToken,
        ]);

        return back()->with('verified', [
            'student_name' => $result['student']->full_name,
            'class'        => $result['student']->schoolClass->name ?? '',
            'section'      => $result['student']->section->name ?? '',
            'message'      => $result['message'],
            'verify_token' => $verificationToken,
        ]);
    }

    public function complete(Request $request, string $schoolSlug)
    {
        $school = School::where('slug', $schoolSlug)->firstOrFail();

        $verifyToken = session('registration.verify_token');
        $sessionData = $verifyToken ? session("registration.verify_{$verifyToken}") : null;

        if (!$sessionData || $sessionData['expires_at'] < now()->timestamp) {
            session()->forget('registration');
            return back()->withErrors(['message' => 'Verification session expired. Please verify again.']);
        }

        $student = Student::where('school_id', $sessionData['school_id'])
            ->where('id', $sessionData['student_id'])
            ->first();

        if (!$student || $student->claimed_by !== null || $student->user_id !== null) {
            session()->forget('registration');
            return back()->withErrors(['message' => 'This record is no longer available for registration.']);
        }

        $data = $request->validate([
            'email'                => ['required', 'email', 'unique:users,email'],
            'password'             => ['required', 'confirmed', Password::min(8)],
            'password_confirmation' => 'required',
        ]);

        $user = User::create([
            'school_id'             => $school->id,
            'name'                  => $student->full_name,
            'email'                 => $data['email'],
            'phone'                 => $student->phone,
            'password'              => Hash::make($data['password']),
            'is_temporary_password' => false,
            'must_change_password'  => false,
            'status'                => 'active',
            'registration_status'   => 'registered',
        ]);

        $user->assignRole('student');

        $service = new RegistryVerificationService();
        $claimResult = $service->claimRecordWithLock($student, $user->id, Student::class);

        if (!$claimResult['success']) {
            $user->delete();
            session()->forget('registration');
            return back()->withErrors(['message' => $claimResult['message']]);
        }

        $student->update(['user_id' => $user->id]);

        activity()
            ->causedBy($user)
            ->performedOn($student)
            ->withProperties(['school_id' => $school->id, 'registration_type' => 'student'])
            ->log('Student self-registration completed');

        session()->forget('registration');

        Auth::login($user);
        $user->update(['last_login_at' => now()]);

        return redirect()->intended(route('dashboard'));
    }
}
