<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('classes', function (Blueprint $table) {
            $table->unique(['school_id', 'name']);
        });

        Schema::table('departments', function (Blueprint $table) {
            $table->unique(['school_id', 'name']);
        });

        Schema::table('departments', function (Blueprint $table) {
            $table->unique(['school_id', 'code']);
        });
    }

    public function down(): void
    {
        Schema::table('classes', function (Blueprint $table) {
            $table->dropUnique(['school_id', 'name']);
        });

        Schema::table('departments', function (Blueprint $table) {
            $table->dropUnique(['school_id', 'name']);
        });

        Schema::table('departments', function (Blueprint $table) {
            $table->dropUnique(['school_id', 'code']);
        });
    }
};
