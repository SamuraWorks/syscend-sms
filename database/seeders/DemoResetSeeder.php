<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class DemoResetSeeder extends Seeder
{
    protected array $protectedEmails = ['syscend@gmail.com'];

    public function run(): void
    {
        $this->command->info('Resetting platform — removing all demo/operational data...');

        DB::statement('SET session_replication_role = replica;');

        $tables = $this->getCleanupTables();
        foreach ($tables as $table) {
            if (Schema::hasTable($table)) {
                DB::table($table)->delete();
                $this->command->line("  Cleared: {$table}");
            }
        }

        DB::statement('SET session_replication_role = DEFAULT;');

        User::withoutGlobalScopes()
            ->whereNotIn('email', $this->protectedEmails)
            ->forceDelete();

        $this->command->info('Platform reset complete.');
    }

    private function getCleanupTables(): array
    {
        return [
            'activity_log', 'user_audit_logs', 'audit_logs',

            'report_cards', 'result_approval_logs', 'result_change_requests',
            'assessment_components', 'school_assessment_configs',
            'exam_assessment_links', 'assessment_types',

            'marks', 'exams', 'national_examinations',

            'attendance_corrections', 'attendances', 'attendance_sessions',

            'timetables', 'lessons', 'homework_submissions', 'homework',
            'syllabi', 'online_classes', 'lesson_plans',

            'fee_payments', 'fee_structures', 'fee_categories',
            'payrolls', 'salary_structures',

            'student_documents', 'staff_documents',
            'students', 'staff', 'guardians',

            'users',

            'subjects', 'sections', 'classes', 'academic_terms', 'academic_years',

            'designations', 'departments',

            'announcements', 'messages', 'school_notifications',
            'email_templates', 'notification_templates',

            'book_reservations', 'book_issues', 'books',

            'student_routes', 'transport_routes', 'vehicles',

            'hostel_allocations', 'hostel_rooms', 'hostels',

            'inventory_issues', 'maintenance_logs', 'assets', 'inventory_purchases', 'inventory_items', 'inventory_categories',

            'visitor_logs', 'admission_inquiries', 'inquiry_followups',

            'document_imports',

            'schedule_periods', 'schedule_event_types', 'school_time_settings',
            'holidays', 'shifts',

            'school_settings',

            'leave_requests', 'leave_types',

            'student_behaviors', 'success_scores', 'interventions', 'intervention_notes',
            'student_alerts', 'student_goals', 'student_achievements', 'student_performance_snapshots',

            'school_inspections', 'ministry_announcements',
            'national_student_registry', 'national_teacher_registry',
            'school_data_syncs', 'ministry_downloads',

            'school_subscriptions', 'school_modules', 'coupons', 'package_modules', 'packages',

            'demo_requests',

            'districts',

            'schools',
        ];
    }
}
