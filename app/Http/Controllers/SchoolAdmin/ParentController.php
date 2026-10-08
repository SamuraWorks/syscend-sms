<?php

namespace App\Http\Controllers\SchoolAdmin;

use App\Http\Controllers\Controller;
use App\Models\Guardian;
use App\Models\Student;
use App\Models\User;
use App\Services\UserCreationService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class ParentController extends Controller
{
    private const RELATIONS = ['father', 'mother', 'guardian', 'uncle', 'aunt', 'sibling', 'other'];

    public function index(Request $request): Response
    {
        $guardians = Guardian::withCount('children')
            ->with('user:id,name,email')
            ->when($request->search, fn ($q) => $q->where(function ($q) use ($request) {
                $q->where('name', 'like', "%{$request->search}%")
                  ->orWhere('phone', 'like', "%{$request->search}%")
                  ->orWhere('alt_phone', 'like', "%{$request->search}%")
                  ->orWhere('email', 'like', "%{$request->search}%");
            }))
            ->when($request->status, fn ($q) => $q->where('registration_status', $request->status))
            ->latest()
            ->paginate(20)
            ->withQueryString();

        $stats = [
            'total'       => Guardian::count(),
            'registered'  => Guardian::whereNotNull('user_id')->count(),
            'pending'     => Guardian::whereNull('user_id')->count(),
            'linked'      => Guardian::has('children')->count(),
        ];

        return Inertia::render('SchoolAdmin/Parents/Index', [
            'parents' => $guardians,
            'filters' => $request->only(['search', 'status']),
            'stats'   => $stats,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('SchoolAdmin/Parents/Create', [
            'unlinkedStudents' => $this->availableStudents(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $this->validateParent($request);

        try {
            $schoolId = $this->getSchoolId();
            $tempPassword = null;
            $msg = null;

            $duplicate = $this->findDuplicate($schoolId, $data['email'] ?? null, $data['phone'] ?? null);
            if ($duplicate) {
                return back()->withInput()->with(
                    'error',
                    "A parent record with these contact details already exists ({$duplicate->name}). Edit that record instead of creating a duplicate."
                );
            }

            DB::transaction(function () use ($data, $schoolId, &$tempPassword, &$msg) {
                $guardian = Guardian::create([
                    'school_id'  => $schoolId,
                    'name'       => $data['name'],
                    'relation'   => $data['relation'],
                    'phone'      => $data['phone'] ?? null,
                    'alt_phone'  => $data['alt_phone'] ?? null,
                    'email'      => $data['email'] ?? null,
                    'occupation' => $data['occupation'] ?? null,
                    'address'    => $data['address'] ?? null,
                ]);

                $this->syncChildren($guardian, $data['student_ids'] ?? []);

                if (!empty($data['email']) && !empty($data['create_account'])) {
                    [$msg, $tempPassword] = $this->attachOrCreateAccount($guardian, $data);
                }

                activity()
                    ->performedOn($guardian)
                    ->withProperties(['school_id' => $schoolId, 'children_linked' => count($data['student_ids'] ?? [])])
                    ->log('Parent created manually');
            });

            $msg = $msg ?? 'Parent created successfully.';
            if ($tempPassword) {
                $msg .= ' Login credentials have been created.';
            }

            return redirect()->route('school-admin.parents.index')
                ->with('success', $msg)
                ->with('temp_password', $tempPassword)
                ->with('show_credentials', (bool) $tempPassword);
        } catch (\Throwable $e) {
            return back()->withInput()->with('error', 'Failed to create parent: ' . $e->getMessage());
        }
    }

    public function show(Guardian $parent): Response
    {
        $parent->load([
            'children' => fn ($q) => $q->select('students.*')
                ->with('schoolClass:id,name', 'section:id,name'),
            'user:id,name,email,phone,status',
        ]);
        $parent->loadCount('children');

        $roles = $parent->user?->getRoleNames()->toArray() ?? [];

        return Inertia::render('SchoolAdmin/Parents/Show', [
            'parent' => $parent,
            'roles'  => $roles,
        ]);
    }

    public function edit(Guardian $parent): Response
    {
        $linkedStudentIds = $parent->children()->pluck('students.id')->toArray();

        $available = Student::with('schoolClass:id,name')
            ->where(function ($q) use ($linkedStudentIds) {
                $q->whereDoesntHave('guardians')
                  ->orWhereIn('id', $linkedStudentIds);
            })
            ->where('status', 'active')
            ->orderBy('first_name')
            ->get(['id', 'first_name', 'last_name', 'student_id', 'admission_no', 'class_id']);

        return Inertia::render('SchoolAdmin/Parents/Edit', [
            'parent'           => $parent,
            'linkedStudentIds' => $linkedStudentIds,
            'unlinkedStudents' => $available,
        ]);
    }

    public function update(Request $request, Guardian $parent): RedirectResponse
    {
        $data = $this->validateParent($request);

        try {
            DB::transaction(function () use ($data, $parent) {
                $duplicate = $this->findDuplicate($parent->school_id, $data['email'] ?? null, $data['phone'] ?? null, $parent->id);
                if ($duplicate) {
                    throw new \RuntimeException("These contact details belong to another parent record ({$duplicate->name}).");
                }

                $parent->update([
                    'name'       => $data['name'],
                    'relation'   => $data['relation'],
                    'phone'      => $data['phone'] ?? null,
                    'alt_phone'  => $data['alt_phone'] ?? null,
                    'email'      => $data['email'] ?? null,
                    'occupation' => $data['occupation'] ?? null,
                    'address'    => $data['address'] ?? null,
                ]);

                if ($parent->user_id) {
                    $parent->user->update([
                        'name'  => $data['name'],
                        'phone' => $data['phone'] ?? $parent->user->phone,
                    ]);
                }

                $before = $parent->children()->pluck('students.id')->all();
                $this->syncChildren($parent, $data['student_ids'] ?? []);
                $after = $parent->children()->pluck('students.id')->all();

                activity()
                    ->performedOn($parent)
                    ->withProperties([
                        'school_id'      => $parent->school_id,
                        'children_before'=> $before,
                        'children_after' => $after,
                    ])
                    ->log('Parent updated');

                if (empty($parent->user_id) && !empty($data['email']) && !empty($data['create_account'])) {
                    $this->attachOrCreateAccount($parent, $data);
                }
            });

            return redirect()->route('school-admin.parents.show', $parent)->with('success', 'Parent updated.');
        } catch (\Throwable $e) {
            return back()->withInput()->with('error', 'Failed to update parent: ' . $e->getMessage());
        }
    }

    /**
     * Issue a fresh temporary password for the parent's login account.
     * The new password is shown ONCE to the school admin and must be
     * changed by the parent at next login.
     */
    public function resetPassword(Guardian $parent): RedirectResponse
    {
        $user = $parent->user_id ? User::find($parent->user_id) : null;

        if (!$user) {
            return back()->with('error', 'This parent has no login account yet. Create one first.');
        }

        $tempPassword = Str::random(12);

        $user->update([
            'password'              => Hash::make($tempPassword),
            'is_temporary_password' => true,
            'must_change_password'  => true,
            'force_password_change' => true,
            'password_changed_at'   => null,
        ]);

        activity()
            ->causedBy(auth()->user())
            ->performedOn($parent)
            ->withProperties(['school_id' => $parent->school_id, 'target_user' => $user->id])
            ->log('Parent login password reset by school admin');

        return back()
            ->with('success', "Password reset for {$parent->name} ({$user->email}). Share it securely — it must be changed at next login.")
            ->with('temp_password', $tempPassword)
            ->with('show_credentials', true);
    }

    public function destroy(Guardian $parent): RedirectResponse
    {
        try {
            DB::transaction(function () use ($parent) {
                $detached = $parent->children()->pluck('students.id')->all();

                $parent->children()->detach();

                foreach ($detached as $studentId) {
                    $remaining = DB::table('guardian_student')->where('student_id', $studentId)->count();
                    if ($remaining === 0) {
                        Student::where('id', $studentId)->update(['guardian_id' => null]);
                    } else {
                        $firstGuardian = DB::table('guardian_student')->where('student_id', $studentId)->value('guardian_id');
                        Student::where('id', $studentId)->update(['guardian_id' => $firstGuardian]);
                    }
                }

                activity()
                    ->performedOn($parent)
                    ->withProperties(['school_id' => $parent->school_id, 'children_detached' => $detached])
                    ->log('Parent deleted');

                $parent->delete();
            });

            return redirect()->route('school-admin.parents.index')->with('success', 'Parent removed.');
        } catch (\Throwable $e) {
            return back()->with('error', 'Failed to delete parent: ' . $e->getMessage());
        }
    }

    private function validateParent(Request $request): array
    {
        return $request->validate([
            'name'           => 'required|string|max:150',
            'relation'       => 'required|string|in:' . implode(',', self::RELATIONS),
            'phone'          => 'required|string|max:20',
            'alt_phone'      => 'nullable|string|max:20',
            'email'          => 'nullable|email|max:150',
            'occupation'     => 'nullable|string|max:100',
            'address'        => 'nullable|string|max:500',
            'student_ids'    => 'nullable|array',
            'student_ids.*'  => Rule::exists('students', 'id')->where(fn ($q) => $q->where('school_id', $this->getSchoolId())),
            'create_account' => 'sometimes|boolean',
        ]);
    }

    /**
     * Students available for linking: those with no guardians at all.
     */
    private function availableStudents()
    {
        return Student::with('schoolClass:id,name')
            ->whereDoesntHave('guardians')
            ->where('status', 'active')
            ->orderBy('first_name')
            ->get(['id', 'first_name', 'last_name', 'student_id', 'admission_no', 'class_id']);
    }

    /**
     * Attach/detach children through the guardian_student pivot so one parent
     * can hold many children and a child can hold several guardians.
     * The legacy students.guardian_id column is kept pointed at the primary
     * guardian for backwards compatibility.
     */
    private function syncChildren(Guardian $guardian, array $desiredIds): void
    {
        $current = $guardian->children()->pluck('students.id')->all();

        $toDetach = array_diff($current, $desiredIds);
        $toAttach = array_values(array_diff($desiredIds, $current));

        foreach ($toDetach as $studentId) {
            $guardian->children()->detach($studentId);

            $remaining = DB::table('guardian_student')->where('student_id', $studentId)->count();
            if ($remaining === 0) {
                Student::where('id', $studentId)->update(['guardian_id' => null]);
            } else {
                $nextPrimary = DB::table('guardian_student')->where('student_id', $studentId)->orderByDesc('is_primary')->value('guardian_id');
                Student::where('id', $studentId)->update(['guardian_id' => $nextPrimary]);
            }

            activity()
                ->withProperties(['school_id' => $guardian->school_id, 'guardian_id' => $guardian->id, 'student_id' => $studentId])
                ->log('Child unlinked from parent');
        }

        foreach ($toAttach as $i => $studentId) {
            $isFirstForChild = !DB::table('guardian_student')->where('student_id', $studentId)->exists();
            $guardian->children()->attach($studentId, [
                'relationship' => $guardian->relation,
                'is_primary'   => $isFirstForChild || $i === 0,
                'school_id'    => $guardian->school_id,
            ]);

            if (empty(Student::where('id', $studentId)->value('guardian_id'))) {
                Student::where('id', $studentId)->update(['guardian_id' => $guardian->id]);
            }

            activity()
                ->withProperties(['school_id' => $guardian->school_id, 'guardian_id' => $guardian->id, 'student_id' => $studentId])
                ->log('Child linked to parent');
        }
    }

    /**
     * Guard against duplicate identities: same school, matching email OR phone.
     */
    private function findDuplicate(int $schoolId, ?string $email, ?string $phone, ?int $ignoreId = null): ?Guardian
    {
        $query = Guardian::where('school_id', $schoolId);

        if ($ignoreId) {
            $query->where('id', '!=', $ignoreId);
        }

        return $query->where(function ($q) use ($email, $phone) {
            if (!empty($email)) {
                $q->orWhere('email', strtolower(trim($email)));
            }
            if (!empty($phone)) {
                $digits = preg_replace('/\D/', '', $phone) ?? '';
                if ($digits !== '') {
                    $q->orWhereRaw("regexp_replace(phone, '\\D', '', 'g') = ?", [$digits]);
                }
            }
        })->first();
    }

    /**
     * Link an existing user or create a portal account for this guardian.
     * Returns [message, tempPassword|null].
     */
    private function attachOrCreateAccount(Guardian $guardian, array $data): array
    {
        $existingUser = User::where('school_id', $guardian->school_id)
            ->where('email', $data['email'])
            ->first();

        if ($existingUser) {
            if (!$existingUser->hasRole('parent')) {
                $existingUser->assignRole('parent');
            }
            $guardian->update(['user_id' => $existingUser->id]);
            return ["Parent linked to existing user account ({$existingUser->getRoleNames()->implode(', ')}).", null];
        }

        $service = new UserCreationService($guardian->school_id, auth()->id());
        $result = $service->createUser([
            'name'  => $data['name'],
            'email' => $data['email'],
            'phone' => $data['phone'] ?? null,
        ], ['parent']);
        $guardian->update(['user_id' => $result['user']->id]);

        return [null, $result['temp_password']];
    }
}
