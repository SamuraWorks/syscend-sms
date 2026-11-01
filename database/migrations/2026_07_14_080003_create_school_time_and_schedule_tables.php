<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // School Time Settings
        $exists = DB::select("SELECT 1 FROM pg_tables WHERE tablename='school_time_settings'");
        if (empty($exists)) {
            DB::statement('
                CREATE TABLE school_time_settings (
                    id BIGSERIAL PRIMARY KEY,
                    school_id INTEGER NOT NULL,
                    academic_year_id INTEGER NULL,
                    opening_time TIME NOT NULL DEFAULT \'07:30\',
                    closing_time TIME NOT NULL DEFAULT \'15:00\',
                    working_days VARCHAR(200) NOT NULL DEFAULT \'monday,tuesday,wednesday,thursday,friday\',
                    timezone VARCHAR(50) NOT NULL DEFAULT \'Africa/Freetown\',
                    clock_format VARCHAR(10) NOT NULL DEFAULT \'12h\',
                    day_start TIME NOT NULL DEFAULT \'07:30\',
                    day_end TIME NOT NULL DEFAULT \'15:00\',
                    is_active BOOLEAN DEFAULT TRUE,
                    created_at TIMESTAMP NULL,
                    updated_at TIMESTAMP NULL,
                    UNIQUE(school_id, academic_year_id)
                )
            ');
        }

        // Schedule Event Types
        $exists2 = DB::select("SELECT 1 FROM pg_tables WHERE tablename='schedule_event_types'");
        if (empty($exists2)) {
            DB::statement('
                CREATE TABLE schedule_event_types (
                    id BIGSERIAL PRIMARY KEY,
                    school_id INTEGER NOT NULL,
                    name VARCHAR(100) NOT NULL,
                    slug VARCHAR(100) NOT NULL,
                    color VARCHAR(20) NOT NULL DEFAULT \'#6366f1\',
                    icon VARCHAR(50) NULL,
                    is_instructional BOOLEAN DEFAULT TRUE,
                    attendance_required BOOLEAN DEFAULT FALSE,
                    is_active BOOLEAN DEFAULT TRUE,
                    sort_order INTEGER NOT NULL DEFAULT 0,
                    created_at TIMESTAMP NULL,
                    updated_at TIMESTAMP NULL
                )
            ');
            DB::statement('CREATE UNIQUE INDEX IF NOT EXISTS idx_schedule_event_types_slug ON schedule_event_types(school_id, slug)');
        }

        // Schedule Periods (configurable time slots)
        $exists3 = DB::select("SELECT 1 FROM pg_tables WHERE tablename='schedule_periods'");
        if (empty($exists3)) {
            DB::statement('
                CREATE TABLE schedule_periods (
                    id BIGSERIAL PRIMARY KEY,
                    school_id INTEGER NOT NULL,
                    academic_year_id INTEGER NULL,
                    name VARCHAR(100) NOT NULL,
                    event_type_id INTEGER NULL,
                    period_number INTEGER NULL,
                    start_time TIME NOT NULL,
                    end_time TIME NOT NULL,
                    duration_minutes INTEGER NULL,
                    is_break BOOLEAN DEFAULT FALSE,
                    is_active BOOLEAN DEFAULT TRUE,
                    sort_order INTEGER NOT NULL DEFAULT 0,
                    created_at TIMESTAMP NULL,
                    updated_at TIMESTAMP NULL
                )
            ');
            DB::statement('CREATE INDEX IF NOT EXISTS idx_schedule_periods_school ON schedule_periods(school_id)');
        }
    }

    public function down(): void
    {
        DB::statement('DROP TABLE IF EXISTS schedule_periods CASCADE');
        DB::statement('DROP TABLE IF EXISTS schedule_event_types CASCADE');
        DB::statement('DROP TABLE IF EXISTS school_time_settings CASCADE');
    }
};
