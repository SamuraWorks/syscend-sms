<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('school_setup_progress', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_id')->constrained()->cascadeOnDelete();
            $table->string('step', 50);
            $table->boolean('completed')->default(false);
            $table->json('data')->nullable();
            $table->timestamps();

            $table->unique(['school_id', 'step']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('school_setup_progress');
    }
};
