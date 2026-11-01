<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Link a School back to the platform Demo Request that produced it.
     * Used to keep the "convert demo request -> create school" action idempotent.
     */
    public function up(): void
    {
        Schema::table('schools', function (Blueprint $table) {
            $table->unsignedBigInteger('demo_request_id')->nullable()->after('id');
            $table->index('demo_request_id');
            $table->foreign('demo_request_id')
                ->references('id')
                ->on('demo_requests')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('schools', function (Blueprint $table) {
            $table->dropForeign(['demo_request_id']);
            $table->dropIndex(['demo_request_id']);
            $table->dropColumn('demo_request_id');
        });
    }
};