<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('guardians', function (Blueprint $table) {
            $table->string('alt_phone')->nullable()->after('phone');
        });

        Schema::table('student_documents', function (Blueprint $table) {
            $table->boolean('visible_to_parent')->default(false)->after('file_size');
        });
    }

    public function down(): void
    {
        Schema::table('guardians', function (Blueprint $table) {
            $table->dropColumn('alt_phone');
        });

        Schema::table('student_documents', function (Blueprint $table) {
            $table->dropColumn('visible_to_parent');
        });
    }
};
