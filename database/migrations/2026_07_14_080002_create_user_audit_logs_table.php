<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $exists = DB::select("SELECT 1 FROM pg_tables WHERE tablename='user_audit_logs'");
        if (empty($exists)) {
            DB::statement('
                CREATE TABLE user_audit_logs (
                    id BIGSERIAL PRIMARY KEY,
                    school_id INTEGER NOT NULL,
                    user_id INTEGER NULL,
                    performed_by INTEGER NULL,
                    action VARCHAR(50) NOT NULL,
                    subject_type VARCHAR(100) NULL,
                    subject_id INTEGER NULL,
                    description TEXT NULL,
                    metadata JSONB NULL,
                    ip_address VARCHAR(45) NULL,
                    user_agent TEXT NULL,
                    created_at TIMESTAMP NULL,
                    updated_at TIMESTAMP NULL
                )
            ');
            DB::statement('CREATE INDEX IF NOT EXISTS idx_user_audit_logs_school ON user_audit_logs(school_id)');
            DB::statement('CREATE INDEX IF NOT EXISTS idx_user_audit_logs_user ON user_audit_logs(user_id)');
            DB::statement('CREATE INDEX IF NOT EXISTS idx_user_audit_logs_action ON user_audit_logs(action)');
        }
    }

    public function down(): void
    {
        DB::statement('DROP TABLE IF EXISTS user_audit_logs CASCADE');
    }
};
