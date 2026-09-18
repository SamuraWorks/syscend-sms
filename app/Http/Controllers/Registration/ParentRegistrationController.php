<?php

namespace App\Http\Controllers\Registration;

use App\Http\Controllers\Controller;
use App\Models\{Guardian, School, User};
use App\Services\RegistryVerificationService;
use Illuminate\Http\{RedirectResponse, Request};
use Illuminate\Support\Facades\{Auth, Hash, RateLimiter};
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Inertia\Response;

class ParentRegistrationController extends Controller
{
    private string $throttleKey = 'registration-verify-parent';

    public function show(Request $request, string $schoolSlug): Response
    {
        $school = School::where('slug', $schoolSlug)
            ->where('status', 'active')
            ->firstOrFail();

        return Inertia::render('Registration/Parent', [
            'school' => $school->only('id', 'name', 'slug', 'code'),
        ]);
    }

    public function verify(Request $request, string $schoolSlug)
    {
        if (RateLimiter::tooManyAttempts($this->throttleKey . ':' . $request->ip(), 5)) {
            $seconds = RateLimiter::availableIn($this->throttleKey . ':' . $request->ip());
            return back()->withErrors([
                'email' => 'Too many verification attempts. Please try again in ' . $seconds . ' seconds.',
            ]);
        }

        $school = School::where('slug', $schoolSlug)->firstOrFail();

        $data = $request->validate([
            'student_id' => 'required|string|max:100',
            'surname'    => 'required|string|max:255',
            'email'      => 'required|email|max:255',
            'phone'      => 'required|string|max:32',
        ]);

        RateLimiter::hit($this->throttleKey . ':' . $request->ip(), 60);

        $service = new RegistryVerificationService();
        $result = $service->verifyParent(
            $school->id,
            $data['student_id'],
            $data['surname'],
            $data['email'],
            $data['phone'],
        );

        if (!$result['success']) {
            RateLimiter::hit($this->throttleKey . ':' . $request->ip(), 60);
            return back()
                ->withErrors(['student_id' => $result['message']])
                ->onlyInput('student_id', 'email');
        }

        if (!empty($result['already_registered'])) {
            session()->forget('registration');
            return back()->with('already_registered', [
                'guardian_name' => $result['guardian']->name,
                'children'      => $result['children'] ?? [],
                'message'       => $result['message'],
            ]);
        }

        $verificationToken = bin2hex(random_bytes(32));
        session([
            "registration.verify_{$verificationToken}" => [
                'guardian_id' => $result['guardian']->id,
                'school_id'   => $school->id,
                'expires_at'  => now()->addMinutes(15)->timestamp,
            ],
            'registration.verify_token' => $verificationToken,
        ]);

        return back()->with('verified', [
            'guardian_name' => $result['guardian']->name,
            'guardian_email' => $data['email'],
            'children'      => $result['children'] ?? [],
            'message'       => $result['message'],
            'verify_token'  => $verificationToken,
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

        $guardian = Guardian::where('school_id', $sessionData['school_id'])
            ->find($sessionData['guardian_id'] ?? null);

        if (!$guardian || $guardian->claimed_by !== null || $guardian->user_id !== null) {
            session()->forget('registration');
            return back()->withErrors(['message' => 'This record is no longer available for registration.']);
        }

        $data = $request->validate([
            'password'              => ['required', 'confirmed', Password::min(8)],
            'password_confirmation' => 'required',
        ]);

        $email = strtolower(trim((string) $guardian->email));
        if ($email === '') {
            session()->forget('registration');
            return back()->withErrors(['message' => 'This record has no email on file. Please contact your school administrator.']);
        }

        $existingUser = User::where('email', $email)->first();
        $createdUser = false;

        if ($existingUser) {
            // Multi-school parent: account already exists, just link this guardian
            $user = $existingUser;
            if (!$user->hasRole('parent')) {
                $user->assignRole('parent');
            }
        } else {
            $user = User::create([
                'school_id'             => $school->id,
                'name'                  => $guardian->name,
                'email'                 => $email,
                'phone'                 => $guardian->phone,
                'password'              => Hash::make($data['password']),
                'is_temporary_password' => false,
                'must_change_password'  => false,
                'status'                => 'active',
                'registration_status'   => 'registered',
            ]);
            $createdUser = true;
            $user->assignRole('parent');
        }

        $service = new RegistryVerificationService();
        $claimResult = $service->claimRecordWithLock($guardian, $user->id, Guardian::class);

        if (!$claimResult['success']) {
            if ($createdUser) {
                $user->delete();
            }
            session()->forget('registration');
            return back()->withErrors(['message' => $claimResult['message']]);
        }

        $guardian->update(['user_id' => $user->id]);

        Guardian::where('email', $email)
            ->whereNull('user_id')
            ->update(['user_id' => $user->id]);

        activity()
            ->causedBy($user)
            ->performedOn($guardian)
            ->withProperties(['school_id' => $school->id, 'registration_type' => 'parent'])
            ->log('Parent self-registration completed');

        session()->forget('registration');

        Auth::login($user);
        $user->update(['last_login_at' => now()]);

        /* §13: parents must verify their email. Send link now; failure must not block registration. */
        if (!$user->hasVerifiedEmail()) {
            try {
                $user->sendEmailVerificationNotification();
            } catch (\Throwable $e) {
                \Illuminate\Support\Facades\Log::error('Parent verification email failed: ' . $e->getMessage(), ['user_id' => $user->id]);
            }
        }

        return redirect()->intended(route('dashboard'));
    }
}
