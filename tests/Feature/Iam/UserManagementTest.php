<?php

namespace Tests\Feature\Iam;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\InteractsWithDomain;
use Tests\TestCase;

class UserManagementTest extends TestCase
{
    use RefreshDatabase, InteractsWithDomain;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seedAllRolesAndPermissions();
    }

    private function schoolWithAdmin(): array
    {
        $school = $this->createSchool();
        $this->activateSchool($school);
        $admin = $this->actingAsSchoolAdmin($school);
        return [$school, $admin];
    }

    public function test_admins_index_returns_ok(): void
    {
        [$school, $admin] = $this->schoolWithAdmin();
        $this->createUser(['school_id' => $school->id], 'teacher');

        $this->get(route('school.settings.admins'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('SchoolAdmin/Settings/Admins'));
    }

    public function test_user_can_be_created(): void
    {
        [$school] = $this->schoolWithAdmin();

        $this->post(route('school.settings.admins.store'), [
            'name'     => 'New Accountant',
            'email'    => 'accountant@example.com',
            'roles'    => ['accountant'],
            'status'   => 'active',
        ])->assertRedirect()->assertSessionHas('user_created');

        $this->assertDatabaseHas('users', [
            'school_id' => $school->id,
            'name'      => 'New Accountant',
            'email'     => 'accountant@example.com',
            'status'    => 'active',
        ]);

        $user = \App\Models\User::where('email', 'accountant@example.com')->firstOrFail();
        $this->assertTrue($user->hasRole('accountant'));
    }

    public function test_user_store_requires_valid_role(): void
    {
        [$school] = $this->schoolWithAdmin();

        $this->post(route('school.settings.admins.store'), [
            'name'   => 'Hacker',
            'email'  => 'hacker@example.com',
            'roles'  => ['super-admin'],
            'status' => 'active',
        ])->assertSessionHasErrors('roles.0');
    }

    public function test_user_store_requires_unique_email(): void
    {
        [$school, $admin] = $this->schoolWithAdmin();

        $this->post(route('school.settings.admins.store'), [
            'name'   => 'Duplicate',
            'email'  => $admin->email,
            'roles'  => ['teacher'],
            'status' => 'active',
        ])->assertSessionHasErrors('email');
    }

    public function test_user_can_be_updated(): void
    {
        [$school] = $this->schoolWithAdmin();
        $user = $this->createUser(['school_id' => $school->id], 'teacher');

        $this->put(route('school.settings.admins.update', $user), [
            'name'   => 'Renamed User',
            'email'  => $user->email,
            'roles'  => ['teacher'],
            'status' => 'active',
        ])->assertRedirect()->assertSessionHas('success');

        $this->assertDatabaseHas('users', [
            'id'   => $user->id,
            'name' => 'Renamed User',
        ]);
    }

    public function test_user_can_be_suspended_and_activated(): void
    {
        [$school] = $this->schoolWithAdmin();
        $user = $this->createUser(['school_id' => $school->id], 'teacher');

        $this->patch(route('school.settings.admins.suspend', $user))
            ->assertRedirect()->assertSessionHas('success');
        $this->assertSame('suspended', $user->fresh()->status);

        $this->patch(route('school.settings.admins.activate', $user))
            ->assertRedirect()->assertSessionHas('success');
        $this->assertSame('active', $user->fresh()->status);
    }

    public function test_user_password_can_be_reset(): void
    {
        [$school] = $this->schoolWithAdmin();
        $user = $this->createUser(['school_id' => $school->id], 'teacher');

        $this->post(route('school.settings.admins.reset-password', $user))
            ->assertRedirect()->assertSessionHas('reset_password');

        $this->assertTrue($user->fresh()->force_password_change);
    }

    public function test_user_can_be_deleted(): void
    {
        [$school] = $this->schoolWithAdmin();
        $user = $this->createUser(['school_id' => $school->id], 'teacher');

        $this->delete(route('school.settings.admins.destroy', $user))
            ->assertRedirect()->assertSessionHas('success');

        $this->assertSoftDeleted('users', ['id' => $user->id]);
    }

    public function test_cannot_manage_user_from_another_school(): void
    {
        [$school, $admin] = $this->schoolWithAdmin();
        $otherSchool = $this->createSchool();
        $otherUser = $this->createUser(['school_id' => $otherSchool->id], 'teacher');

        $this->put(route('school.settings.admins.update', $otherUser), [
            'name'   => 'Intruder',
            'email'  => $otherUser->email,
            'roles'  => ['teacher'],
            'status' => 'active',
        ])->assertForbidden();
    }

    public function test_teacher_without_manage_users_cannot_create_user(): void
    {
        [$school] = $this->schoolWithAdmin();
        $teacher = $this->createUser(['school_id' => $school->id], 'teacher');
        $this->actingAs($teacher);

        $this->post(route('school.settings.admins.store'), [
            'name'   => 'Sneaky',
            'email'  => 'sneaky@example.com',
            'roles'  => ['teacher'],
            'status' => 'active',
        ])->assertForbidden();
    }
}