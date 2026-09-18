<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('assessment_components', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_id')->constrained()->cascadeOnDelete();
            $table->foreignId('academic_year_id')->constrained()->cascadeOnDelete();
            $table->string('name', 100);
            $table->string('slug', 100);
            $table->string('category', 50)->comment('coursework, examination');
            $table->text('description')->nullable();
            $table->decimal('max_marks', 6, 2)->default(100);
            $table->decimal('weight_percentage', 5, 2)->default(0);
            $table->unsignedInteger('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->boolean('include_in_final_result')->default(true);
            $table->boolean('include_in_promotion')->default(true);
            $table->boolean('require_approval')->default(false);
            $table->timestamps();
            $table->softDeletes();

            $table->index(['school_id', 'academic_year_id', 'category']);
            $table->unique(['school_id', 'academic_year_id', 'slug']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('assessment_components');
    }
};
