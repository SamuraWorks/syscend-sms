<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('classes', function (Blueprint $table) {
            $table->string('short_name', 20)->nullable()->after('name')
                ->comment('e.g. JSS1, SSS3, Nur 1');
            $table->text('description')->nullable()->after('short_name');
            $table->boolean('is_active')->default(true)->after('description');
        });

        Schema::table('sections', function (Blueprint $table) {
            $table->string('section_code', 20)->nullable()->after('name')
                ->comment('Optional code like SEC-A, SCI-1');
            $table->string('classroom', 50)->nullable()->after('capacity')
                ->comment('Room name/number e.g. Room 12, Lab A');
            $table->boolean('is_active')->default(true)->after('classroom');
        });
    }

    public function down(): void
    {
        Schema::table('classes', function (Blueprint $table) {
            $table->dropColumn(['short_name', 'description', 'is_active']);
        });

        Schema::table('sections', function (Blueprint $table) {
            $table->dropColumn(['section_code', 'classroom', 'is_active']);
        });
    }
};
