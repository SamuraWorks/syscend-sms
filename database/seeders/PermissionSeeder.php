<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class PermissionSeeder extends Seeder
{
    public function run(): void
    {
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        $permissions = [
            // Student Management
            'view-students', 'create-students', 'edit-students', 'delete-students',
            // Staff Management
            'view-staff', 'create-staff', 'edit-staff', 'delete-staff',
            // Fee Management
            'view-fees', 'create-fees', 'edit-fees', 'delete-fees', 'collect-fees',
            // Exam & Results
            'view-exams', 'create-exams', 'edit-exams', 'delete-exams',
            'view-results', 'edit-results', 'publish-results', 'approve-result-changes',
            // Attendance
            'view-attendance', 'take-attendance', 'approve-attendance',
            // Homework
            'view-homework', 'create-homework', 'edit-homework', 'delete-homework',
            // Communication
            'view-announcements', 'create-announcements', 'delete-announcements',
            'send-messages', 'send-blasts',
            // Library
            'view-library', 'manage-library',
            // Inventory & Assets
            'view-inventory', 'manage-inventory', 'manage-assets',
            // Transport
            'view-transport', 'manage-transport',
            // Hostel
            'view-hostel', 'manage-hostel',
            // Reports
            'view-reports', 'export-reports', 'view-audit-log',
            // Settings
            'view-settings', 'manage-settings', 'manage-integrations', 'manage-users',
            // Payroll
            'view-payroll', 'manage-payroll',
            // Report Cards
            'view-report-cards', 'generate-report-cards', 'publish-report-cards',
            // National Exams
            'view-national-exams', 'manage-national-exams',
            // Performance Intelligence
            'view-performance', 'manage-performance',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission, 'guard_name' => 'web']);
        }

        $rolePermissions = [
            'super-admin' => $permissions,

            // school-admin receives its granular dot-notation permissions via
            // RolePermissionSeeder.  The flat permissions here are intentionally
            // scoped to school-level operations only (NOT identical to super-admin).
            'school-admin' => [
                'view-students', 'create-students', 'edit-students', 'delete-students',
                'view-staff', 'create-staff', 'edit-staff', 'delete-staff',
                'view-fees', 'create-fees', 'edit-fees', 'delete-fees', 'collect-fees',
                'view-exams', 'create-exams', 'edit-exams', 'delete-exams',
                'view-results', 'edit-results', 'publish-results', 'approve-result-changes',
                'view-attendance', 'take-attendance', 'approve-attendance',
                'view-homework', 'create-homework', 'edit-homework', 'delete-homework',
                'view-announcements', 'create-announcements', 'delete-announcements',
                'send-messages', 'send-blasts',
                'view-library', 'manage-library',
                'view-inventory', 'manage-inventory', 'manage-assets',
                'view-transport', 'manage-transport',
                'view-hostel', 'manage-hostel',
                'view-reports', 'export-reports', 'view-audit-log',
                'view-settings', 'manage-settings', 'manage-users',
                'view-payroll', 'manage-payroll',
                'view-report-cards', 'generate-report-cards', 'publish-report-cards',
                'view-performance', 'manage-performance',
            ],

            'principal' => [
                'view-students', 'create-students', 'edit-students',
                'view-staff', 'create-staff', 'edit-staff',
                'view-fees', 'create-fees', 'edit-fees', 'collect-fees',
                'view-exams', 'create-exams', 'edit-exams', 'publish-results', 'approve-result-changes',
                'view-attendance', 'take-attendance', 'approve-attendance',
                'view-homework', 'create-homework', 'edit-homework',
                'view-announcements', 'create-announcements', 'send-messages',
                'view-reports', 'export-reports', 'view-audit-log',
                'view-settings',
                'view-payroll',
                'view-report-cards', 'generate-report-cards', 'publish-report-cards',
                'view-national-exams', 'manage-national-exams',
                'view-performance', 'manage-performance',
                'view-library', 'view-transport', 'view-hostel', 'view-inventory',
            ],

            'teacher' => [
                'view-students', 'view-staff',
                'view-exams', 'view-results',
                'view-attendance', 'take-attendance',
                'view-homework', 'create-homework', 'edit-homework',
                'view-announcements', 'send-messages',
                'view-performance',
                'view-library',
            ],

            'accountant' => [
                'view-students',
                'view-fees', 'create-fees', 'edit-fees', 'collect-fees', 'delete-fees',
                'view-reports', 'export-reports',
                'view-payroll', 'manage-payroll',
                'view-staff',
            ],

            'librarian' => [
                'view-students',
                'view-library', 'manage-library',
                'view-announcements',
            ],

            'receptionist' => [
                'view-students', 'create-students', 'edit-students',
                'view-staff',
                'view-announcements', 'send-messages',
                'view-attendance',
            ],

            'proprietor' => [
                'view-students', 'view-staff', 'view-fees', 'view-reports',
                'export-reports', 'view-audit-log', 'view-performance',
                'view-settings',
            ],

            'student' => [
                'view-homework', 'view-announcements', 'view-performance',
            ],

            'parent' => [
                'view-students', 'view-fees', 'view-homework',
                'view-announcements', 'view-performance',
            ],
        ];

        foreach ($rolePermissions as $roleName => $perms) {
            $role = Role::firstOrCreate(['name' => $roleName, 'guard_name' => 'web']);
            $role->syncPermissions($perms);
        }
    }
}
