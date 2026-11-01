<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('marks', function (Blueprint $table) {
            $table->unsignedBigInteger('subject_offering_id')->nullable()->after('subject_id')->index();
            $table->foreign('subject_offering_id', 'marks_offering_fk')
                  ->references('id')->on('subject_offerings')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('marks', function (Blueprint $table) {
            $table->dropForeign('marks_offering_fk');
            $table->dropColumn('subject_offering_id');
        });
    }
};
