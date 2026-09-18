<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use App\Models\User;
use App\Models\School;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class CleanDatabaseSeeder extends Seeder
{
    use \Illuminate\Database\Console\Seeds\WithoutModelEvents;

    public function run(): void
    {
        // Disable triggers for FK constraints (PostgreSQL)
        DB::statement('SET session_replication_role = replica');

        $this->command->info('=== PHASE 1: Wiping all data ===');

        $tables = [
            'model_has_permissions', 'role_has_permissions', 'model_has_roles',
            'user_audit_logs', 'student_documents', 'students', 'staff',
            'guardians', 'fee_payments', 'fee_structures', 'fee_categories',
            'marks', 'exams', 'attendance_records', 'report_cards',
            'homework', 'homework_submissions', 'announcements', 'messages',
            'timetables', 'library_books', 'library_transactions',
            'transport_vehicles', 'transport_routes', 'transport_allocations',
            'hostels', 'hostel_rooms', 'hostel_allocations',
            'inventory_items', 'inventory_transactions',
            'payroll_records', 'leaves', 'leave_types',
            'departments', 'designations', 'school_settings',
            'academic_years', 'academic_terms', 'school_classes',
            'sections', 'subjects', 'shifts', 'holidays',
            'school_inspections', 'school_data_syncs',
            'national_student_registries', 'national_teacher_registries',
            'platform_settings', 'school_branding_assets',
            'performance_interventions', 'performance_goals',
            'performance_behaviours', 'performance_alerts',
            'result_change_requests', 'result_approvals', 'result_imports',
            'assessment_configs', 'assessment_components',
            'school_time_settings', 'schedule_periods', 'schedule_event_types',
            'consolidated_reports', 'lesson_plans', 'syllabi',
            'online_classes', 'student_transfers', 'student_promotions',
            'demo_requests',
            'subscription_payments', 'school_subscriptions', 'packages', 'package_modules',
            'coupons',
        ];

        foreach ($tables as $table) {
            if (DB::getSchemaBuilder()->hasTable($table)) {
                DB::table($table)->truncate();
            }
        }
        $this->command->info('  Truncated all related tables');

        // Delete all users
        User::withTrashed()->forceDelete();
        $this->command->info('  Deleted all users');

        // Delete all schools
        School::withTrashed()->forceDelete();
        $this->command->info('  Deleted all schools');

        // Delete all permissions and roles
        DB::table('permissions')->truncate();
        DB::table('roles')->truncate();
        $this->command->info('  Deleted all roles and permissions');

        // Re-enable triggers
        DB::statement('SET session_replication_role = DEFAULT');

        $this->command->info('=== PHASE 2: Re-seeding roles & permissions ===');
        $this->call([
            PermissionSeeder::class,
            RolePermissionSeeder::class,
        ]);

        $this->command->info('=== PHASE 3: Creating super-admin ===');
        $superAdmin = User::create([
            'name'                  => 'Super Admin',
            'email'                 => 'syscend@gmail.com',
            'password'              => Hash::make('Syscend@123'),
            'status'                => 'active',
            'is_temporary_password' => true,
            'must_change_password'  => true,
            'force_password_change' => false,
        ]);
        $superAdmin->assignRole('super-admin');
        $this->command->info('  Created super-admin: syscend@gmail.com / Syscend@123');

        $this->command->info('=== PHASE 4: Verification ===');
        $this->command->info('Users: ' . User::count());
        foreach (User::with('roles')->get() as $u) {
            $this->command->info("  {$u->name} ({$u->email}) Roles:[" . $u->roles->pluck('name')->implode(',') . "]");
        }
        $this->command->info('Roles:');
        foreach (Role::withCount('users')->orderBy('name')->get() as $r) {
            $this->command->info("  {$r->name} ({$r->users_count} users)");
        }
        $this->command->info('Permissions: ' . Permission::count());
        $this->command->info('Schools: ' . School::count());
        $this->command->info('Done. Database is clean.');
    }
}
