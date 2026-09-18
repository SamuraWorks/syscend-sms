<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('school_subscriptions', function (Blueprint $table) {
            $table->decimal('price_per_term', 10, 2)->nullable()->after('amount_paid');
            $table->unsignedTinyInteger('term_number')->nullable()->after('price_per_term');
            $table->unsignedBigInteger('academic_year_id')->nullable()->after('term_number');
        });
    }

    public function down(): void
    {
        Schema::table('school_subscriptions', function (Blueprint $table) {
            $table->dropColumn(['price_per_term', 'term_number', 'academic_year_id']);
        });
    }
};
