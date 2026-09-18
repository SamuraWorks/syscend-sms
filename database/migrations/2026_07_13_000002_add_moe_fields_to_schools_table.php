<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('schools', function (Blueprint $table) {
            $table->foreignId('district_id')->nullable()->constrained('districts')->nullOnDelete();
            $table->enum('school_type', ['government', 'government_assisted', 'private', 'community'])->default('private')->after('name');
            $table->string('ownership')->nullable()->after('school_type');
            $table->decimal('gps_latitude', 10, 7)->nullable()->after('ownership');
            $table->decimal('gps_longitude', 10, 7)->nullable()->after('gps_latitude');
            $table->json('infrastructure_info')->nullable()->after('gps_longitude');
            $table->enum('inspection_status', ['pending', 'scheduled', 'compliant', 'non_compliant'])->default('pending')->after('infrastructure_info');
            $table->enum('accreditation_status', ['pending', 'accredited', 'suspended'])->default('pending')->after('inspection_status');
            $table->string('national_school_id')->nullable()->unique()->after('accreditation_status');
            $table->enum('moe_approval_status', ['pending', 'approved', 'rejected'])->default('pending')->after('national_school_id');
            $table->timestamp('approved_at')->nullable()->after('moe_approval_status');
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete()->after('approved_at');
        });
    }

    public function down(): void
    {
        Schema::table('schools', function (Blueprint $table) {
            $table->dropForeign(['approved_by']);
            $table->dropForeign(['district_id']);
            $table->dropColumn([
                'district_id',
                'school_type',
                'ownership',
                'gps_latitude',
                'gps_longitude',
                'infrastructure_info',
                'inspection_status',
                'accreditation_status',
                'national_school_id',
                'moe_approval_status',
                'approved_at',
                'approved_by',
            ]);
        });
    }
};
