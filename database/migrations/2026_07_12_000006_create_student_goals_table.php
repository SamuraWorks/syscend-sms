<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('student_goals', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('school_id')->index();
            $table->unsignedBigInteger('student_id')->index();
            $table->unsignedBigInteger('academic_year_id')->nullable();
            $table->unsignedBigInteger('term_id')->nullable();
            $table->string('category', 50)->comment('academic, attendance, behavior, personal, subject');
            $table->string('title', 200);
            $table->text('description')->nullable();
            $table->string('target_value', 100)->nullable()->comment('e.g. 85%, 95% attendance');
            $table->date('start_date');
            $table->date('target_date')->nullable();
            $table->string('status', 30)->default('active')->comment('active, achieved, missed, abandoned');
            $table->decimal('progress', 5, 2)->default(0)->comment('0-100 percentage');
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->foreign('school_id', 'sg_school_fk')->references('id')->on('schools')->cascadeOnDelete();
            $table->foreign('student_id', 'sg_student_fk')->references('id')->on('students')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('student_goals');
    }
};
