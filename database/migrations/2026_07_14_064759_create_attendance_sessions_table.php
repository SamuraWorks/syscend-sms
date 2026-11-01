<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('attendance_sessions', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('school_id');
            $table->string('name', 50);
            $table->string('slug', 50);
            $table->time('start_time')->nullable();
            $table->time('end_time')->nullable();
            $table->boolean('is_active')->default(true);
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();

            $table->foreign('school_id')->references('id')->on('schools')->cascadeOnDelete();
            $table->unique(['school_id', 'slug']);
        });

        // Add session and workflow to attendances
        Schema::table('attendances', function (Blueprint $table) {
            $table->unsignedBigInteger('session_id')->nullable()->after('remarks');
            $table->string('status_draft', 20)->default('draft')->after('session_id');
            $table->unsignedBigInteger('submitted_by')->nullable()->after('status_draft');
            $table->timestamp('submitted_at')->nullable()->after('submitted_by');
        });
    }

    public function down(): void
    {
        Schema::table('attendances', function (Blueprint $table) {
            $table->dropColumn(['session_id', 'status_draft', 'submitted_by', 'submitted_at']);
        });

        Schema::dropIfExists('attendance_sessions');
    }
};
