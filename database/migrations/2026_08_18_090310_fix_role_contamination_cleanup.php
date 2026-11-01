<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $schoolRoles = [
            'school-admin', 'principal', 'teacher', 'accountant',
            'librarian', 'receptionist', 'driver', 'warden',
            'store-manager', 'proprietor', 'student', 'parent',
        ];
        $portalRoles = ['super-admin', 'ministry-admin', 'district-officer'];

        // Find users with both school AND portal roles
        $contaminated = DB::table('model_has_roles')
            ->select('model_id')
            ->where('model_type', 'App\\Models\\User')
            ->groupBy('model_id')
            ->havingRaw('COUNT(DISTINCT role_id) > 1')
            ->get()
            ->pluck('model_id');

        foreach ($contaminated as $userId) {
            $userRoles = DB::table('model_has_roles')
                ->join('roles', 'roles.id', '=', 'model_has_roles.role_id')
                ->where('model_has_roles.model_id', $userId)
                ->where('model_has_roles.model_type', 'App\\Models\\User')
                ->pluck('roles.name');

            if ($userRoles->intersect($schoolRoles)->isNotEmpty() && $userRoles->intersect($portalRoles)->isNotEmpty()) {
                $portalRoleIds = DB::table('roles')->whereIn('name', $portalRoles)->pluck('id');
                DB::table('model_has_roles')
                    ->where('model_id', $userId)
                    ->where('model_type', 'App\\Models\\User')
                    ->whereIn('role_id', $portalRoleIds)
                    ->delete();

                $portalPermIds = DB::table('permissions')->where('name', 'like', 'ministry.%')->pluck('id');
                if ($portalPermIds->isNotEmpty()) {
                    DB::table('model_has_permissions')
                        ->where('model_id', $userId)
                        ->where('model_type', 'App\\Models\\User')
                        ->whereIn('permission_id', $portalPermIds)
                        ->delete();
                }
            }
        }

        // Ensure portal users don't have a school_id
        DB::table('users')
            ->whereIn('id', function ($q) use ($portalRoles) {
                $q->select('model_id')
                    ->from('model_has_roles')
                    ->join('roles', 'roles.id', '=', 'model_has_roles.role_id')
                    ->where('model_has_roles.model_type', 'App\\Models\\User')
                    ->whereIn('roles.name', $portalRoles);
            })
            ->whereNotNull('school_id')
            ->update(['school_id' => null]);
    }

    public function down(): void {}
};
