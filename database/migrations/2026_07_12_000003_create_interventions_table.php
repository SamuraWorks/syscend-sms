<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('interventions', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('school_id')->index();
            $table->unsignedBigInteger('student_id')->index();
            $table->unsignedBigInteger('academic_year_id')->nullable()->index();
            $table->unsignedBigInteger('term_id')->nullable()->index();
            $table->string('type', 50)->comment('academic, attendance, behavior, counselling, medical, other');
            $table->string('priority', 20)->default('medium')->comment('low, medium, high, urgent');
            $table->string('status', 30)->default('active')->comment('active, in_progress, completed, closed, escalated');
            $table->string('title', 200);
            $table->text('description');
            $table->unsignedBigInteger('assigned_to')->nullable()->comment('staff_id');
            $table->unsignedBigInteger('counsellor_id')->nullable();
            $table->string('recommended_action', 300)->nullable();
            $table->date('start_date');
            $table->date('target_date')->nullable();
            $table->date('completed_at')->nullable();
            $table->text('outcome')->nullable();
            $table->unsignedBigInteger('created_by');
            $table->timestamps();

            $table->foreign('school_id', 'int_school_fk')->references('id')->on('schools')->cascadeOnDelete();
            $table->foreign('student_id', 'int_student_fk')->references('id')->on('students')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('interventions');
    }
};
