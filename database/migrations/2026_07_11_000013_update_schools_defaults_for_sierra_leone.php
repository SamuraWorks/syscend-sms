<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('schools', function (Blueprint $table) {
            $table->string('country', 100)->default('SL')->change();
            $table->string('timezone', 60)->default('Africa/Freetown')->change();
            $table->string('currency', 10)->default('SLL')->change();
            $table->string('currency_symbol', 5)->nullable()->default('Le')->after('currency');
            $table->boolean('is_configured')->default(false)->after('settings')
                ->comment('Set to true after school completes initial setup');
        });
    }

    public function down(): void
    {
        Schema::table('schools', function (Blueprint $table) {
            $table->string('country', 100)->default('BD')->change();
            $table->string('timezone', 60)->default('Asia/Dhaka')->change();
            $table->string('currency', 10)->default('BDT')->change();
            $table->dropColumn(['currency_symbol', 'is_configured']);
        });
    }
};
