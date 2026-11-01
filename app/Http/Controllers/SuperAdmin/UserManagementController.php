<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\School;
use App\Models\User;
use App\Services\RoleRegistry;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Role;

class UserManagementController extends Controller
{
    public function index(Request $request): Response
    {
        $users = User::with('roles')
            ->when($request->search, fn ($q) => $q->where(function ($q) use ($request) {
                $q->where('name', 'like', "%{$request->search}%")
                  ->orWhere('email', 'like', "%{$request->search}%");
            }))
            ->when($request->role, fn ($q) => $q->whereHas('roles', fn ($r) => $r->where('name', $request->role)))
            ->when($request->school_id, fn ($q) => $q->where('school_id', $request->school_id))
            ->when($request->status, fn ($q) => $q->where('status', $request->status))
            ->withTrashed(false)
            ->latest()
            ->paginate(20)
            ->withQueryString();

        $schools = School::select('id', 'name')->orderBy('name')->get();
        $roles   = Role::whereIn('name', RoleRegistry::SUPER_ADMIN_ASSIGNABLE_ROLES)
            ->orderBy('name')
            ->pluck('name');

        return Inertia::render('SuperAdmin/Users/Index', [
            'users' => [
                'data' => $users->items(),
                'meta' => [
                    'total'        => $users->total(),
                    'per_page'     => $users->perPage(),
                    'current_page' => $users->currentPage(),
                    'last_page'    => $users->lastPage(),
                ],
            ],
            'schools' => $schools,
            'roles'   => $roles,
            'filters' => $request->only(['search', 'role', 'school_id', 'status']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'name'      => 'required|string|max:255',
            'email'     => 'required|email|unique:users,email',
            'phone'     => 'nullable|string|max:20',
            'password'  => 'required|string|min:8',
            'role'      => ['required', 'string', Rule::in(RoleRegistry::SUPER_ADMIN_ASSIGNABLE_ROLES)],
            'school_id' => 'nullable|integer|exists:schools,id',
            'status'    => 'required|in:active,inactive,suspended',
        ]);

        // Enforce: school-admin MUST have a school_id
        if ($data['role'] === RoleRegistry::SCHOOL_ADMIN && empty($data['school_id'])) {
            return back()->withErrors(['school_id' => 'A school is required for the school admin role.'])->withInput();
        }

        // Enforce: super-admin MUST NOT have a school_id
        if ($data['role'] === RoleRegistry::SUPER_ADMIN && !empty($data['school_id'])) {
            return back()->withErrors(['school_id' => 'Super admin cannot be assigned to a school.'])->withInput();
        }

        $user = User::create([
            'name'      => $data['name'],
            'email'     => $data['email'],
            'phone'     => $data['phone'] ?? null,
            'password'  => Hash::make($data['password']),
            'school_id' => $data['school_id'] ?? null,
            'status'    => $data['status'],
        ]);

        $user->assignRole($data['role']);

        return back()->with('success', 'User created successfully.');
    }

    public function update(Request $request, User $user): RedirectResponse
    {
        $data = $request->validate([
            'name'      => 'required|string|max:255',
            'email'     => ['required', 'email', Rule::unique('users', 'email')->ignore($user->id)],
            'phone'     => 'nullable|string|max:20',
            'password'  => 'nullable|string|min:8',
            'role'      => ['required', 'string', Rule::in(RoleRegistry::SUPER_ADMIN_ASSIGNABLE_ROLES)],
            'school_id' => 'nullable|integer|exists:schools,id',
            'status'    => 'required|in:active,inactive,suspended',
        ]);

        // Prevent removing the last super-admin
        if ($user->hasRole(RoleRegistry::SUPER_ADMIN) && $data['role'] !== RoleRegistry::SUPER_ADMIN) {
            $superAdminCount = User::role(RoleRegistry::SUPER_ADMIN)->count();
            if ($superAdminCount <= 1) {
                return back()->withErrors(['role' => 'Cannot remove the last super admin.'])->withInput();
            }
        }

        // Enforce: school-admin MUST have a school_id
        if ($data['role'] === RoleRegistry::SCHOOL_ADMIN && empty($data['school_id'])) {
            return back()->withErrors(['school_id' => 'A school is required for the school admin role.'])->withInput();
        }

        // Enforce: super-admin MUST NOT have a school_id
        if ($data['role'] === RoleRegistry::SUPER_ADMIN && !empty($data['school_id'])) {
            return back()->withErrors(['school_id' => 'Super admin cannot be assigned to a school.'])->withInput();
        }

        $user->update([
            'name'      => $data['name'],
            'email'     => $data['email'],
            'phone'     => $data['phone'] ?? null,
            'school_id' => $data['school_id'] ?? null,
            'status'    => $data['status'],
        ]);

        if (!blank($data['password'])) {
            $user->update(['password' => Hash::make($data['password'])]);
        }

        $user->syncRoles([$data['role']]);

        return back()->with('success', 'User updated successfully.');
    }

    public function destroy(User $user): RedirectResponse
    {
        if ($user->hasRole(RoleRegistry::SUPER_ADMIN)) {
            return back()->with('error', 'Cannot delete a super admin.');
        }

        $user->delete();

        return back()->with('success', 'User deleted.');
    }

    public function suspend(User $user): RedirectResponse
    {
        if ($user->hasRole(RoleRegistry::SUPER_ADMIN)) {
            return back()->with('error', 'Cannot suspend a super admin.');
        }

        $user->update(['status' => 'suspended']);
        return back()->with('success', 'User suspended.');
    }

    public function activate(User $user): RedirectResponse
    {
        $user->update(['status' => 'active']);
        return back()->with('success', 'User activated.');
    }

    public function resetPassword(Request $request, User $user): RedirectResponse
    {
        $data = $request->validate(['password' => 'required|string|min:8']);
        $user->update(['password' => Hash::make($data['password'])]);
        return back()->with('success', 'Password reset successfully.');
    }
}
