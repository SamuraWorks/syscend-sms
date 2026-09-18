<?php

namespace Tests\Feature\Students;

use App\Models\Guardian;
use App\Models\Student;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\InteractsWithDomain;
use Tests\TestCase;

class StudentCrudTest extends TestCase
{
    use RefreshDatabase, InteractsWithDomain;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seedRolesAndPermissions();
    }

    private function schoolWithContext(): array
    {
        $school = $this->createSchool();
        $this->activateSchool($school);
        $this->actingAsSchoolAdmin($school);
        return [$school];
    }

    public function test_students_index_returns_ok(): void
    {
        [$school] = $this->schoolWithContext();
        $class = $this->createClass($school);
        $this->createStudent($school, $class);

        $this->get(route('school.students.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('SchoolAdmin/Students/Index'));
    }

    public function test_students_index_filters_by_status(): void
    {
        [$school] = $this->schoolWithContext();
        $class = $this->createClass($school);
        $this->createStudent($school, $class, ['status' => 'active']);

        $this->get(route('school.students.index', ['status' => 'active']))
            ->assertOk();
    }

    public function test_students_create_page_returns_ok(): void
    {
        [$school] = $this->schoolWithContext();
        $this->createClass($school);

        $this->get(route('school.students.create'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('SchoolAdmin/Students/Create'));
    }

    public function test_student_can_be_admitted(): void
    {
        [$school] = $this->schoolWithContext();
        $class = $this->createClass($school);

        $this->post(route('school.students.store'), [
            'first_name'    => 'Aminata',
            'last_name'     => 'Kamara',
            'gender'        => 'female',
            'category'      => 'general',
            'status'        => 'active',
            'class_id'      => $class->id,
            'admission_no'  => 'ADM-2026-001',
            'guardian' => [
                'name'     => 'Fatmata Kamara',
                'relation' => 'Mother',
                'phone'    => '+23276000001',
            ],
        ])->assertRedirect(route('school.students.index'))->assertSessionHas('success');

        $this->assertDatabaseHas('students', [
            'school_id'    => $school->id,
            'class_id'     => $class->id,
            'first_name'   => 'Aminata',
            'admission_no' => 'ADM-2026-001',
        ]);

        $this->assertDatabaseHas('guardians', [
            'school_id' => $school->id,
            'name'      => 'Fatmata Kamara',
        ]);
    }

    public function test_student_store_requires_class(): void
    {
        [$school] = $this->schoolWithContext();

        $this->post(route('school.students.store'), [
            'first_name' => 'Zainab',
            'gender'     => 'female',
            'category'   => 'general',
            'status'     => 'active',
            'guardian'   => ['name' => 'Test Parent', 'relation' => 'Mother'],
        ])->assertSessionHasErrors('class_id');
    }

    public function test_student_store_requires_guardian(): void
    {
        [$school] = $this->schoolWithContext();
        $class = $this->createClass($school);

        $this->post(route('school.students.store'), [
            'first_name' => 'Zainab',
            'gender'     => 'female',
            'category'   => 'general',
            'status'     => 'active',
            'class_id'   => $class->id,
        ])->assertSessionHasErrors(['guardian.name', 'guardian.relation']);
    }

    public function test_student_store_rejects_section_from_another_class(): void
    {
        [$school] = $this->schoolWithContext();
        $classA = $this->createClass($school, ['name' => 'JSS 1']);
        $classB = $this->createClass($school, ['name' => 'JSS 2']);
        $sectionB = $this->createSection($school, $classB);

        $this->post(route('school.students.store'), [
            'first_name' => 'Isatu',
            'gender'     => 'female',
            'category'   => 'general',
            'status'     => 'active',
            'class_id'   => $classA->id,
            'section_id' => $sectionB->id,
            'guardian'   => ['name' => 'Test Parent', 'relation' => 'Mother'],
        ])->assertRedirect()->assertSessionHas('error');

        $this->assertDatabaseMissing('students', ['first_name' => 'Isatu']);
    }

    public function test_student_can_be_viewed(): void
    {
        [$school] = $this->schoolWithContext();
        $class = $this->createClass($school);
        $student = $this->createStudent($school, $class);
        $this->createGuardian($school);

        $this->get(route('school.students.show', $student))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('SchoolAdmin/Students/Show'));
    }

    public function test_student_can_be_edited(): void
    {
        [$school] = $this->schoolWithContext();
        $class = $this->createClass($school);
        $student = $this->createStudent($school, $class);

        $this->get(route('school.students.edit', $student))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('SchoolAdmin/Students/Edit'));
    }

    public function test_student_can_be_updated(): void
    {
        [$school] = $this->schoolWithContext();
        $class = $this->createClass($school);
        $student = $this->createStudent($school, $class, ['first_name' => 'John', 'admission_no' => 'ADM-0001']);
        $guardian = $this->createGuardian($school, ['name' => 'Jane Doe']);
        $student->update(['guardian_id' => $guardian->id]);

        $this->put(route('school.students.update', $student), [
            'first_name'   => 'Johnny',
            'last_name'    => 'Doe',
            'gender'       => 'male',
            'category'     => 'general',
            'status'       => 'active',
            'class_id'     => $class->id,
            'admission_no' => $student->admission_no,
            'guardian'     => [
                'name'     => 'Jane Doe',
                'relation' => 'Father',
            ],
        ])->assertRedirect(route('school.students.show', $student))->assertSessionHas('success');

        $this->assertDatabaseHas('students', [
            'id'         => $student->id,
            'first_name' => 'Johnny',
        ]);
    }

    public function test_student_can_be_removed(): void
    {
        [$school] = $this->schoolWithContext();
        $class = $this->createClass($school);
        $student = $this->createStudent($school, $class);

        $this->delete(route('school.students.destroy', $student))
            ->assertRedirect(route('school.students.index'))->assertSessionHas('success');

        $this->assertSoftDeleted('students', ['id' => $student->id]);
    }

    public function test_students_are_isolated_by_school(): void
    {
        [$school] = $this->schoolWithContext();
        $class = $this->createClass($school);
        $this->createStudent($school, $class, ['first_name' => 'Local']);

        $other = $this->createSchool();
        $otherClass = $this->createClass($other, ['name' => 'Other']);
        $this->createStudent($other, $otherClass, ['first_name' => 'Foreign']);

        $this->get(route('school.students.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->where('students.data', function ($rows) {
                return collect($rows)->every(fn ($s) => $s['first_name'] !== 'Foreign');
            }));
    }
}