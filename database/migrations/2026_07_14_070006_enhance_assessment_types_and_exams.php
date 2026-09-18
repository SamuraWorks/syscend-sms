<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Enhance assessment_types table
        Schema::table('assessment_types', function (Blueprint $table) {
            $table->text('description')->nullable()->after('name');
            $table->unsignedBigInteger('academic_year_id')->nullable()->after('school_id');
            $table->decimal('max_marks', 6, 2)->nullable()->after('weight');
            $table->boolean('include_in_final_result')->default(true)->after('is_active');
            $table->boolean('include_in_promotion')->default(true)->after('include_in_final_result');
            $table->boolean('require_approval')->default(false)->after('include_in_promotion');

            $table->foreign('academic_year_id')->references('id')->on('academic_years')->onDelete('set null');
        });

        // Add publication_date to exams
        Schema::table('exams', function (Blueprint $table) {
            $table->timestamp('publication_date')->nullable()->after('approved_at');
        });
    }

    public function down(): void
    {
        Schema::table('exams', function (Blueprint $table) {
            $table->dropColumn('publication_date');
        });

        Schema::table('assessment_types', function (Blueprint $table) {
            $table->dropColumn([
                'description', 'academic_year_id', 'max_marks',
                'include_in_final_result', 'include_in_promotion', 'require_approval',
            ]);
        });
    }
};
