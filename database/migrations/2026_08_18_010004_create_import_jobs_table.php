<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('import_jobs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('import_type', 50);
            $table->string('file_name', 255);
            $table->string('file_path', 500);
            $table->string('file_type', 10);
            $table->enum('status', ['uploaded', 'validating', 'validated', 'importing', 'completed', 'failed'])->default('uploaded');
            $table->unsignedInteger('total_rows')->default(0);
            $table->unsignedInteger('valid_rows')->default(0);
            $table->unsignedInteger('error_rows')->default(0);
            $table->unsignedInteger('imported_rows')->default(0);
            $table->json('validation_errors')->nullable();
            $table->json('import_summary')->nullable();
            $table->json('import_options')->nullable();
            $table->timestamp('validated_at')->nullable();
            $table->timestamp('imported_at')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('import_jobs');
    }
};
