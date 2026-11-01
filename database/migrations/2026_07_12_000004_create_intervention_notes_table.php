<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('intervention_notes', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('school_id')->index();
            $table->unsignedBigInteger('intervention_id')->index();
            $table->unsignedBigInteger('author_id')->comment('staff_id');
            $table->text('note');
            $table->string('note_type', 30)->default('follow_up')->comment('follow_up, parent_meeting, counselling, medical, escalation, general');
            $table->string('visibility', 20)->default('internal')->comment('internal, shared_with_parent, shared_with_student');
            $table->timestamps();

            $table->foreign('school_id', 'in_school_fk')->references('id')->on('schools')->cascadeOnDelete();
            $table->foreign('intervention_id', 'in_intervention_fk')->references('id')->on('interventions')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('intervention_notes');
    }
};
