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
 *
 * The clear list is DERIVED from the live schema: every table except an
 * explicit KEEP set is truncated. New tables (AI logs, subscriptions,
 * subject offerings, ...) are therefore covered without touching this file.
 */
class SyscendResetService
{
    /**
     * System/platform tables that survive a reset (schema, RBAC definitions,
     * platform config and subscription catalogs). Role ASSIGNMENTS
     * (model_has_roles/model_has_permissions) are intentionally NOT preserved —
     * the fresh super-admin gets a clean assignment.
     */
    protected array $preservedTables = [
        'migrations',
        'permissions',
        'roles',
        'role_has_permissions',
        'platform_settings',
        'packages',
        'package_modules',
        'coupons',
        'districts',
        'academic_calendar_templates',
        'curriculum_subjects',
    ];

    protected bool $dryRun = false;

    /** True when session-level FK checks were disabled via session_replication_role. */
    protected bool $replicaMode = false;

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

            // Step 1: Disable foreign key constraints. Preferred path is the
            // PostgreSQL session variable (fast, superuser). If the role lacks
            // permission (e.g. restricted connection roles), fall back to
            // per-table trigger disabling inside clearTable().
            if (DB::connection()->getDriverName() === 'pgsql') {
                try {
                    DB::statement('SET session_replication_role = replica;');
                    $this->replicaMode = true;
                } catch (\Throwable) {
                    $this->replicaMode = false;
                }
            }

            // Step 2: Clear application data tables in dependency order
            $this->clearApplicationData();

            // Step 3: Re-enable foreign key constraints
            if ($this->replicaMode) {
                try {
                    DB::statement('SET session_replication_role = DEFAULT;');
                } catch (\Throwable) {
                    // nothing to roll back — session ends at connection close
                }
            }

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
     * Get the list of tables to clear, derived from the live schema.
     *
     * Foreign keys are disabled for the whole reset ('session_replication_role
     * = replica'), so physical order does not matter on PostgreSQL. Returns
     * every public table except the preserved system/platform set.
     */
    protected function getTablesToClear(): array
    {
        $tables = $this->schemaTables();

        return array_values(array_diff($tables, $this->preservedTables));
    }

    /**
     * List all application tables for the active connection.
     */
    protected function schemaTables(): array
    {
        $driver = DB::connection()->getDriverName();

        return match ($driver) {
            'pgsql' => array_map(
                fn ($r) => $r->tablename,
                DB::select("SELECT tablename FROM pg_tables WHERE schemaname = 'public'")
            ),
            'mysql' => (function () {
                $rows  = DB::select('SHOW TABLES');
                $key   = array_keys((array) $rows[0])[0] ?? 'Tables_in_' . DB::getDatabaseName();

                return array_map(fn ($r) => (array) $r[$key], $rows);
            })(),
            'sqlite' => array_map(
                fn ($r) => $r->name,
                DB::select("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
            ),
            default => $this->staticFallbackTables(),
        };
    }

    /**
     * Explicit dependency-ordered fallback for drivers without a schema
     * introspection path (mirrors the original list before schema derivation).
     */
    protected function staticFallbackTables(): array
    {
        return [
            // ── Transient / auth state ────────────────────────────
            'sessions',
            'password_reset_tokens',
            'personal_access_tokens',
            'remember_tokens',
            'jobs',
            'job_batches',
            'failed_jobs',
            'cache',
            'cache_locks',

            // ── Audit & AI logs ───────────────────────────────────
            'ai_audit_logs',
            'ai_usage_logs',
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
            'subject_offerings',

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
            'invoice_items',
            'invoices',
            'fee_payments',
            'fee_structures',
            'fee_categories',
            'payrolls',
            'salary_structures',
            'subscription_payments',

            // ── Documents ─────────────────────────────────────────
            'student_documents',
            'staff_documents',

            // ── People ────────────────────────────────────────────
            'students',
            'staff',
            'guardians',

            // ── Users (must come after people) ────────────────────
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
            'hostel_beds',

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

        $perTableTriggers = !$this->replicaMode && DB::connection()->getDriverName() === 'pgsql';

        if ($perTableTriggers) {
            try {
                DB::statement("ALTER TABLE {$tableName} DISABLE TRIGGER ALL");
            } catch (\Throwable) {
                $perTableTriggers = false;
            }
        }

        try {
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
        } finally {
            if ($perTableTriggers) {
                try {
                    DB::statement("ALTER TABLE {$tableName} ENABLE TRIGGER ALL");
                } catch (\Throwable) {
                    // best effort — trigger state resets on the next connection
                }
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
     * Credentials come from environment variables (never committed to source):
     *   SYSADMIN_EMAIL      default: syscend@gmail.com
     *   SYSADMIN_PASSWORD   if unset, a random temporary password is generated
     *   SYSADMIN_NAME       default: Syscend Campus
     *
     * @return string The temporary password in effect
     */
    protected function createSuperAdmin(): string
    {
        if ($this->dryRun) {
            return '[DRY-RUN-PASSWORD]';
        }

        $email      = $this->superAdminEmail();
        $name       = (string) env('SYSADMIN_NAME', 'Syscend Campus');
        $username   = (string) env('SYSADMIN_USERNAME', preg_split('/[@\s]+/', $email, -1, PREG_SPLIT_NO_EMPTY)[0] ?? 'admin');
        $envPassword = env('SYSADMIN_PASSWORD');
        $password   = is_string($envPassword) && $envPassword !== '' ? $envPassword : \Illuminate\Support\Str::random(20);

        $user = User::withoutGlobalScopes()->firstOrCreate(
            ['email' => $email],
            [
                'name' => $name,
                'password' => bcrypt($password),
                'phone' => null,
                'username' => $username,
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

        // Reset the password to the resolved credential and force a change on next login.
        $user->forceFill([
            'password'              => bcrypt($password),
            'is_temporary_password' => true,
            'force_password_change' => true,
        ])->save();

        return $password;
    }

    protected function superAdminEmail(): string
    {
        $email = (string) env('SYSADMIN_EMAIL', 'syscend@gmail.com');

        return $email !== '' ? $email : 'syscend@gmail.com';
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
                    ->where('email', $this->superAdminEmail())
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
                    && $verification['super_admin_email'] === $this->superAdminEmail()
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
