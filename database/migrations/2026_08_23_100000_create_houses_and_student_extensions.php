<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('houses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_id')->constrained()->cascadeOnDelete();
            $table->string('name', 100);
            $table->string('color', 20)->nullable();
            $table->foreignId('house_master_id')->nullable()->constrained('staff')->nullOnDelete();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->unique(['school_id', 'name']);
        });

        Schema::table('students', function (Blueprint $table) {
            $table->foreignId('house_id')->nullable()->after('section_id')->constrained()->nullOnDelete();
            $table->string('place_of_birth')->nullable()->after('nationality');
            $table->string('admission_type', 50)->nullable()->after('admission_date');
        });

        Schema::create('guardian_student', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_id')->constrained()->cascadeOnDelete();
            $table->foreignId('guardian_id')->constrained()->cascadeOnDelete();
            $table->foreignId('student_id')->constrained()->cascadeOnDelete();
            $table->string('relationship', 50)->nullable();
            $table->boolean('is_primary')->default(false);
            $table->timestamps();

            $table->unique(['guardian_id', 'student_id']);
            $table->index(['student_id']);
        });

        DB::statement(
            'INSERT INTO guardian_student (school_id, guardian_id, student_id, relationship, is_primary, created_at, updated_at)
             SELECT school_id, guardian_id, id, NULL, true, NOW(), NOW()
             FROM students WHERE guardian_id IS NOT NULL'
        );
    }

    public function down(): void
    {
        Schema::dropIfExists('guardian_student');
        Schema::table('students', function (Blueprint $table) {
            $table->dropConstrainedForeignId('house_id');
            $table->dropColumn(['place_of_birth', 'admission_type']);
        });
        Schema::dropIfExists('houses');
    }
};
