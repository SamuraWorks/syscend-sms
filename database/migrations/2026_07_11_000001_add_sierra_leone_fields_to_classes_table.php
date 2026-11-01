<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('classes', function (Blueprint $table) {
            $table->string('school_level', 30)->nullable()->after('name')
                ->comment('early_childhood, primary, junior_secondary, senior_secondary');
            $table->unsignedInteger('level_order')->default(0)->after('school_level')
                ->comment('Ordering within the school_level group');
            $table->unsignedBigInteger('department_id')->nullable()->after('level_order')
                ->comment('For SSS classes only: Science, Arts, Commercial');
        });
    }

    public function down(): void
    {
        Schema::table('classes', function (Blueprint $table) {
            $table->dropColumn(['school_level', 'level_order', 'department_id']);
        });
    }
};
