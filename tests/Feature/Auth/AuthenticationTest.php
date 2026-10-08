<?php

namespace Tests\Feature\Auth;

use App\Mail\AdminResetPasswordRequestMail;
use App\Models\School;
use App\Models\User;
use App\Services\RoleRegistry;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Password;
use Tests\Concerns\InteractsWithDomain;
use Tests\TestCase;

class AuthenticationTest extends TestCase
{
    use RefreshDatabase, InteractsWithDomain;

    private School $school;
    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seedRolesAndPermissions();

        $this->school = $this->createSchool();
        $this->activateSchool($this->school);

        $this->admin = $this->createUser(['school_id' => $this->school->id]);
    }

    public function test_guest_can_view_login_page(): void
    {
        $this->get('/login')->assertOk();
    }

    public function test_guest_can_view_register_page(): void
    {
        $this->get('/register')->assertOk();
    }

    public function test_guest_can_view_forgot_password_page(): void
    {
        $this->get('/forgot-password')->assertOk();
    }

    public function test_user_can_log_in_with_correct_credentials(): void
    {
        $this->post('/login', [
            'email'    => $this->admin->email,
            'password' => 'password',
        ])->assertRedirect('/dashboard');

        $this->assertAuthenticatedAs($this->admin);
    }

    public function test_login_rejects_wrong_password(): void
    {
        $this->post('/login', [
            'email'    => $this->admin->email,
            'password' => 'not-the-password',
        ])->assertSessionHasErrors('email');

        $this->assertGuest();
    }

    public function test_login_requires_email_and_password(): void
    {
        $this->post('/login', [])
            ->assertSessionHasErrors(['email', 'password']);

        $this->assertGuest();
    }

    public function test_user_can_log_out(): void
    {
        Auth::login($this->admin);

        $this->post('/logout')
            ->assertRedirect('/login');

        $this->assertGuest();
    }

    public function test_dashboard_redirects_school_admin_to_school_dashboard(): void
    {
        $this->actingAs($this->admin)
            ->get('/dashboard')
            ->assertRedirect(route('school.reports.dashboard'));
    }

    public function test_dashboard_redirects_super_admin_to_super_admin_dashboard(): void
    {
        $superAdmin = $this->createSuperAdmin();

        $this->actingAs($superAdmin)
            ->get('/dashboard')
            ->assertRedirect('/super-admin/dashboard');
    }

    public function test_dashboard_kicks_user_without_role_back_to_login(): void
    {
        $noRole = $this->createUser([
            'school_id' => $this->school->id,
        ], 'nonexistent-role');

        $noRole->syncRoles([]);

        $this->actingAs($noRole)
            ->get('/dashboard')
            ->assertRedirect('/login');
    }

    public function test_temporary_password_user_is_forced_to_change_password(): void
    {
        $temporary = $this->createUser([
            'school_id'              => $this->school->id,
            'is_temporary_password'  => true,
            'must_change_password'   => true,
            'force_password_change'  => true,
        ]);

        $this->actingAs($temporary)
            ->get('/dashboard')
            ->assertRedirect('/password/change');

        $this->actingAs($temporary)
            ->get('/school/students')
            ->assertRedirect('/password/change');
    }

    public function test_user_can_change_password_and_reach_dashboard(): void
    {
        Auth::login($this->admin);

        $this->put('/profile/password', [
            'current_password'      => 'password',
            'password'              => 'brand-new-pass',
            'password_confirmation' => 'brand-new-pass',
        ])->assertRedirect('/dashboard');

        $this->assertNotEquals('password', $this->admin->fresh()->password);
    }

    public function test_password_change_requires_valid_current_password(): void
    {
        Auth::login($this->admin);

        $this->put('/profile/password', [
            'current_password'      => 'wrong-current',
            'password'              => 'brand-new-pass',
            'password_confirmation' => 'brand-new-pass',
        ])->assertSessionHasErrors('current_password');
    }

    public function test_forgot_password_notifies_platform_admin(): void
    {
        Mail::fake();

        $this->post('/forgot-password', ['email' => $this->admin->email])
            ->assertSessionHas('success');

        Mail::assertSent(AdminResetPasswordRequestMail::class, function (AdminResetPasswordRequestMail $mail) {
            return $mail->hasTo('syscend@gmail.com')
                && $mail->user->is($this->admin);
        });

        $this->assertDatabaseCount('password_reset_tokens', 0);
    }

    public function test_password_can_be_reset_and_used_to_log_in(): void
    {
        $token = Password::broker()->createToken($this->admin);
        $this->assertDatabaseCount('password_reset_tokens', 1);

        $this->get('/reset-password/' . $token)->assertOk();

        $newPassword = 'reset-1234';

        $this->post('/reset-password', [
            'token'                 => $token,
            'email'                 => $this->admin->email,
            'password'              => $newPassword,
            'password_confirmation' => $newPassword,
        ])->assertRedirect('/login');

        $this->assertDatabaseCount('password_reset_tokens', 0);

        $this->post('/login', [
            'email'    => $this->admin->email,
            'password' => $newPassword,
        ])->assertRedirect('/dashboard');
    }

    public function test_login_is_rate_limited_after_five_failed_attempts(): void
    {
        $email = $this->admin->email;

        for ($i = 0; $i < 5; $i++) {
            $this->post('/login', [
                'email'    => $email,
                'password' => 'wrong-password',
            ])->assertSessionHasErrors('email');
        }

        $this->post('/login', [
            'email'    => $email,
            'password' => 'wrong-password',
        ])->assertStatus(429);
    }
}