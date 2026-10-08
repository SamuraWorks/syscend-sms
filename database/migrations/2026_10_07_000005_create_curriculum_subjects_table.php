<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('curriculum_subjects', function (Blueprint $table) {
            $table->id();
            $table->string('school_level', 40)->index();
            $table->string('section_group', 40)->nullable();
            $table->string('name', 100);
            $table->string('code', 20)->nullable();
            $table->boolean('is_core')->default(true);
            $table->integer('sort_order')->default(0);
            $table->timestamps();

            $table->unique(['school_level', 'section_group', 'name'], 'curriculum_subjects_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('curriculum_subjects');
    }
};