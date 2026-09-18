<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('demo_requests', function (Blueprint $table) {
            $table->id();
            $table->string('request_id')->unique()->comment('Unique Demo Request ID');
            $table->enum('status', ['new', 'contacted', 'demo_scheduled', 'demo_completed', 'follow_up_required', 'converted', 'closed'])->default('new');
            $table->unsignedBigInteger('assigned_to')->nullable()->constrained('users')->nullOnDelete();

            // School Information
            $table->string('school_name');
            $table->enum('school_type', ['government', 'government_assisted', 'private', 'community', 'faith_based']);
            $table->enum('school_level', ['nursery', 'primary', 'junior_secondary', 'senior_secondary', 'combined']);
            $table->string('district');
            $table->unsignedInteger('number_of_students')->nullable();
            $table->unsignedInteger('number_of_teachers')->nullable();

            // Contact Information
            $table->string('contact_name');
            $table->enum('contact_position', ['proprietor', 'principal', 'school_admin', 'ict_officer', 'accountant', 'other']);
            $table->string('contact_email');
            $table->string('contact_phone', 25);
            $table->string('contact_whatsapp', 25)->nullable();

            // School Needs
            $table->json('modules_of_interest');

            // Current Situation
            $table->enum('current_management', ['paper', 'excel', 'another_system', 'custom_software', 'other']);

            // Biggest Challenge
            $table->text('biggest_challenge')->nullable();

            // Preferred Contact
            $table->enum('preferred_contact_method', ['phone', 'whatsapp', 'email']);

            // Preferred Demo Time
            $table->string('preferred_day')->nullable();
            $table->string('preferred_time')->nullable();

            // Technical
            $table->string('ip_address', 45)->nullable();
            $table->string('user_agent')->nullable();

            $table->timestamps();

            $table->index('status');
            $table->index('district');
            $table->index('created_at');
        });

        Schema::create('demo_request_notes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('demo_request_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->text('note');
            $table->enum('type', ['call', 'whatsapp', 'email', 'internal', 'follow_up'])->default('internal');
            $table->timestamps();
        });

        Schema::create('demo_request_status_history', function (Blueprint $table) {
            $table->id();
            $table->foreignId('demo_request_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('old_status')->nullable();
            $table->string('new_status');
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('demo_request_status_history');
        Schema::dropIfExists('demo_request_notes');
        Schema::dropIfExists('demo_requests');
    }
};
