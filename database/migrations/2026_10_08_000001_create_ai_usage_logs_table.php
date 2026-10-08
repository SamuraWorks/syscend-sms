<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ai_usage_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_id')->nullable()->constrained()->cascadeOnDelete();
            $table->unsignedBigInteger('user_id')->nullable();
            $table->string('feature', 50);
            $table->string('status', 20)->default('success'); // success | error | throttled | disabled
            $table->string('model', 100)->nullable();
            $table->unsignedInteger('input_tokens')->default(0);
            $table->unsignedInteger('output_tokens')->default(0);
            $table->unsignedInteger('total_tokens')->default(0);
            $table->unsignedInteger('latency_ms')->default(0);
            $table->string('error_code', 50)->nullable();
            $table->integer('cost_usd_cents')->default(0);
            $table->string('ip_address', 45)->nullable();
            $table->string('request_id', 64)->nullable();
            $table->timestamp('performed_at')->useCurrent();

            $table->index(['school_id', 'feature', 'performed_at']);
            $table->index(['user_id', 'feature', 'performed_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ai_usage_logs');
    }
};