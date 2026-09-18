<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('national_teacher_registry', function (Blueprint $table) {
            $table->id();
            $table->string('national_teacher_id')->unique();
            $table->string('name');
            $table->string('email')->nullable();
            $table->string('phone')->nullable();
            $table->foreignId('staff_id')->nullable()->constrained('staff')->nullOnDelete();
            $table->foreignId('school_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('district_id')->nullable()->constrained('districts')->nullOnDelete();
            $table->string('qualification');
            $table->string('specialization');
            $table->unsignedInteger('years_of_experience')->default(0);
            $table->enum('employment_status', ['active', 'on_leave', 'retired', 'transferred'])->default('active');
            $table->json('certifications')->nullable();
            $table->enum('licensing_status', ['licensed', 'pending', 'expired'])->default('pending');
            $table->unsignedInteger('professional_development_hours')->default(0);
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('national_teacher_registry');
    }
};
