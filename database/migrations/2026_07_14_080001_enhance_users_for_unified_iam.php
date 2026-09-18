<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function ($table) {
            if (!Schema::hasColumn('users', 'username')) $table->string('username', 100)->nullable();
            if (!Schema::hasColumn('users', 'is_temporary_password')) $table->boolean('is_temporary_password')->default(false);
            if (!Schema::hasColumn('users', 'password_changed_at')) $table->timestamp('password_changed_at')->nullable();
            if (!Schema::hasColumn('users', 'created_by')) $table->unsignedBigInteger('created_by')->nullable();
            if (!Schema::hasColumn('users', 'phone_secondary')) $table->string('phone_secondary', 20)->nullable();
            if (!Schema::hasColumn('users', 'must_change_password')) $table->boolean('must_change_password')->default(true);
            if (!Schema::hasColumn('users', 'last_password_change_at')) $table->timestamp('last_password_change_at')->nullable();
        });

        Schema::table('students', function ($table) {
            if (!Schema::hasColumn('students', 'user_id')) $table->unsignedBigInteger('user_id')->nullable();
        });

        Schema::table('staff', function ($table) {
            if (!Schema::hasColumn('staff', 'user_id')) $table->unsignedBigInteger('user_id')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('users', function ($table) {
            if (Schema::hasColumn('users', 'username')) $table->dropColumn('username');
            if (Schema::hasColumn('users', 'is_temporary_password')) $table->dropColumn('is_temporary_password');
            if (Schema::hasColumn('users', 'password_changed_at')) $table->dropColumn('password_changed_at');
            if (Schema::hasColumn('users', 'created_by')) $table->dropColumn('created_by');
            if (Schema::hasColumn('users', 'phone_secondary')) $table->dropColumn('phone_secondary');
            if (Schema::hasColumn('users', 'must_change_password')) $table->dropColumn('must_change_password');
            if (Schema::hasColumn('users', 'last_password_change_at')) $table->dropColumn('last_password_change_at');
        });
    }
};
