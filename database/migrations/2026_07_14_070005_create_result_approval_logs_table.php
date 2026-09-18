<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('result_approval_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_id')->constrained()->cascadeOnDelete();
            $table->string('approvable_type', 100);
            $table->unsignedBigInteger('approvable_id');
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('action', 30)->comment('submitted, approved, rejected, published, corrected');
            $table->text('notes')->nullable();
            $table->json('previous_state')->nullable();
            $table->json('new_state')->nullable();
            $table->timestamps();

            $table->index(['approvable_type', 'approvable_id']);
            $table->index(['school_id', 'action']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('result_approval_logs');
    }
};
