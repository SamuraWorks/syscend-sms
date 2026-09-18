<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('subjects', function (Blueprint $table) {
            $table->unsignedBigInteger('department_id')->nullable()->after('class_id')
                ->comment('SSS department: Science, Arts, Commercial');
            $table->string('school_level', 30)->nullable()->after('department_id')
                ->comment('Level this subject belongs to');
            $table->boolean('is_core')->default(true)->after('school_level')
                ->comment('Core subject or elective');
        });
    }

    public function down(): void
    {
        Schema::table('subjects', function (Blueprint $table) {
            $table->dropColumn(['department_id', 'school_level', 'is_core']);
        });
    }
};
