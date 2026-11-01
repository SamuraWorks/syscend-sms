<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('student_alerts', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('school_id')->index();
            $table->unsignedBigInteger('student_id')->index();
            $table->string('type', 50)->comment('low_grades, declining_performance, poor_attendance, missing_homework, behavior_concern, rapid_decline, significant_improvement, exam_risk, promotion_risk, medical_alert');
            $table->string('severity', 20)->default('warning')->comment('info, warning, critical');
            $table->string('title', 200);
            $table->text('message');
            $table->json('data')->nullable()->comment('contextual data');
            $table->boolean('is_read')->default(false);
            $table->unsignedBigInteger('assigned_to')->nullable()->index()->comment('staff_id');
            $table->unsignedBigInteger('resolved_by')->nullable();
            $table->text('resolution')->nullable();
            $table->timestamp('resolved_at')->nullable();
            $table->timestamps();

            $table->foreign('school_id', 'sa_school_fk')->references('id')->on('schools')->cascadeOnDelete();
            $table->foreign('student_id', 'sa_student_fk')->references('id')->on('students')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('student_alerts');
    }
};
