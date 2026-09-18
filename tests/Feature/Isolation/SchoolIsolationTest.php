<?php

namespace Tests\Feature\Isolation;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\InteractsWithDomain;
use Tests\TestCase;

class SchoolIsolationTest extends TestCase
{
    use RefreshDatabase, InteractsWithDomain;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seedRolesAndPermissions();
    }

    private function schoolWithStudent(): array
    {
        $school = $this->createSchool();
        $this->activateSchool($school);
        $class = $this->createClass($school);
        $student = $this->createStudent($school, $class);

        return [$school, $class, $student];
    }

    public function test_students_index_is_limited_to_current_school(): void
    {
        [$schoolA, , $ownStudent] = $this->schoolWithStudent();

        $this->schoolWithStudent();

        $this->actingAsSchoolAdmin($schoolA);

        $this->get(route('school.students.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('SchoolAdmin/Students/Index')
                ->where('students.meta.total', 1)
                ->where('students.data.0.id', $ownStudent->id));
    }

    public function test_students_index_ignores_foreign_class_filter(): void
    {
        [$schoolA] = $this->schoolWithStudent();

        [, $foreignClass, $foreignStudent] = $this->schoolWithStudent();

        $this->actingAsSchoolAdmin($schoolA);

        $this->get(route('school.students.index', ['class_id' => $foreignClass->id]))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('SchoolAdmin/Students/Index')
                ->where('students.meta.total', 0));
    }

    public function test_foreign_student_show_is_forbidden(): void
    {
        [$schoolA] = $this->schoolWithStudent();

        [, , $foreignStudent] = $this->schoolWithStudent();

        $this->actingAsSchoolAdmin($schoolA);

        $this->get(route('school.students.show', $foreignStudent))
            ->assertNotFound();
    }

    public function test_platform_user_resolves_sole_school_as_installation_context(): void
    {
        [$school, , $student] = $this->schoolWithStudent();

        $this->actingAsSuperAdmin();

        $this->get(route('school.students.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('SchoolAdmin/Students/Index')
                ->where('students.meta.total', 1)
                ->where('students.data.0.id', $student->id));
    }

    public function test_user_without_school_context_fails_closed(): void
    {
        $this->actingAsSuperAdmin();

        $this->get(route('school.students.index'))
            ->assertNotFound();
    }
}