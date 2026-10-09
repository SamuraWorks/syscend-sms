<?php

namespace Tests\Feature\Iam;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\InteractsWithDomain;
use Tests\TestCase;

class SchoolUserRoleAssignmentTest extends TestCase
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

    public function test_iam_pages_render(): void
    {
        [$school] = $this->schoolWithAdmin();
        $user = $this->createUser(['school_id' => $school->id], 'teacher');

        $this->get(route('school.users.index'))->assertOk();
        $this->get(route('school.users.create'))->assertOk();
        $this->get(route('school.users.show', $user))->assertOk();
        $this->get(route('school.users.edit', $user))->assertOk();
    }

    public function test_non_staff_role_can_be_assigned(): void
    {
        [$school] = $this->schoolWithAdmin();
        $user = $this->createUser(['school_id' => $school->id], 'accountant');

        $this->put(route('school.users.roles.update', $user), ['roles' => ['librarian']])
            ->assertRedirect()
            ->assertSessionHasNoErrors();

        $this->assertTrue($user->fresh()->hasRole('librarian'));
    }

    public function test_staff_role_assignment_creates_staff_record(): void
    {
        [$school] = $this->schoolWithAdmin();
        $user = $this->createUser(['school_id' => $school->id], 'accountant');

        $this->put(route('school.users.roles.update', $user), ['roles' => ['teacher']])
            ->assertRedirect()
            ->assertSessionHasNoErrors();

        $this->assertDatabaseHas('staff', [
            'school_id' => $school->id,
            'user_id'   => $user->id,
        ]);
    }

    public function test_second_staff_role_assignment_does_not_collide_on_emp_id(): void
    {
        [$school] = $this->schoolWithAdmin();

        $first = $this->createUser(['school_id' => $school->id], 'accountant');
        $second = $this->createUser(['school_id' => $school->id], 'receptionist');

        $this->put(route('school.users.roles.update', $first), ['roles' => ['teacher']])
            ->assertRedirect()
            ->assertSessionHasNoErrors();

        $this->put(route('school.users.roles.update', $second), ['roles' => ['teacher']])
            ->assertRedirect()
            ->assertSessionHasNoErrors();

        $this->assertDatabaseCount('staff', 2);
    }
}
