<?php

namespace Tests\Feature\Isolation;

use App\Models\School;
use App\Models\Student;
use App\Services\RoleRegistry;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\InteractsWithDomain;
use Tests\TestCase;

class SchoolLoginIsolationTest extends TestCase
{
    use RefreshDatabase, InteractsWithDomain;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seedRolesAndPermissions();
    }

    private function activeSchool(): School
    {
        $school = $this->createSchool();
        $this->activateSchool($school);

        return $school;
    }

    public function test_user_can_log_in_through_their_school_login_page(): void
    {
        $school = $this->activeSchool();
        $admin = $this->createUser(['school_id' => $school->id]);

        $this->post("/{$school->slug}/login", [
            'email'    => $admin->email,
            'password' => 'password',
        ])->assertRedirect('/dashboard');

        $this->assertAuthenticatedAs($admin);
    }

    public function test_school_scoped_login_rejects_credentials_from_another_school(): void
    {
        $schoolA = $this->activeSchool();
        $schoolB = $this->activeSchool();
        $userB = $this->createUser(['school_id' => $schoolB->id]);

        $this->post("/{$schoolA->slug}/login", [
            'email'    => $userB->email,
            'password' => 'password',
        ])->assertSessionHasErrors('email');

        $this->assertGuest();
    }

    public function test_login_with_school_slug_field_scopes_to_that_school(): void
    {
        $school = $this->activeSchool();
        $admin = $this->createUser(['school_id' => $school->id]);

        $this->post('/login', [
            'email'       => $admin->email,
            'password'    => 'password',
            'school_slug' => $school->slug,
        ])->assertRedirect('/dashboard');

        $this->assertAuthenticatedAs($admin);
    }

    public function test_login_is_rejected_while_school_is_suspended(): void
    {
        $school = $this->activeSchool();
        $school->update(['status' => 'suspended']);

        $admin = $this->createUser(['school_id' => $school->id]);

        $this->post('/login', [
            'email'    => $admin->email,
            'password' => 'password',
        ])->assertSessionHasErrors('email');

        $this->assertGuest();
    }

    public function test_login_against_inactive_school_slug_is_rejected(): void
    {
        $school = $this->activeSchool();
        $school->update(['status' => 'inactive']);

        $admin = $this->createUser(['school_id' => $school->id]);

        $this->post("/{$school->slug}/login", [
            'email'    => $admin->email,
            'password' => 'password',
        ])->assertSessionHasErrors('email');

        $this->assertGuest();
    }

    public function test_school_role_user_without_school_sees_no_scoped_records(): void
    {
        $school = $this->activeSchool();
        $class = $this->createClass($school);
        $this->createStudent($school, $class);

        $disconnected = $this->createUser([], RoleRegistry::SCHOOL_ADMIN);

        $this->actingAs($disconnected);

        $this->assertSame(0, Student::count());
        $this->assertDatabaseCount('students', 1);
    }

    public function test_portal_role_user_sees_scoped_records(): void
    {
        $school = $this->activeSchool();
        $class = $this->createClass($school);
        $this->createStudent($school, $class);

        $this->actingAsSuperAdmin();

        $this->assertSame(1, Student::count());
    }
}