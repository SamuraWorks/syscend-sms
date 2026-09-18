<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('document_imports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('document_type', 50)->comment('report_card, admission_form, attendance_register, fee_receipt, certificate, staff_record');
            $table->string('file_path', 500);
            $table->string('file_name', 255);
            $table->string('file_type', 50)->nullable();
            $table->unsignedBigInteger('file_size')->nullable();
            $table->string('status', 30)->default('uploaded')->comment('uploaded, processing, extracted, reviewed, imported, failed');
            $table->json('extracted_data')->nullable()->comment('AI extracted structured data');
            $table->json('extraction_metadata')->nullable()->comment('Confidence scores, AI model info');
            $table->json('import_results')->nullable()->comment('Import summary: records created, updated, skipped');
            $table->text('admin_notes')->nullable();
            $table->unsignedInteger('records_imported')->default(0);
            $table->unsignedInteger('records_skipped')->default(0);
            $table->unsignedInteger('records_updated')->default(0);
            $table->timestamp('processed_at')->nullable();
            $table->timestamp('imported_at')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['school_id', 'document_type', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('document_imports');
    }
};
