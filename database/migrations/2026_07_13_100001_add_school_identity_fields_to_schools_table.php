<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('schools', function (Blueprint $table) {
            // Basic Identity
            $table->string('short_name')->nullable()->after('name');
            $table->string('motto')->nullable()->after('short_name');
            $table->string('badge')->nullable()->after('logo');
            $table->string('banner')->nullable()->after('badge');
            $table->string('primary_color', 20)->nullable()->after('banner');
            $table->string('secondary_color', 20)->nullable()->after('primary_color');
            $table->year('year_established')->nullable()->after('secondary_color');
            $table->enum('school_level', ['nursery', 'primary', 'junior_secondary', 'senior_secondary', 'combined'])->nullable()->after('school_type');

            // Registration & Official Information
            $table->string('mbsse_registration_number')->nullable()->after('school_level');
            $table->string('emis_code')->nullable()->after('mbsse_registration_number');
            $table->string('waec_centre_number')->nullable()->after('emis_code');
            $table->string('npse_centre_number')->nullable()->after('waec_centre_number');
            $table->string('bece_centre_number')->nullable()->after('npse_centre_number');
            $table->string('wassce_centre_number')->nullable()->after('bece_centre_number');
            $table->string('business_registration_number')->nullable()->after('wassce_centre_number');
            $table->string('tax_identification_number')->nullable()->after('business_registration_number');

            // Contact Information
            $table->string('district_name')->nullable()->after('tax_identification_number');
            $table->string('chiefdom')->nullable()->after('district_name');
            $table->string('province')->nullable()->after('chiefdom');
            $table->string('postal_address')->nullable()->after('province');
            $table->string('whatsapp_number')->nullable()->after('phone');
            $table->string('website')->nullable()->after('whatsapp_number');

            // Leadership
            $table->string('proprietor_name')->nullable()->after('website');
            $table->string('proprietor_photo')->nullable()->after('proprietor_name');
            $table->string('principal_name')->nullable()->after('proprietor_photo');
            $table->string('principal_photo')->nullable()->after('principal_name');
            $table->string('vice_principal_name')->nullable()->after('principal_photo');
            $table->string('bursar_name')->nullable()->after('vice_principal_name');
            $table->string('registrar_name')->nullable()->after('bursar_name');

            // Academic Information
            $table->string('working_days')->nullable()->after('registrar_name');
            $table->string('school_opening_time')->nullable()->after('working_days');
            $table->string('school_closing_time')->nullable()->after('school_opening_time');
            $table->decimal('ca_weight', 5, 2)->nullable()->after('school_closing_time');
            $table->decimal('exam_weight', 5, 2)->nullable()->after('ca_weight');

            // Branding Assets
            $table->string('official_signature')->nullable()->after('exam_weight');
            $table->string('official_stamp')->nullable()->after('official_signature');

            // Public Profile
            $table->boolean('public_profile_enabled')->default(false)->after('official_stamp');
            $table->text('about_school')->nullable()->after('public_profile_enabled');
            $table->text('school_mission')->nullable()->after('about_school');
            $table->text('school_vision')->nullable()->after('school_mission');
        });
    }

    public function down(): void
    {
        Schema::table('schools', function (Blueprint $table) {
            $table->dropColumn([
                'short_name', 'motto', 'badge', 'banner', 'primary_color', 'secondary_color',
                'year_established', 'school_level',
                'mbsse_registration_number', 'emis_code', 'waec_centre_number',
                'npse_centre_number', 'bece_centre_number', 'wassce_centre_number',
                'business_registration_number', 'tax_identification_number',
                'district_name', 'chiefdom', 'province', 'postal_address',
                'whatsapp_number', 'website',
                'proprietor_name', 'proprietor_photo', 'principal_name', 'principal_photo',
                'vice_principal_name', 'bursar_name', 'registrar_name',
                'working_days', 'school_opening_time', 'school_closing_time',
                'ca_weight', 'exam_weight',
                'official_signature', 'official_stamp',
                'public_profile_enabled', 'about_school', 'school_mission', 'school_vision',
            ]);
        });
    }
};
