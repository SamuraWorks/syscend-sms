<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('staff')) {
            return;
        }

        // Resolve any pre-existing in-school duplications before adding the unique
        // index, so the constraint can be created on live data. Duplicate rows keep
        // their identity; only the visible school ID is suffixed.
        $duplicates = DB::table('staff')
            ->select('school_id', 'emp_id')
            ->whereNotNull('emp_id')
            ->groupBy('school_id', 'emp_id')
            ->havingRaw('COUNT(*) > 1')
            ->get();

        foreach ($duplicates as $dup) {
            $rows = DB::table('staff')
                ->where('school_id', $dup->school_id)
                ->where('emp_id', $dup->emp_id)
                ->orderBy('id')
                ->pluck('id');

            foreach ($rows->slice(1)->values() as $index => $id) {
                DB::table('staff')
                    ->where('id', $id)
                    ->update(['emp_id' => $dup->emp_id . '-D' . ($index + 1)]);
            }
        }

        Schema::table('staff', function (Blueprint $table) {
            $table->unique(['school_id', 'emp_id'], 'staff_school_emp_id_unique');
        });
    }

    public function down(): void
    {
        Schema::table('staff', function (Blueprint $table) {
            $table->dropUnique('staff_school_emp_id_unique');
        });
    }
};