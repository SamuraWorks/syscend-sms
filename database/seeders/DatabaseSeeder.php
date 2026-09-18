<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use \Illuminate\Database\Console\Seeds\WithoutModelEvents;

    public function run(): void
    {
        $this->call([
            PermissionSeeder::class,       // roles + permissions (basic)
            RolePermissionSeeder::class,   // granular permissions + ministry/district roles
            AdminSeeder::class,            // Super Admin + Ministry Admin + District Officer
            MinistrySeeder::class,         // 15 districts of Sierra Leone
            SierraLeoneSetupSeeder::class, // grade scales, assessment types, academic terms
        ]);
    }
}
