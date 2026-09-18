<?php

namespace App\Services;

use App\Models\{Guardian, Staff, Student, User, UserAuditLog};
use Illuminate\Support\Facades\{DB, Hash, Mail};
use Illuminate\Support\Str;

class UserCreationService
{
    private int $schoolId;
    private int $performedBy;

    public function __construct(int $schoolId, int $performedBy)
    {
        $this->schoolId = $schoolId;
        $this->performedBy = $performedBy;
    }

    /**
     * Create a user with temporary password (unified flow).
     *
     * Supports: student, parent, teacher, principal, school-admin, accountant,
     * librarian, driver, warden, store-manager, proprietor, and all other roles.
     *
     * @return array{user: User, temp_password: string, roles: array}
     */
    public function createUser(array $data, array $roles, ?string $customPassword = null): array
    {
        $tempPassword = $customPassword ?: PasswordGeneratorService::generate(12, true);

        $user = DB::transaction(function () use ($data, $roles, $tempPassword) {
            $user = User::create([
                'school_id'            => $this->schoolId,
                'name'                 => $data['name'],
                'email'                => $data['email'] ?? null,
                'username'             => $data['username'] ?? null,
                'phone'                => $data['phone'] ?? null,
                'phone_secondary'      => $data['phone_secondary'] ?? null,
                'password'             => Hash::make($tempPassword),
                'is_temporary_password'=> true,
                'must_change_password' => true,
                'status'               => 'active',
                'created_by'           => $this->performedBy,
            ]);

            // Assign roles
            if (!empty($roles)) {
                $user->syncRoles($roles);
            }

            return $user;
        });

        // Log the creation
        UserAuditLog::log(
            $this->schoolId,
            $user->id,
            $this->performedBy,
            'user_created',
            "User account created for {$user->name}",
            [
                'roles'           => $roles,
                'temp_generated'  => !$customPassword,
                'email_sent'      => false,
            ]
        );

        return [
            'user'         => $user,
            'temp_password'=> $tempPassword,
            'roles'        => $roles,
        ];
    }

    /**
     * Create a staff member with optional User account and roles.
     */
    public function createStaff(array $staffData, array $roles, ?string $password = null): array
    {
        return DB::transaction(function () use ($staffData, $roles, $password) {
            // Create User account
            $userResult = $this->createUser([
                'name'  => trim(($staffData['first_name'] ?? '') . ' ' . ($staffData['last_name'] ?? '')),
                'email' => $staffData['email'] ?? null,
                'username' => $staffData['username'] ?? null,
                'phone' => $staffData['phone'] ?? null,
            ], $roles, $password);

            // Create Staff record
            $staff = Staff::create(array_merge(
                collect($staffData)->only([
                    'first_name', 'last_name', 'gender', 'date_of_birth',
                    'blood_group', 'religion', 'nationality', 'phone', 'email',
                    'address', 'photo', 'department_id', 'designation_id',
                    'joining_date', 'salary_type', 'salary', 'status', 'notes',
                    'teacher_type',
                ])->toArray(),
                [
                    'school_id' => $this->schoolId,
                    'user_id'   => $userResult['user']->id,
                ]
            ));

            // Link form master if provided
            if (!empty($staffData['form_master_class_id'])) {
                $staff->update([
                    'form_master_class_id'  => $staffData['form_master_class_id'],
                    'form_master_section_id'=> $staffData['form_master_section_id'] ?? null,
                ]);
            }

            return array_merge($userResult, ['staff' => $staff]);
        });
    }

    /**
     * Create a student with optional User account.
     */
    public function createStudent(array $studentData, ?array $studentRoles = null, ?string $password = null): array
    {
        return DB::transaction(function () use ($studentData, $studentRoles, $password) {
            // Create guardian first
            $guardian = Guardian::create(array_merge(
                $studentData['guardian'] ?? [],
                ['school_id' => $this->schoolId]
            ));

            // Optionally create parent/guardian User account
            if (!empty($studentData['guardian']['email']) && !empty($studentData['create_parent_account'])) {
                $parentResult = $this->createUser([
                    'name'     => $studentData['guardian']['name'],
                    'email'    => $studentData['guardian']['email'],
                    'phone'    => $studentData['guardian']['phone'] ?? null,
                    'username' => $studentData['guardian']['username'] ?? null,
                ], ['parent'], $password);
                $guardian->update(['user_id' => $parentResult['user']->id]);
            }

            // Create student record
            $student = Student::create(array_merge(
                collect($studentData)->except(['guardian', 'guardian_email', 'create_parent_account', 'username'])->toArray(),
                [
                    'guardian_id' => $guardian->id,
                    'school_id'   => $this->schoolId,
                ]
            ));

            // Optionally create student User account
            $studentUser = null;
            if (!empty($studentRoles) && (!empty($studentData['email']) || !empty($studentData['create_student_account']))) {
                $studentUserResult = $this->createUser([
                    'name'     => trim($studentData['first_name'] . ' ' . ($studentData['last_name'] ?? '')),
                    'email'    => $studentData['email'] ?? null,
                    'username' => $studentData['username'] ?? null,
                    'phone'    => $studentData['phone'] ?? null,
                ], $studentRoles, $password);
                $student->update(['user_id' => $studentUserResult['user']->id]);
                $studentUser = $studentUserResult['user'];
            }

            return [
                'student'      => $student,
                'guardian'     => $guardian,
                'student_user' => $studentUser,
            ];
        });
    }

    /**
     * Send welcome email with credentials.
     */
    public function sendWelcomeEmail(User $user, string $tempPassword): bool
    {
        if (!$user->email) {
            return false;
        }

        try {
            $loginUrl = url('/login');
            $schoolName = \App\Models\School::where('id', $this->schoolId)->value('name') ?? config('app.name', 'Syscend Campus');

            Mail::raw(
                "Welcome to {$schoolName}\n\n" .
                "Hello {$user->name},\n\n" .
                "Your account has been created.\n\n" .
                "Login Details:\n" .
                "URL: {$loginUrl}\n" .
                ($user->username ? "Username: {$user->username}\n" : '') .
                "Email: {$user->email}\n" .
                "Temporary Password: {$tempPassword}\n\n" .
                "Please log in and change your password immediately.\n\n" .
                "Do not share this password with anyone.",
                function ($message) use ($user, $schoolName) {
                    $message->to($user->email)
                            ->subject("Welcome to {$schoolName} — Your Login Credentials");
                }
            );

            UserAuditLog::log(
                $this->schoolId,
                $user->id,
                $this->performedBy,
                'welcome_email_sent',
                "Welcome email sent to {$user->email}"
            );

            return true;
        } catch (\Throwable $e) {
            return false;
        }
    }

    /**
     * Reset a user's password to a new temporary one.
     */
    public function resetPassword(User $user, ?string $newPassword = null): string
    {
        $newPassword = $newPassword ?: PasswordGeneratorService::generate(12, true);

        $user->update([
            'password'              => Hash::make($newPassword),
            'is_temporary_password' => true,
            'must_change_password'  => true,
            'password_changed_at'   => null,
        ]);

        UserAuditLog::log(
            $this->schoolId,
            $user->id,
            $this->performedBy,
            'password_reset',
            "Password reset for {$user->name}"
        );

        return $newPassword;
    }

    /**
     * Mark password as changed (on first login).
     */
    public function markPasswordChanged(User $user): void
    {
        $user->update([
            'is_temporary_password'   => false,
            'must_change_password'    => false,
            'password_changed_at'     => now(),
            'last_password_change_at' => now(),
        ]);

        UserAuditLog::log(
            $this->schoolId,
            $user->id,
            $user->id,
            'password_changed',
            'Password changed by user'
        );
    }

    /**
     * Update user roles.
     */
    public function updateRoles(User $user, array $roles): void
    {
        $previousRoles = $user->getRoleNames()->toArray();

        $user->syncRoles($roles);

        UserAuditLog::log(
            $this->schoolId,
            $user->id,
            $this->performedBy,
            'roles_updated',
            "Roles changed from [{$user->name}]",
            ['previous_roles' => $previousRoles, 'new_roles' => $roles]
        );
    }

    /**
     * Generate a unique username from name.
     */
    public static function generateUsername(string $name): string
    {
        $base = strtolower(preg_replace('/[^a-zA-Z]/', '', $name));
        $base = substr($base, 0, 12);

        if (!User::where('username', $base)->exists()) {
            return $base;
        }

        for ($i = 1; $i <= 999; $i++) {
            $candidate = $base . $i;
            if (!User::where('username', $candidate)->exists()) {
                return $candidate;
            }
        }

        return $base . Str::random(4);
    }
}
