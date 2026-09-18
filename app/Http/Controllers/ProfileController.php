<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{

    public function show(): Response
    {
        $user = auth()->user();

        return Inertia::render('Profile', [
            'user' => array_merge($user->toArray(), [
                'role'      => $user->getRoleNames()->first() ?? '',
                'avatar_url' => $user->avatar ? asset('storage/' . $user->avatar) : null,
            ]),
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $user = auth()->user();

        $data = $request->validate([
            'name'  => 'required|string|max:255',
            'email' => ['required', 'email', Rule::unique('users', 'email')->ignore($user->id)],
            'phone' => 'nullable|string|max:20',
        ]);

        $user->update($data);

        return back()->with('success', 'Profile updated successfully.');
    }

    public function uploadPhoto(Request $request): JsonResponse
    {
        $user = auth()->user();

        $request->validate([
            'photo' => 'required|file|image|mimes:jpg,jpeg,png,webp|max:5120',
        ]);

        $file = $request->file('photo');

        $filename = $user->id . '_' . time() . '.' . $file->getClientOriginalExtension();

        $file->storeAs('avatars', $filename, 'public');

        $path = 'avatars/' . $filename;

        $oldAvatar = $user->avatar;

        if ($oldAvatar && Storage::disk('public')->exists($oldAvatar)) {
            Storage::disk('public')->delete($oldAvatar);
        }

        $user->update(['avatar' => $path]);

        AuditLog::create([
            'school_id'      => $user->school_id,
            'user_id'        => $user->id,
            'event'          => 'profile_photo.uploaded',
            'auditable_type' => get_class($user),
            'auditable_id'   => $user->id,
            'old_values'     => ['avatar' => $oldAvatar],
            'new_values'     => ['avatar' => $path],
            'ip_address'     => request()->ip(),
        ]);

        return response()->json([
            'success'   => true,
            'avatar_url' => asset('storage/' . $path),
            'message'   => 'Profile photo updated successfully.',
        ]);
    }

    public function deletePhoto(): JsonResponse
    {
        $user = auth()->user();

        if ($user->avatar && Storage::disk('public')->exists($user->avatar)) {
            Storage::disk('public')->delete($user->avatar);
        }

        $oldAvatar = $user->avatar;
        $user->update(['avatar' => null]);

        AuditLog::create([
            'school_id'      => $user->school_id,
            'user_id'        => $user->id,
            'event'          => 'profile_photo.deleted',
            'auditable_type' => get_class($user),
            'auditable_id'   => $user->id,
            'old_values'     => ['avatar' => $oldAvatar],
            'new_values'     => ['avatar' => null],
            'ip_address'     => request()->ip(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Profile photo removed.',
        ]);
    }

    public function changePasswordPage(): Response
    {
        return Inertia::render('ChangePassword');
    }

    public function updatePassword(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'current_password' => ['required', 'current_password'],
            'password'         => ['required', 'confirmed', Password::min(8)],
        ]);

        $user = auth()->user();
        $user->update([
            'password'              => Hash::make($data['password']),
            'is_temporary_password' => false,
            'must_change_password'  => false,
            'force_password_change' => false,
            'password_changed_at'   => now(),
            'last_password_change_at' => now(),
        ]);

        return redirect()->route('dashboard')->with('success', 'Password changed successfully. You can now access the full dashboard.');
    }
}
