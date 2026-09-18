<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Add workflow fields to exams
        Schema::table('exams', function (Blueprint $table) {
            $table->decimal('max_score', 6, 2)->default(100)->after('exam_weight');
            $table->unsignedBigInteger('submitted_by')->nullable()->after('max_score');
            $table->timestamp('submitted_at')->nullable()->after('submitted_by');
            $table->unsignedBigInteger('approved_by')->nullable()->after('submitted_at');
            $table->timestamp('approved_at')->nullable()->after('approved_by');
            $table->string('assessment_model', 30)->nullable()->after('approved_at')
                ->comment('ca_test_final, ca_final, test_final, final_only, custom');
        });

        // Add sub-type tracking to marks
        Schema::table('marks', function (Blueprint $table) {
            $table->string('assessment_type_slug', 50)->nullable()->after('assessment_type')
                ->comment('classwork, assignment, homework, project, quiz, etc.');
            $table->decimal('component_marks', 6, 2)->nullable()->after('marks_obtained')
                ->comment('Raw marks for this specific CA component');
            $table->decimal('component_max', 6, 2)->nullable()->after('component_marks')
                ->comment('Max marks for this specific CA component');
        });

        // Create exam_assessment_links table
        Schema::create('exam_assessment_links', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('school_id');
            $table->unsignedBigInteger('exam_id');
            $table->unsignedBigInteger('assessment_type_id');
            $table->decimal('max_marks', 6, 2)->default(100);
            $table->decimal('weight', 5, 2)->default(0)
                ->comment('Weight percentage (must sum to 100)');
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();

            $table->foreign('school_id')->references('id')->on('schools')->cascadeOnDelete();
            $table->foreign('exam_id')->references('id')->on('exams')->cascadeOnDelete();
            $table->foreign('assessment_type_id')->references('id')->on('assessment_types')->cascadeOnDelete();
            $table->unique(['exam_id', 'assessment_type_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('exam_assessment_links');

        Schema::table('marks', function (Blueprint $table) {
            $table->dropColumn(['assessment_type_slug', 'component_marks', 'component_max']);
        });

        Schema::table('exams', function (Blueprint $table) {
            $table->dropColumn(['max_score', 'submitted_by', 'submitted_at', 'approved_by', 'approved_at', 'assessment_model']);
        });
    }
};
