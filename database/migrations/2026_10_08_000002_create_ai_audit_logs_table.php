<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ai_audit_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_id')->nullable()->constrained()->cascadeOnDelete();
            $table->unsignedBigInteger('user_id')->nullable();
            $table->string('feature', 50);
            $table->string('action', 50);          // generate | copy | delete | approve | publish | etc.
            $table->string('subject_type')->nullable();
            $table->unsignedBigInteger('subject_id')->nullable();
            $table->string('input_summary', 255)->nullable();
            $table->string('result_status', 20)->default('ok'); // ok | truncated | validation_failed | rejection
            $table->boolean('published_applied')->default(false);
            $table->json('metadata')->nullable();
            $table->timestamp('performed_at')->useCurrent();

            $table->index(['school_id', 'feature', 'performed_at']);
            $table->index(['subject_type', 'subject_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ai_audit_logs');
    }
};