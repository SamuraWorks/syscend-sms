<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('national_student_registry', function (Blueprint $table) {
            $table->id();
            $table->string('national_student_id')->unique();
            $table->string('name');
            $table->date('date_of_birth');
            $table->enum('gender', ['male', 'female']);
            $table->foreignId('school_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('district_id')->nullable()->constrained('districts')->nullOnDelete();
            $table->date('enrollment_date');
            $table->enum('current_level', ['nursery', 'primary', 'jss', 'sss']);
            $table->enum('status', ['active', 'graduated', 'transferred', 'dropped_out'])->default('active');
            $table->json('previous_schools')->nullable();
            $table->unsignedSmallInteger('graduation_year')->nullable();
            $table->foreignId('created_by')->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('national_student_registry');
    }
};
