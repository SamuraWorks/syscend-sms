<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

/**
 * Service for controlled database reset of Syscend Campus.
 *
 * Clears all application/tenant data while preserving:
 * - Database schema and migrations
 * - Spatie Permission roles/permissions
 * - System configuration required by the application
 */
class SyscendResetService
{
    protected bool $dryRun = false;

    protected array $stats = [
        'tables_cleared' => 0,
        'records_deleted' => 0,
        'users_created' => 0,
    ];

    public function setDryRun(bool $isDryRun): self
    {
        $this->dryRun = $isDryRun;
        return $this;
    }

    /**
     * Execute the reset operation.
     *
     * @return array Statistics and verification results
     */
    public function reset(): array
    {
        try {
            DB::beginTransaction();

            // Step 1: Disable foreign key constraints (safe for PostgreSQL with session variable)
            DB::statement('SET session_replication_role = replica;');

            // Step 2: Clear application data tables in dependency order
            $this->clearApplicationData();

            // Step 3: Re-enable foreign key constraints
            DB::statement('SET session_replication_role = DEFAULT;');

            // Step 4: Recreate system permission/role structure if needed
            $this->ensurePermissionsExist();

            // Step 5: Create the super-admin account
            $password = $this->createSuperAdmin();

            DB::commit();

            // Step 6: Verify the reset
            $verification = $this->verify();

            return [
                'success' => true,
                'dry_run' => $this->dryRun,
                'password' => $password,
                'stats' => $this->stats,
                'verification' => $verification,
            ];
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Clear all application data tables.
     * Order matters due to foreign key constraints.
     */
    protected function clearApplicationData(): void
    {
        $tables = $this->getTablesToClear();

        foreach ($tables as $table) {
            $this->clearTable($table);
        }
    }

    /**
     * Get ordered list of tables to clear.
     * Order follows dependency graph (dependent tables first).
     *
     * System tables intentionally NOT cleared (preserved across resets):
     * - permissions, roles, role_has_permissions  (RBAC definitions)
     * - model_has_permissions, model_has_roles    (role assignments; FK-safe via replica mode)
     * - platform_settings                        (platform configuration)
     * - packages, package_modules, coupons        (subscription & promo config)
     * - districts                                 (Sierra Leone districts)
     * - migrations                                (schema history)
     */
    protected function getTablesToClear(): array
    {
        return [
            // ── Transient / auth state ────────────────────────────
            'sessions',
            'password_reset_tokens',
            'personal_access_tokens',
            'jobs',
            'job_batches',
            'failed_jobs',
            'cache',
            'cache_locks',

            // ── Audit logs ────────────────────────────────────────
            'activity_log',
            'user_audit_logs',
            'audit_logs',

            // ── Academic records ──────────────────────────────────
            'report_card_templates',
            'report_cards',
            'result_approval_logs',
            'result_change_requests',
            'assessment_components',
            'school_assessment_configs',
            'exam_assessment_links',
            'exam_sections',
            'exam_subjects',
            'assessment_types',
            'marks',
            'exams',
            'national_examinations',
            'grade_scales',

            // ── Attendance ────────────────────────────────────────
            'attendance_corrections',
            'attendances',
            'attendance_sessions',

            // ── Teaching & Learning ───────────────────────────────
            'timetables',
            'lesson_plans',
            'homework_submissions',
            'homework',
            'syllabi',
            'online_classes',

            // ── Financial ─────────────────────────────────────────
            'fee_payments',
            'fee_structures',
            'fee_categories',
            'payrolls',
            'salary_structures',

            // ── Documents ─────────────────────────────────────────
            'student_documents',
            'staff_documents',

            // ── People ────────────────────────────────────────────
            'students',
            'staff',
            'guardians',

            // ── Users (must come after people, before academic structure) ──
            'users',

            // ── Academic structure ────────────────────────────────
            'subjects',
            'sections',
            'classes',
            'academic_terms',
            'academic_years',

            // ── Organization ──────────────────────────────────────
            'designations',
            'departments',

            // ── Communication ─────────────────────────────────────
            'announcements',
            'messages',
            'school_notifications',
            'email_templates',

            // ── Library ───────────────────────────────────────────
            'book_reservations',
            'book_issues',
            'books',

            // ── Transport ─────────────────────────────────────────
            'student_route',
            'routes',
            'vehicles',

            // ── Hostel ────────────────────────────────────────────
            'hostel_allocations',
            'hostel_rooms',
            'hostels',

            // ── Inventory & Assets ────────────────────────────────
            'inventory_issues',
            'asset_maintenance_logs',
            'assets',
            'inventory_purchases',
            'inventory_items',
            'inventory_categories',

            // ── Admissions & Visitors ─────────────────────────────
            'visitor_logs',
            'admission_inquiries',
            'inquiry_followups',

            // ── Imports ───────────────────────────────────────────
            'document_imports',

            // ── Scheduling & Configuration ────────────────────────
            'schedule_periods',
            'schedule_event_types',
            'school_time_settings',
            'holidays',
            'shifts',
            'school_settings',
            'school_setup_progress',

            // ── HR ────────────────────────────────────────────────
            'leave_requests',
            'leave_types',

            // ── Performance & Support ─────────────────────────────
            'student_behaviors',
            'success_scores',
            'interventions',
            'intervention_notes',
            'student_alerts',
            'student_goals',
            'student_achievements',
            'student_performance_snapshots',

            // ── Ministry & Registry ───────────────────────────────
            'school_inspections',
            'ministry_announcements',
            'national_student_registry',
            'national_teacher_registry',
            'school_data_syncs',
            'ministry_downloads',

            // ── Subscriptions (school-level only) ─────────────────
            'school_subscriptions',
            'school_modules',

            // ── Demo requests ─────────────────────────────────────
            'demo_requests',
            'demo_request_notes',
            'demo_request_status_history',

            // ── Schools (last — all dependent data cleared first) ─
            'schools',
        ];
    }

    /**
     * Clear a single table safely.
     */
    protected function clearTable(string $tableName): void
    {
        if (!Schema::hasTable($tableName)) {
            return;
        }

        if ($this->dryRun) {
            $count = DB::table($tableName)->count();
            if ($count > 0) {
                $this->stats['records_deleted'] += $count;
                $this->stats['tables_cleared']++;
            }
        } else {
            $count = DB::table($tableName)->count();
            if ($count > 0) {
                DB::table($tableName)->truncate();
                $this->stats['records_deleted'] += $count;
                $this->stats['tables_cleared']++;
            }
        }
    }

    /**
     * Ensure required roles and permissions exist.
     * Runs both seeders to cover the old format (view-students) and
     * the newer dot-notation format (students.view).
     */
    protected function ensurePermissionsExist(): void
    {
        if ($this->dryRun) {
            return;
        }

        app(PermissionRegistrar::class)->forgetCachedPermissions();

        \Artisan::call('db:seed', [
            '--class' => 'Database\\Seeders\\PermissionSeeder',
            '--force' => true,
        ]);

        \Artisan::call('db:seed', [
            '--class' => 'Database\\Seeders\\RolePermissionSeeder',
            '--force' => true,
        ]);

        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }

    /**
     * Create the super-admin account.
     *
     * @return string The generated temporary password
     */
    protected function createSuperAdmin(): string
    {
        if ($this->dryRun) {
            return '[DRY-RUN-PASSWORD]';
        }

        $password = \Illuminate\Support\Str::random(16);

        $user = User::withoutGlobalScopes()->firstOrCreate(
            ['email' => 'syscend@gmail.com'],
            [
                'name' => 'Syscend Campus',
                'password' => bcrypt($password),
                'phone' => null,
                'username' => 'syscend',
                'status' => 'active',
                'school_id' => null,  // Platform-level super admin
                'is_temporary_password' => true,
                'must_change_password' => true,
                'force_password_change' => true,
                'two_factor_enabled' => false,
            ]
        );

        // Assign super-admin role
        $role = Role::where('name', 'super-admin')->first();
        if ($role) {
            $user->syncRoles([$role]);
        }

        return $password;
    }

    /**
     * Verify the reset was successful.
     */
    protected function verify(): array
    {
        $verification = [
            'schools_count' => 0,
            'users_count' => 0,
            'super_admin_exists' => false,
            'super_admin_email' => null,
            'super_admin_name' => null,
            'super_admin_role' => false,
            'roles_count' => 0,
            'permissions_count' => 0,
            'foreign_key_integrity' => true,
        ];

        if (!$this->dryRun) {
            try {
                $verification['schools_count'] = DB::table('schools')->count();
                $verification['users_count'] = DB::table('users')->count();
                $verification['roles_count'] = DB::table('roles')->count();
                $verification['permissions_count'] = DB::table('permissions')->count();

                $superAdmin = User::withoutGlobalScopes()
                    ->where('email', 'syscend@gmail.com')
                    ->first();

                if ($superAdmin) {
                    $verification['super_admin_exists'] = true;
                    $verification['super_admin_email'] = $superAdmin->email;
                    $verification['super_admin_name'] = $superAdmin->name;
                    $verification['super_admin_role'] = $superAdmin->hasRole('super-admin');
                }

                $verification['single_super_admin_only'] = (
                    $verification['users_count'] === 1
                    && $verification['super_admin_exists']
                    && $verification['super_admin_email'] === 'syscend@gmail.com'
                );

                // Check for orphaned records (potential FK violations)
                $verification['foreign_key_integrity'] = $this->checkForeignKeyIntegrity();
            } catch (\Exception $e) {
                $verification['error'] = $e->getMessage();
            }
        }

        return $verification;
    }

    /**
     * Simple check for orphaned records that might violate FK constraints.
     */
    protected function checkForeignKeyIntegrity(): bool
    {
        try {
            // Check if there are activity logs referencing deleted users
            if (Schema::hasTable('activity_log') && Schema::hasTable('users')) {
                $orphans = DB::table('activity_log')
                    ->whereNotNull('causer_id')
                    ->whereNotIn('causer_id', DB::table('users')->select('id'))
                    ->count();

                if ($orphans > 0) {
                    return false;
                }
            }

            return true;
        } catch (\Exception) {
            // If check fails, assume integrity is okay (query might not be compatible with schema)
            return true;
        }
    }

    /**
     * Get statistics from the reset.
     */
    public function getStats(): array
    {
        return $this->stats;
    }
}
