<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('schools', function (Blueprint $table) {
            $table->string('registration_status', 20)->default('pending')->after('is_configured');
            $table->timestamp('registration_approved_at')->nullable()->after('registration_status');
            $table->unsignedBigInteger('registration_approved_by')->nullable()->after('registration_approved_at');
            $table->timestamp('registration_rejected_at')->nullable()->after('registration_approved_by');
            $table->string('registration_rejection_reason', 255)->nullable()->after('registration_rejected_at');

            $table->index('registration_status', 'schools_registration_status_index');
            $table->foreign('registration_approved_by', 'schools_registration_approved_by_fk')
                ->references('id')->on('users')->nullOnDelete();
        });

        // Existing schools were onboarded before the approval gate existed;
        // treat them as already approved so nothing regresses.
        DB::table('schools')->update(['registration_status' => 'approved']);
    }

    public function down(): void
    {
        Schema::table('schools', function (Blueprint $table) {
            $table->dropForeign('schools_registration_approved_by_fk');
            $table->dropIndex('schools_registration_status_index');
            $table->dropColumn([
                'registration_status',
                'registration_approved_at',
                'registration_approved_by',
                'registration_rejected_at',
                'registration_rejection_reason',
            ]);
        });
    }
};