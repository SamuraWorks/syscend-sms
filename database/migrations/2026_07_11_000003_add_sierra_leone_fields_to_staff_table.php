<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('staff', function (Blueprint $table) {
            $table->string('teacher_type', 20)->nullable()->after('designation_id')
                ->comment('form_master, subject_teacher, both');
            $table->unsignedBigInteger('form_master_section_id')->nullable()->after('teacher_type')
                ->comment('Section this teacher is form master of');
            $table->unsignedBigInteger('form_master_class_id')->nullable()->after('form_master_section_id')
                ->comment('Class this teacher is form master of');
            $table->string('nationality', 50)->nullable()->change()
                ->comment('Changed default from Bangladeshi to Sierra Leonean');
        });
    }

    public function down(): void
    {
        Schema::table('staff', function (Blueprint $table) {
            $table->dropColumn(['teacher_type', 'form_master_section_id', 'form_master_class_id']);
        });
    }
};
