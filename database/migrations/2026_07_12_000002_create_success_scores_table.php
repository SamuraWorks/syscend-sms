<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('success_scores', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('school_id')->index();
            $table->unsignedBigInteger('student_id')->index();
            $table->unsignedBigInteger('academic_year_id')->index();
            $table->unsignedBigInteger('term_id')->nullable()->index();
            $table->unsignedBigInteger('class_id')->nullable()->index();
            $table->decimal('academic_score', 6, 2)->default(0)->comment('0-50 weight');
            $table->decimal('attendance_score', 6, 2)->default(0)->comment('0-20 weight');
            $table->decimal('homework_score', 6, 2)->default(0)->comment('0-10 weight');
            $table->decimal('behavior_score', 6, 2)->default(0)->comment('0-10 weight');
            $table->decimal('participation_score', 6, 2)->default(0)->comment('0-10 weight');
            $table->decimal('total_score', 6, 2)->default(0)->comment('0-100 composite');
            $table->string('classification', 20)->default('good')->comment('excellent, good, needs_monitoring, needs_support, critical');
            $table->unsignedInteger('class_rank')->nullable();
            $table->unsignedInteger('school_rank')->nullable();
            $table->unsignedInteger('total_students_in_class')->nullable();
            $table->unsignedInteger('total_students_in_school')->nullable();
            $table->json('subject_scores')->nullable()->comment('per-subject breakdown');
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->unique(['school_id', 'student_id', 'academic_year_id', 'term_id'], 'ss_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('success_scores');
    }
};
