<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Platform notifications are derived live from source tables (demo requests,
     * schools, subscriptions, payments) rather than materialised as rows. This
     * table therefore stores only per-user presentation state: whether the user
     * has read or dismissed a given notification key.
     *
     * @return void
     */
    public function up(): void
    {
        Schema::create('platform_notification_reads', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->string('notification_key', 191);
            $table->timestamp('read_at')->nullable();
            $table->timestamp('dismissed_at')->nullable();
            $table->timestamps();

            $table->foreign('user_id', 'pnr_user_fk')->references('id')->on('users')->cascadeOnDelete();
            $table->unique(['user_id', 'notification_key'], 'pnr_user_key_unique');
            $table->index(['user_id', 'read_at'], 'pnr_user_read_index');
        });
    }

    /**
     * @return void
     */
    public function down(): void
    {
        Schema::dropIfExists('platform_notification_reads');
    }
};