<?php

namespace App\Http\Controllers\Registration;

use App\Http\Controllers\Controller;
use App\Models\{School, Staff, User};
use App\Services\{RegistryVerificationService, RoleRegistry};
use Illuminate\Http\{RedirectResponse, Request};
use Illuminate\Support\Facades\{Auth, Hash, RateLimiter};
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Inertia\Response;

class StaffRegistrationController extends Controller
{
    private string $throttleKey = 'registration-verify-staff';

    public function show(Request $request, string $schoolSlug): Response
    {
        $school = School::where('slug', $schoolSlug)
            ->where('status', 'active')
            ->firstOrFail();

        return Inertia::render('Registration/Staff', [
            'school' => $school->only('id', 'name', 'slug', 'code'),
        ]);
    }

    public function verify(Request $request, string $schoolSlug)
    {
        if (RateLimiter::tooManyAttempts($this->throttleKey . ':' . $request->ip(), 5)) {
            $seconds = RateLimiter::availableIn($this->throttleKey . ':' . $request->ip());
            return back()->withErrors([
                'emp_id' => 'Too many verification attempts. Please try again in ' . $seconds . ' seconds.',
            ]);
        }

        $school = School::where('slug', $schoolSlug)->firstOrFail();

        $data = $request->validate([
            'emp_id'     => 'required|string|max:50',
            'full_name'  => 'required|string|max:255',
            'email'      => 'nullable|email|max:255',
        ]);

        RateLimiter::hit($this->throttleKey . ':' . $request->ip(), 60);

        $service = new RegistryVerificationService();
        $result = $service->verifyStaff($school->id, $data['emp_id'], $data['full_name'], $data['email'] ?? null);

        if (!$result['success']) {
            RateLimiter::hit($this->throttleKey . ':' . $request->ip(), 60);
            $errors = ['emp_id' => $result['message']];
            if (isset($result['requires_email'])) {
                $errors['email'] = $result['message'];
                unset($errors['emp_id']);
            }
            return back()->withErrors($errors)->onlyInput('emp_id', 'full_name');
        }

        $verificationToken = bin2hex(random_bytes(32));
        session([
            "registration.verify_{$verificationToken}" => [
                'staff_id'  => $result['staff']->id,
                'school_id' => $school->id,
                'expires_at' => now()->addMinutes(15)->timestamp,
            ],
            'registration.verify_token' => $verificationToken,
        ]);

        $staffRoles = $this->resolveStaffRoles($result['staff']);

        return back()->with('verified', [
            'staff_name'   => $result['staff']->first_name . ' ' . $result['staff']->last_name,
            'department'   => $result['staff']->department->name ?? '',
            'designation'  => $result['staff']->designation->name ?? '',
            'teacher_type' => $result['staff']->teacher_type ?? '',
            'roles'        => $staffRoles,
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

        $staff = Staff::where('school_id', $sessionData['school_id'])
            ->where('id', $sessionData['staff_id'])
            ->first();

        if (!$staff || $staff->claimed_by !== null || $staff->user_id !== null) {
            session()->forget('registration');
            return back()->withErrors(['message' => 'This record is no longer available for registration.']);
        }

        $data = $request->validate([
            'email'                => ['required', 'email', 'unique:users,email'],
            'password'             => ['required', 'confirmed', Password::min(8)],
            'password_confirmation' => 'required',
        ]);

        $staffRoles = $this->resolveStaffRoles($staff);

        $user = User::create([
            'school_id'             => $school->id,
            'name'                  => trim($staff->first_name . ' ' . $staff->last_name),
            'email'                 => $data['email'],
            'phone'                 => $staff->phone,
            'password'              => Hash::make($data['password']),
            'is_temporary_password' => false,
            'must_change_password'  => false,
            'status'                => 'active',
            'registration_status'   => 'registered',
        ]);

        $user->assignRole($staffRoles);

        $service = new RegistryVerificationService();
        $claimResult = $service->claimRecordWithLock($staff, $user->id, Staff::class);

        if (!$claimResult['success']) {
            $user->delete();
            session()->forget('registration');
            return back()->withErrors(['message' => $claimResult['message']]);
        }

        $staff->update(['user_id' => $user->id]);

        activity()
            ->causedBy($user)
            ->performedOn($staff)
            ->withProperties(['school_id' => $school->id, 'registration_type' => 'staff', 'roles' => $staffRoles])
            ->log('Staff self-registration completed');

        session()->forget('registration');

        Auth::login($user);
        $user->update(['last_login_at' => now()]);

        return redirect()->intended(route('dashboard'));
    }

    /**
     * Resolve all roles for a staff member based on their record.
     * Teachers get 'teacher'. Principals get 'principal' (and 'teacher' if they also teach).
     */
    private function resolveStaffRoles(Staff $staff): array
    {
        $roles = [];

        $isTeaching = in_array($staff->teacher_type, ['subject_teacher', 'form_master', 'both'], true);

        if ($isTeaching) {
            $roles[] = RoleRegistry::TEACHER;
        }

        if ($staff->designation) {
            $designationLower = mb_strtolower($staff->designation->name);
            if (str_contains($designationLower, 'principal') && !in_array(RoleRegistry::PRINCIPAL, $roles)) {
                $roles[] = RoleRegistry::PRINCIPAL;
            }
            if (str_contains($designationLower, 'accountant') && !in_array(RoleRegistry::ACCOUNTANT, $roles)) {
                $roles[] = RoleRegistry::ACCOUNTANT;
            }
            if (str_contains($designationLower, 'librarian') && !in_array(RoleRegistry::LIBRARIAN, $roles)) {
                $roles[] = RoleRegistry::LIBRARIAN;
            }
        }

        if (empty($roles)) {
            $roles[] = RoleRegistry::TEACHER;
        }

        return $roles;
    }
}
