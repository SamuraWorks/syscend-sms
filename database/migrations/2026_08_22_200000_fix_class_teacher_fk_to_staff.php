<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('classes', function (Blueprint $table) {
            $table->dropForeign('classes_teacher_fk');
            $table->foreign('class_teacher_id', 'classes_teacher_fk')->references('id')->on('staff')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('classes', function (Blueprint $table) {
            $table->dropForeign('classes_teacher_fk');
            $table->foreign('class_teacher_id', 'classes_teacher_fk')->references('id')->on('users')->nullOnDelete();
        });
    }
};
