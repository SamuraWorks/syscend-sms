<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('audit_logs', function (Blueprint $table) {
            $table->dropForeign(['school_id']);
        });
        DB::statement('ALTER TABLE audit_logs ALTER COLUMN school_id DROP NOT NULL');
    }

    public function down(): void
    {
        DB::statement('UPDATE audit_logs SET school_id = 0 WHERE school_id IS NULL');
        DB::statement('ALTER TABLE audit_logs ALTER COLUMN school_id SET NOT NULL');
        Schema::table('audit_logs', function (Blueprint $table) {
            $table->foreign('school_id')->references('id')->on('schools');
        });
    }
};
