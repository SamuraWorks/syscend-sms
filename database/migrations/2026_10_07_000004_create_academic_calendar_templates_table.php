<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('academic_calendar_templates', function (Blueprint $table) {
            $table->id();
            $table->string('name', 100);
            $table->string('country', 10)->default('SL');
            $table->string('zone', 50)->nullable();
            $table->unsignedTinyInteger('year_start_month')->default(9);
            $table->unsignedTinyInteger('year_start_day')->default(1);
            $table->unsignedTinyInteger('year_end_month')->default(7);
            $table->unsignedTinyInteger('year_end_day')->default(31);
            $table->boolean('is_active')->default(true);
            $table->integer('sort_order')->default(0);
            $table->timestamps();
        });

        Schema::create('academic_calendar_template_terms', function (Blueprint $table) {
            $table->id();
            $table->foreignId('academic_calendar_template_id')->constrained()->cascadeOnDelete();
            $table->string('name', 50);
            $table->unsignedTinyInteger('term_number');
            $table->unsignedTinyInteger('start_month');
            $table->unsignedTinyInteger('start_day');
            $table->unsignedTinyInteger('end_month');
            $table->unsignedTinyInteger('end_day');
            $table->integer('sort_order')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('academic_calendar_template_terms');
        Schema::dropIfExists('academic_calendar_templates');
    }
};