<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('districts', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->string('code')->unique();
            $table->string('province');
            $table->foreignId('education_officer_id')->nullable()->constrained('users')->nullOnDelete();
            $table->unsignedInteger('schools_count')->default(0);
            $table->unsignedInteger('students_count')->default(0);
            $table->unsignedInteger('teachers_count')->default(0);
            $table->enum('status', ['active', 'inactive'])->default('active');
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('districts');
    }
};
