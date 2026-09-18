<?php

namespace App\Http\Controllers\SchoolAdmin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\RoleRegistry;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Role;

class SchoolUserController extends Controller
{
    private function sid(): int
    {
        return $this->getSchoolId();
    }

    /** School-level roles that can be managed by a school-admin */
    private function allowedRoles(): array
    {
        return RoleRegistry::SCHOOL_MANAGEABLE_ROLES;
    }

    public function index(Request $request): Response
    {
        $sid = $this->sid();

        $users = User::with('roles')
            ->where('school_id', $sid)
            ->when($request->search, fn ($q) => $q->where(function ($q) use ($request) {
                $q->where('name', 'like', "%{$request->search}%")
                  ->orWhere('email', 'like', "%{$request->search}%");
            }))
            ->when($request->role, fn ($q) => $q->whereHas('roles', fn ($r) => $r->where('name', $request->role)))
            ->when($request->status, fn ($q) => $q->where('status', $request->status))
            ->latest()
            ->paginate(15)
            ->withQueryString();

        $roles = Role::whereIn('name', $this->allowedRoles())->orderBy('name')->pluck('name');

        // Summary stats
        $base = User::where('school_id', $sid);
        $stats = [
            'total'    => $base->count(),
            'active'   => (clone $base)->where('status', 'active')->count(),
            'inactive' => (clone $base)->where('status', 'inactive')->count(),
            'suspended'=> (clone $base)->where('status', 'suspended')->count(),
            'roles'    => Role::whereIn('name', $this->allowedRoles())->withCount('users')
                ->get()
                ->filter(fn ($r) => $r->users_count > 0)
                ->mapWithKeys(fn ($r) => [$r->name => $r->users_count])
                ->toArray(),
        ];

        return Inertia::render('SchoolAdmin/Settings/Admins', [
            'users' => [
                'data' => $users->items(),
                'meta' => [
                    'total'        => $users->total(),
                    'per_page'     => $users->perPage(),
                    'current_page' => $users->currentPage(),
                    'last_page'    => $users->lastPage(),
                ],
            ],
            'roles'   => $roles,
            'filters' => $request->only(['search', 'role', 'status']),
            'stats'   => $stats,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $sid = $this->sid();

        $data = $request->validate([
            'name'     => 'required|string|max:255',
            'email'    => 'required|email|unique:users,email',
            'phone'    => 'nullable|string|max:20',
            'password' => 'nullable|string|min:8',
            'roles'    => 'required|array|min:1',
            'roles.*'  => ['required', 'string', Rule::in($this->allowedRoles())],
            'status'   => 'required|in:active,inactive',
        ]);

        $tempPassword = ($data['password'] ?? null) ?: Str::random(12);

        $user = User::create([
            'name'                 => $data['name'],
            'email'                => $data['email'],
            'phone'                => $data['phone'] ?? null,
            'password'             => Hash::make($tempPassword),
            'school_id'            => $sid,
            'status'               => $data['status'],
            'is_temporary_password'=> true,
            'must_change_password' => true,
        ]);

        $user->syncRoles($data['roles']);

        return back()->with('user_created', [
            'name'        => $user->name,
            'email'       => $user->email,
            'temp_password'=> $tempPassword,
            'roles'       => $data['roles'],
        ]);
    }

    public function update(Request $request, User $user): RedirectResponse
    {
        if ($user->school_id !== $this->sid()) {
            abort(403);
        }

        $data = $request->validate([
            'name'     => 'required|string|max:255',
            'email'    => ['required', 'email', Rule::unique('users', 'email')->ignore($user->id)],
            'phone'    => 'nullable|string|max:20',
            'password' => 'nullable|string|min:8',
            'roles'    => 'required|array|min:1',
            'roles.*'  => ['required', 'string', Rule::in($this->allowedRoles())],
            'status'   => 'required|in:active,inactive,suspended',
        ]);

        $user->update([
            'name'   => $data['name'],
            'email'  => $data['email'],
            'phone'  => $data['phone'] ?? null,
            'status' => $data['status'],
        ]);

        if (!blank($data['password'] ?? null)) {
            $user->update(['password' => Hash::make($data['password']), 'force_password_change' => true, 'is_temporary_password' => true, 'must_change_password' => true]);
        }

        $user->syncRoles($data['roles']);

        return back()->with('success', 'User updated successfully.');
    }

    public function destroy(User $user): RedirectResponse
    {
        if ($user->school_id !== $this->sid()) {
            abort(403);
        }

        $user->delete();

        return back()->with('success', 'User deleted.');
    }

    public function suspend(User $user): RedirectResponse
    {
        if ($user->school_id !== $this->sid()) {
            abort(403);
        }

        $user->update(['status' => 'suspended']);
        return back()->with('success', 'User suspended.');
    }

    public function activate(User $user): RedirectResponse
    {
        if ($user->school_id !== $this->sid()) {
            abort(403);
        }

        $user->update(['status' => 'active']);
        return back()->with('success', 'User activated.');
    }

    /** Reset a user's password to a random value and return it */
    public function resetPassword(User $user): RedirectResponse
    {
        if ($user->school_id !== $this->sid()) {
            abort(403);
        }

        $newPassword = Str::random(12);
        $user->update([
            'password'              => Hash::make($newPassword),
            'force_password_change' => true,
            'is_temporary_password' => true,
            'must_change_password'  => true,
        ]);

        return back()->with('reset_password', [
            'user' => $user->name,
            'password' => $newPassword,
        ]);
    }

    /** Bulk activate selected users */
    public function bulkActivate(Request $request): RedirectResponse
    {
        $ids = $request->validate(['ids' => 'required|array', 'ids.*' => 'integer'])['ids'];
        User::where('school_id', $this->sid())->whereIn('id', $ids)->update(['status' => 'active']);
        return back()->with('success', count($ids) . ' users activated.');
    }

    /** Bulk suspend selected users */
    public function bulkSuspend(Request $request): RedirectResponse
    {
        $ids = $request->validate(['ids' => 'required|array', 'ids.*' => 'integer'])['ids'];
        User::where('school_id', $this->sid())->whereIn('id', $ids)->update(['status' => 'suspended']);
        return back()->with('success', count($ids) . ' users suspended.');
    }

    /** Bulk delete selected users */
    public function bulkDelete(Request $request): RedirectResponse
    {
        $ids = $request->validate(['ids' => 'required|array', 'ids.*' => 'integer'])['ids'];
        User::where('school_id', $this->sid())->whereIn('id', $ids)->delete();
        return back()->with('success', count($ids) . ' users deleted.');
    }

    /** Bulk import users from CSV */
    public function bulkImport(Request $request): RedirectResponse
    {
        $request->validate([
            'csv_file' => 'required|file|mimes:csv,txt|max:5120',
            'default_role' => ['required', 'string', Rule::in($this->allowedRoles())],
        ]);

        $file = $request->file('csv_file');
        $contents = file_get_contents($file->getRealPath());
        $rows = array_map('str_getcsv', explode("\n", $contents));

        if (count($rows) < 2) {
            return back()->withErrors(['csv_file' => 'CSV must have a header row and at least one data row.']);
        }

        $headers = array_map(fn ($h) => strtolower(trim($h)), array_shift($rows));
        $sid = $this->sid();
        $defaultRole = $request->input('default_role');
        $imported = 0;
        $skipped = 0;
        $errors = [];

        foreach ($rows as $i => $row) {
            if (empty(array_filter($row))) continue;

            $data = array_combine($headers, $row);
            $name = trim($data['name'] ?? '');
            $email = strtolower(trim($data['email'] ?? ''));
            $phone = trim($data['phone'] ?? '');
            $role = strtolower(trim($data['role'] ?? '')) ?: $defaultRole;

            if (!$name || !$email) {
                $skipped++;
                $errors[] = "Row " . ($i + 2) . ": Missing name or email.";
                continue;
            }

            if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
                $skipped++;
                $errors[] = "Row " . ($i + 2) . ": Invalid email '$email'.";
                continue;
            }

            if (!in_array($role, $this->allowedRoles())) {
                $role = $defaultRole;
            }

            if (User::where('school_id', $sid)->where('email', $email)->exists()) {
                $skipped++;
                $errors[] = "Row " . ($i + 2) . ": Email '$email' already exists.";
                continue;
            }

            $password = Str::random(12);
            $user = User::create([
                'name'      => $name,
                'email'     => $email,
                'phone'     => $phone ?: null,
                'password'  => Hash::make($password),
                'school_id' => $sid,
                'status'    => 'active',
                'force_password_change' => true,
            ]);

            $user->assignRole($role);
            $imported++;
        }

        return back()->with('import_result', [
            'imported' => $imported,
            'skipped'  => $skipped,
            'errors'   => $errors,
        ]);
    }

    /** Export all school users to CSV download */
    public function exportCsv(): \Symfony\Component\HttpFoundation\StreamedResponse
    {
        $users = User::with('roles')
            ->where('school_id', $this->sid())
            ->get();

        $headers = ['Content-Type' => 'text/csv'];
        $callback = function () use ($users) {
            $handle = fopen('php://output', 'w');
            fputcsv($handle, ['Name', 'Email', 'Phone', 'Role', 'Status', 'Created', 'Last Login']);
            foreach ($users as $u) {
                fputcsv($handle, [
                    $u->name,
                    $u->email,
                    $u->phone ?? '',
                    implode(' | ', $u->roles->pluck('name')->toArray()),
                    $u->status,
                    $u->created_at->format('Y-m-d'),
                    $u->last_login_at?->format('Y-m-d') ?? '',
                ]);
            }
            fclose($handle);
        };

        $filename = 'school_users_' . now()->format('Y-m-d_His') . '.csv';
        return response()->stream($callback, 200, [
            'Content-Type'        => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ]);
    }
}
