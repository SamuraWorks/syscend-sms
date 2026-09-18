<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('exams', function (Blueprint $table) {
            $table->unsignedBigInteger('academic_year_id')->nullable()->after('class_id');
            $table->unsignedBigInteger('term_id')->nullable()->after('academic_year_id');
            $table->string('assessment_category', 30)->nullable()->after('type')
                ->comment('continuous_assessment, summative, national');
            $table->decimal('ca_weight', 5, 2)->nullable()->after('assessment_category')
                ->comment('CA weight percentage for this exam');
            $table->decimal('exam_weight', 5, 2)->nullable()->after('ca_weight')
                ->comment('Exam weight percentage for this exam');
        });
    }

    public function down(): void
    {
        Schema::table('exams', function (Blueprint $table) {
            $table->dropColumn([
                'academic_year_id', 'term_id', 'assessment_category',
                'ca_weight', 'exam_weight',
            ]);
        });
    }
};
