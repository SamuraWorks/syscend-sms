<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('report_cards', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('school_id');
            $table->unsignedBigInteger('student_id');
            $table->unsignedBigInteger('academic_year_id');
            $table->unsignedBigInteger('term_id')->nullable();
            $table->unsignedBigInteger('class_id');
            $table->unsignedBigInteger('section_id')->nullable();

            $table->decimal('total_marks', 8, 2)->nullable();
            $table->decimal('obtained_marks', 8, 2)->nullable();
            $table->decimal('percentage', 5, 2)->nullable();
            $table->string('grade', 10)->nullable();
            $table->decimal('gpa', 4, 2)->nullable();
            $table->unsignedInteger('rank')->nullable();

            $table->unsignedInteger('total_school_days')->default(0);
            $table->unsignedInteger('days_present')->default(0);
            $table->unsignedInteger('days_absent')->default(0);
            $table->unsignedInteger('days_late')->default(0);

            $table->string('promotion_status', 20)->nullable()
                ->comment('promoted, retained, promoted_with_conditions');

            $table->text('teacher_comment')->nullable();
            $table->text('form_master_comment')->nullable();
            $table->text('principal_comment')->nullable();

            $table->json('subject_data')->nullable()
                ->comment('Per-subject marks, grades, comments');
            $table->json('extra_data')->nullable()
                ->comment('Additional report card data');

            $table->string('pdf_path', 500)->nullable();
            $table->string('status', 20)->default('draft')
                ->comment('draft, published, sent');

            $table->timestamps();
            $table->softDeletes();

            $table->foreign('school_id')->references('id')->on('schools')->onDelete('cascade');
            $table->foreign('student_id')->references('id')->on('students')->onDelete('cascade');
            $table->foreign('academic_year_id')->references('id')->on('academic_years')->onDelete('cascade');
            $table->foreign('term_id')->references('id')->on('academic_terms')->onDelete('set null');
            $table->foreign('class_id')->references('id')->on('classes')->onDelete('cascade');
            $table->foreign('section_id')->references('id')->on('sections')->onDelete('set null');

            $table->unique(['school_id', 'student_id', 'academic_year_id', 'term_id']);
            $table->index(['school_id', 'class_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('report_cards');
    }
};
