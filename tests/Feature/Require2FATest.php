<?php

namespace Tests\Feature;

use App\Models\School;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class Require2FATest extends TestCase
{
    use RefreshDatabase;

    private School $school;
    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();

        $this->school = School::create([
            'name'           => 'Test School',
            'slug'           => 'test-school-' . uniqid(),
            'email'          => 'admin@test.com',
            'phone'          => '+1234567890',
            'address'        => '123 Test St',
            'city'           => 'Test City',
            'country'        => 'US',
            'plan'           => 'standard',
            'max_students'   => 500,
            'max_teachers'   => 50,
            'timezone'       => 'UTC',
            'date_format'    => 'Y-m-d',
            'currency'       => 'USD',
            'currency_symbol'=> '$',
            'working_days'   => 'monday,tuesday,wednesday,thursday,friday',
            'school_opening_time' => '08:00',
            'school_closing_time' => '15:00',
            'clock_format'   => '24h',
            'is_configured'  => true,
        ]);

        Role::firstOrCreate(['name' => 'super-admin', 'guard_name' => 'web']);

        $this->admin = User::create([
            'name'     => 'Super Admin',
            'email'    => 'super@test.com',
            'password' => Hash::make('password'),
            'school_id'=> $this->school->id,
            'is_active'=> true,
        ]);
        $this->admin->assignRole('super-admin');
    }

    public function test_super_admin_without_2fa_can_access_dashboard(): void
    {
        $response = $this->actingAs($this->admin)->get('/super-admin/dashboard');
        $response->assertOk();
    }

    public function test_super_admin_with_2fa_enabled_is_redirected_to_verify(): void
    {
        $this->admin->update([
            'two_factor_enabled' => true,
            'two_factor_secret'  => 'JBSWY3DPEHPK3PXP',
        ]);

        $response = $this->actingAs($this->admin)->get('/super-admin/dashboard');
        $response->assertRedirect(route('super-admin.2fa.verify-form'));
    }

    public function test_super_admin_with_verified_session_can_access_dashboard(): void
    {
        $this->admin->update([
            'two_factor_enabled' => true,
            'two_factor_secret'  => 'JBSWY3DPEHPK3PXP',
        ]);

        $response = $this->actingAs($this->admin)
            ->withSession(['2fa_verified' => true])
            ->get('/super-admin/dashboard');

        $response->assertOk();
    }

    public function test_2fa_verify_route_is_accessible_when_2fa_enabled(): void
    {
        $this->admin->update([
            'two_factor_enabled' => true,
            'two_factor_secret'  => 'JBSWY3DPEHPK3PXP',
        ]);

        $response = $this->actingAs($this->admin)->get('/super-admin/2fa/verify');
        $response->assertOk();
    }
}