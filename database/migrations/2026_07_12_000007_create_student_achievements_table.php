<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('student_achievements', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('school_id')->index();
            $table->unsignedBigInteger('student_id')->index();
            $table->unsignedBigInteger('academic_year_id')->nullable();
            $table->unsignedBigInteger('term_id')->nullable();
            $table->string('badge', 80)->comment('e.g. top_performer, perfect_attendance, most_improved, homework_champion, leadership_star, science_whiz');
            $table->string('title', 150);
            $table->text('description')->nullable();
            $table->string('category', 50)->comment('academic, attendance, behavior, leadership, creativity, sports');
            $table->unsignedBigInteger('awarded_by')->nullable()->comment('staff_id');
            $table->date('awarded_at');
            $table->timestamps();

            $table->foreign('school_id', 'sach_school_fk')->references('id')->on('schools')->cascadeOnDelete();
            $table->foreign('student_id', 'sach_student_fk')->references('id')->on('students')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('student_achievements');
    }
};
