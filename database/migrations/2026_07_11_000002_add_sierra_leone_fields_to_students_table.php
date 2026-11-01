<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('students', function (Blueprint $table) {
            $table->string('student_id', 30)->nullable()->after('admission_no')
                ->comment('Unique student identifier per school');
            $table->unsignedBigInteger('department_id')->nullable()->after('section_id')
                ->comment('SSS department: Science, Arts, Commercial');
            $table->string('emis_number', 50)->nullable()->after('previous_school')
                ->comment('Education Management Information System number');
            $table->string('npse_index_number', 50)->nullable()->after('emis_number');
            $table->string('bece_index_number', 50)->nullable()->after('npse_index_number');
            $table->string('wassce_index_number', 50)->nullable()->after('bece_index_number');
            $table->text('medical_info')->nullable()->after('wassce_index_number')
                ->comment('Allergies, conditions, medications');
            $table->string('nationality', 50)->nullable()->change()
                ->comment('Changed default from Bangladeshi to Sierra Leonean');
        });
    }

    public function down(): void
    {
        Schema::table('students', function (Blueprint $table) {
            $table->dropColumn([
                'student_id', 'department_id', 'emis_number',
                'npse_index_number', 'bece_index_number', 'wassce_index_number',
                'medical_info',
            ]);
        });
    }
};
