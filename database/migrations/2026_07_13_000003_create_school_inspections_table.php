<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('school_inspections', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_id')->constrained()->cascadeOnDelete();
            $table->foreignId('inspector_id')->constrained('users')->nullOnDelete();
            $table->foreignId('district_id')->constrained('districts')->nullOnDelete();
            $table->enum('inspection_type', ['routine', 'scheduled', 'follow_up', 'emergency']);
            $table->enum('status', ['scheduled', 'in_progress', 'completed', 'cancelled'])->default('scheduled');
            $table->date('scheduled_date');
            $table->date('completed_date')->nullable();
            $table->text('findings')->nullable();
            $table->decimal('score', 3, 1)->nullable();
            $table->enum('compliance_status', ['compliant', 'partially_compliant', 'non_compliant'])->nullable();
            $table->boolean('improvement_required')->default(false);
            $table->text('recommendations')->nullable();
            $table->date('next_inspection_date')->nullable();
            $table->json('attachments')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('school_inspections');
    }
};
