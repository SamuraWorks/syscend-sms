<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('exam_subject_offerings', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('exam_id')->index();
            $table->unsignedBigInteger('subject_offering_id')->index();
            $table->decimal('max_marks', 6, 2)->nullable();
            $table->decimal('weight', 5, 2)->nullable();
            $table->timestamps();

            $table->unique(['exam_id', 'subject_offering_id']);
            $table->foreign('exam_id')->references('id')->on('exams')->cascadeOnDelete();
            $table->foreign('subject_offering_id')->references('id')->on('subject_offerings')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('exam_subject_offerings');
    }
};
