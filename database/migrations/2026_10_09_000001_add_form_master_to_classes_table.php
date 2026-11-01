<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('classes', function (Blueprint $table) {
            $table->unsignedBigInteger('form_master_id')->nullable()->after('class_teacher_id')
                ->comment('Staff ID of the form master when a class has no sections');
            $table->foreign('form_master_id', 'classes_form_master_fk')
                ->references('id')->on('staff')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('classes', function (Blueprint $table) {
            $table->dropForeign('classes_form_master_fk');
            $table->dropColumn('form_master_id');
        });
    }
};
