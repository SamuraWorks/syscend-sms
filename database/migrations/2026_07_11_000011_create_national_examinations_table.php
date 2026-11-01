<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('national_examinations', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('school_id');
            $table->unsignedBigInteger('student_id');
            $table->unsignedBigInteger('academic_year_id');
            $table->unsignedBigInteger('term_id')->nullable();
            $table->string('exam_type', 20)->comment('npse, bece, wassce');
            $table->string('index_number', 50)->nullable();
            $table->unsignedInteger('exam_year');
            $table->decimal('total_score', 8, 2)->nullable();
            $table->string('overall_grade', 10)->nullable();
            $table->string('overall_result', 20)->nullable()->comment('pass, fail, distinction, credit');
            $table->json('subject_scores')->nullable()
                ->comment('[{subject, score, grade, remark}]');
            $table->string('status', 20)->default('registered')
                ->comment('registered, sat, results_pending, results_published');
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('school_id')->references('id')->on('schools')->onDelete('cascade');
            $table->foreign('student_id')->references('id')->on('students')->onDelete('cascade');
            $table->foreign('academic_year_id')->references('id')->on('academic_years')->onDelete('cascade');
            $table->foreign('term_id')->references('id')->on('academic_terms')->onDelete('set null');
            $table->unique(['school_id', 'student_id', 'exam_type', 'exam_year']);
            $table->index(['school_id', 'exam_type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('national_examinations');
    }
};
