<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('students', function (Blueprint $table) {
            // Student IDs are unique WITHIN a school (multi-tenant scope).
            // NULLs are allowed multiple times in Postgres unique indexes,
            // so optional identifiers stay optional.
            $table->unique(['school_id', 'admission_no'], 'students_school_admission_no_unique');
            $table->unique(['school_id', 'student_id'], 'students_school_student_id_unique');
        });
    }

    public function down(): void
    {
        Schema::table('students', function (Blueprint $table) {
            $table->dropUnique('students_school_admission_no_unique');
            $table->dropUnique('students_school_student_id_unique');
        });
    }
};
