<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('marks', function (Blueprint $table) {
            $table->string('status', 20)->default('draft')->after('component_max')
                ->comment('draft, submitted, approved');
            $table->unsignedBigInteger('submitted_by')->nullable()->after('status')
                ->comment('User who submitted the mark for approval');
            $table->timestamp('submitted_at')->nullable()->after('submitted_by');
        });
    }

    public function down(): void
    {
        Schema::table('marks', function (Blueprint $table) {
            $table->dropColumn(['status', 'submitted_by', 'submitted_at']);
        });
    }
};
