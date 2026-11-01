<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('marks', function (Blueprint $table) {
            $table->decimal('raw_score', 7, 2)->nullable()->after('marks_obtained')
                ->comment('Raw score before weighting');
            $table->decimal('weighted_score', 7, 2)->nullable()->after('raw_score')
                ->comment('Score after CA/exam weight applied');
            $table->string('assessment_type', 30)->nullable()->after('weighted_score')
                ->comment('ca, assignment, test, mid_term, end_of_term, practical');
        });
    }

    public function down(): void
    {
        Schema::table('marks', function (Blueprint $table) {
            $table->dropColumn(['raw_score', 'weighted_score', 'assessment_type']);
        });
    }
};
