<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('inquiry_followups', function (Blueprint $table) {
            $table->unsignedBigInteger('school_id')->index()->after('id');
        });

        // Backfill school_id from parent admission_inquiries
        DB::statement('
            UPDATE inquiry_followups
            SET school_id = (
                SELECT school_id FROM admission_inquiries
                WHERE admission_inquiries.id = inquiry_followups.inquiry_id
            )
        ');

        Schema::table('inquiry_followups', function (Blueprint $table) {
            $table->foreign('school_id', 'if_school_fk')->references('id')->on('schools')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('inquiry_followups', function (Blueprint $table) {
            $table->dropForeign('if_school_fk');
            $table->dropColumn('school_id');
        });
    }
};
