<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('departments', function (Blueprint $table) {
            $table->string('type', 20)->default('staff')->after('code')
                ->comment('staff = HR departments, academic = SSS departments');
            $table->boolean('is_active')->default(true)->after('type');
        });
    }

    public function down(): void
    {
        Schema::table('departments', function (Blueprint $table) {
            $table->dropColumn(['type', 'is_active']);
        });
    }
};
