<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('student_performance_snapshots', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('school_id')->index();
            $table->unsignedBigInteger('student_id')->index();
            $table->unsignedBigInteger('academic_year_id');
            $table->unsignedBigInteger('term_id')->nullable();
            $table->decimal('average_percentage', 6, 2)->nullable();
            $table->decimal('attendance_percentage', 6, 2)->nullable();
            $table->unsignedInteger('homework_completed')->default(0);
            $table->unsignedInteger('homework_total')->default(0);
            $table->integer('behavior_positive_count')->default(0);
            $table->integer('behavior_negative_count')->default(0);
            $table->decimal('success_score', 6, 2)->nullable();
            $table->string('classification', 20)->nullable();
            $table->unsignedInteger('class_rank')->nullable();
            $table->json('snapshot_data')->nullable();
            $table->timestamps();

            $table->unique(['school_id', 'student_id', 'academic_year_id', 'term_id'], 'sps_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('student_performance_snapshots');
    }
};
