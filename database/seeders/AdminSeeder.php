<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;
use Spatie\Permission\Models\Role;

class AdminSeeder extends Seeder
{
    public function run(): void
    {
        $email    = env('SYSADMIN_EMAIL', 'syscend@gmail.com');
        $password = (string) (env('SYSADMIN_PASSWORD')
            ?: env('SEED_ADMIN_PASSWORD')
            ?: Str::random(20));

        // ── Super Admin (platform owner) ──────────────────────────
        $superAdmin = User::firstOrCreate(
            ['email' => $email],
            [
                'name'     => 'Super Admin',
                'password' => bcrypt($password),
                'phone'    => null,
                'status'   => 'active',
                'is_temporary_password' => true,
                'must_change_password' => true,
            ]
        );
        $superAdmin->assignRole('super-admin');
        if (env('SYSADMIN_PASSWORD') || env('SEED_ADMIN_PASSWORD')) {
            $superAdmin->forceFill(['password' => bcrypt($password)])->save();
        }

        // ── Ministry Admin ────────────────────────────────────────
        $ministryAdmin = User::firstOrCreate(
            ['email' => 'ministry@syscend.com'],
            [
                'name'     => 'Ministry Admin',
                'password' => bcrypt($password),
                'phone'    => '+23279630777',
                'status'   => 'active',
                'is_temporary_password' => true,
                'must_change_password' => true,
            ]
        );
        $ministryAdmin->assignRole('ministry-admin');

        // ── District Officer ──────────────────────────────────────
        $districtOfficer = User::firstOrCreate(
            ['email' => 'district@syscend.com'],
            [
                'name'     => 'District Officer',
                'password' => bcrypt($password),
                'phone'    => '+23279630777',
                'status'   => 'active',
                'is_temporary_password' => true,
                'must_change_password' => true,
            ]
        );
        $districtOfficer->assignRole('district-officer');

        $this->command->info('Platform administrators seeded:');
        $this->command->info('  Super Admin       : ' . $email);
        $this->command->info('  Ministry Admin    : ministry@syscend.com');
        $this->command->info('  District Officer  : district@syscend.com');
        $this->command->warn('  IMPORTANT: Passwords come from env (SYSADMIN_PASSWORD / SEED_ADMIN_PASSWORD)');
        $this->command->warn('  or a fresh random value; never from source code. Change on first login.');
    }
}
