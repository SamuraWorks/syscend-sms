<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('student_behaviors', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('school_id')->index();
            $table->unsignedBigInteger('student_id')->index();
            $table->unsignedBigInteger('academic_year_id')->nullable()->index();
            $table->unsignedBigInteger('term_id')->nullable()->index();
            $table->unsignedBigInteger('class_id')->nullable()->index();
            $table->unsignedBigInteger('reported_by')->nullable()->index()->comment('staff_id of reporter');
            $table->string('category', 50)->comment('positive, negative, neutral');
            $table->string('type', 80)->comment('punctuality, discipline, respect, participation, leadership, bullying, uniform, homework, attendance, other');
            $table->text('description');
            $table->string('severity', 20)->default('minor')->comment('minor, moderate, major, critical');
            $table->string('action_taken', 200)->nullable();
            $table->date('occurred_at');
            $table->boolean('parent_notified')->default(false);
            $table->timestamps();

            $table->foreign('school_id', 'sb_school_fk')->references('id')->on('schools')->cascadeOnDelete();
            $table->foreign('student_id', 'sb_student_fk')->references('id')->on('students')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('student_behaviors');
    }
};
