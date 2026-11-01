<?php

namespace Tests\Feature\Academics;

use App\Models\SchoolClass;
use App\Models\Subject;
use App\Models\SubjectOffering;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\InteractsWithDomain;
use Tests\TestCase;

class ClassSubjectSectionTest extends TestCase
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

    public function test_classes_index_returns_ok(): void
    {
        [$school] = $this->schoolWithContext();
        $this->createClass($school, ['name' => 'JSS 1']);

        $this->get(route('school.classes.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('SchoolAdmin/Classes/Index'));
    }

    public function test_class_can_be_created(): void
    {
        [$school] = $this->schoolWithContext();

        $this->post(route('school.classes.store'), [
            'name'         => 'SSS 1',
            'short_name'   => 'SS1',
            'numeric_name' => 10,
            'capacity'     => 40,
            'school_level' => 'senior_secondary',
            'level_order'  => 4,
            'description'  => 'Senior Secondary 1',
            'is_active'    => true,
        ])->assertRedirect()->assertSessionHas('success');

        $this->assertDatabaseHas('classes', [
            'school_id' => $school->id,
            'name'      => 'SSS 1',
            'school_level' => 'senior_secondary',
        ]);
    }

    public function test_class_name_duplicate_is_rejected(): void
    {
        [$school] = $this->schoolWithContext();
        $this->createClass($school, ['name' => 'JSS 1']);

        $this->post(route('school.classes.store'), ['name' => 'JSS 1'])
            ->assertSessionHasErrors('name');
    }

    public function test_class_store_requires_name(): void
    {
        [$school] = $this->schoolWithContext();

        $this->post(route('school.classes.store'), ['school_level' => 'primary'])
            ->assertSessionHasErrors('name');
    }

    public function test_class_can_be_updated(): void
    {
        [$school] = $this->schoolWithContext();
        $class = $this->createClass($school, ['name' => 'JSS 1']);

        $this->put(route('school.classes.update', $class), [
            'name'    => 'JSS 1B',
            'capacity' => 50,
        ])->assertRedirect()->assertSessionHas('success');

        $this->assertDatabaseHas('classes', [
            'id'       => $class->id,
            'school_id' => $school->id,
            'name'     => 'JSS 1B',
            'capacity' => 50,
        ]);
    }

    public function test_class_status_can_be_toggled(): void
    {
        [$school] = $this->schoolWithContext();
        $class = $this->createClass($school, ['name' => 'JSS 1', 'is_active' => true]);

        $this->post(route('school.classes.toggle-status', $class))
            ->assertRedirect()->assertSessionHas('success');

        $this->assertDatabaseHas('classes', ['id' => $class->id, 'is_active' => false]);
    }

    public function test_class_with_students_cannot_be_deleted(): void
    {
        [$school] = $this->schoolWithContext();
        $class = $this->createClass($school);
        $this->createStudent($school, $class);

        $this->delete(route('school.classes.destroy', $class))
            ->assertSessionHasErrors('delete');

        $this->assertDatabaseHas('classes', ['id' => $class->id]);
    }

    public function test_class_can_be_deleted_when_no_dependencies(): void
    {
        [$school] = $this->schoolWithContext();
        $class = $this->createClass($school, ['name' => 'Temp Class']);

        $this->delete(route('school.classes.destroy', $class))
            ->assertRedirect()->assertSessionHas('success');

        $this->assertSoftDeleted('classes', ['id' => $class->id]);
    }

    public function test_sections_index_returns_ok(): void
    {
        [$school] = $this->schoolWithContext();
        $class = $this->createClass($school);
        $this->createSection($school, $class);

        $this->get(route('school.sections.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('SchoolAdmin/Sections/Index'));
    }

    public function test_section_can_be_created(): void
    {
        [$school] = $this->schoolWithContext();
        $class = $this->createClass($school);

        $this->post(route('school.sections.store'), [
            'class_id'     => $class->id,
            'name'         => 'Section B',
            'section_code' => 'B',
            'capacity'     => 30,
            'classroom'    => 'Room 2',
        ])->assertRedirect()->assertSessionHas('success');

        $this->assertDatabaseHas('sections', [
            'school_id' => $school->id,
            'class_id'  => $class->id,
            'name'      => 'Section B',
        ]);
    }

    public function test_section_duplicate_in_same_class_is_rejected(): void
    {
        [$school] = $this->schoolWithContext();
        $class = $this->createClass($school);
        $this->createSection($school, $class, ['name' => 'Section A']);

        $this->post(route('school.sections.store'), [
            'class_id' => $class->id,
            'name'     => 'Section A',
        ])->assertSessionHasErrors('name');
    }

    public function test_section_store_requires_class_id(): void
    {
        [$school] = $this->schoolWithContext();

        $this->post(route('school.sections.store'), ['name' => 'Section X'])
            ->assertSessionHasErrors('class_id');
    }

    public function test_section_can_be_updated(): void
    {
        [$school] = $this->schoolWithContext();
        $class = $this->createClass($school);
        $section = $this->createSection($school, $class, ['name' => 'Section A']);

        $this->put(route('school.sections.update', $section), [
            'class_id' => $class->id,
            'name'     => 'Section A1',
            'capacity' => 25,
        ])->assertRedirect()->assertSessionHas('success');

        $this->assertDatabaseHas('sections', ['id' => $section->id, 'name' => 'Section A1']);
    }

    public function test_section_can_be_deleted(): void
    {
        [$school] = $this->schoolWithContext();
        $class = $this->createClass($school);
        $section = $this->createSection($school, $class, ['name' => 'Section A']);

        $this->delete(route('school.sections.destroy', $section))
            ->assertRedirect()->assertSessionHas('success');

        $this->assertSoftDeleted('sections', ['id' => $section->id]);
    }

    public function test_subjects_index_returns_ok(): void
    {
        [$school] = $this->schoolWithContext();
        $class = $this->createClass($school);
        $this->createSubject($school, $class);

        $this->get(route('school.subjects.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('SchoolAdmin/Subjects/Index'));
    }

    public function test_subject_can_be_created_and_offered_in_current_year(): void
    {
        [$school] = $this->schoolWithContext();
        $class = $this->createClass($school, ['school_level' => 'senior_secondary']);
        $this->createAcademicYear($school, ['is_current' => true]);

        $this->post(route('school.subjects.store'), [
            'class_id' => $class->id,
            'name'     => 'Physics',
            'code'     => 'PHY',
            'type'     => 'theory',
            'full_marks' => 100,
            'pass_marks' => 40,
        ])->assertRedirect()->assertSessionHas('success');

        $this->assertDatabaseHas('subjects', [
            'school_id' => $school->id,
            'name'      => 'Physics',
            'type'      => 'theory',
        ]);

        $this->assertDatabaseHas('subject_offerings', [
            'school_id'     => $school->id,
            'class_id'      => $class->id,
            'subject_code'  => 'PHY',
            'is_active'     => true,
        ]);
    }

    public function test_subject_requires_type(): void
    {
        [$school] = $this->schoolWithContext();
        $class = $this->createClass($school);

        $this->post(route('school.subjects.store'), [
            'class_id' => $class->id,
            'name'     => 'Chemistry',
        ])->assertSessionHasErrors('type');
    }

    public function test_subject_with_offerings_cannot_be_deleted(): void
    {
        [$school] = $this->schoolWithContext();
        $class = $this->createClass($school);
        $year = $this->createAcademicYear($school, ['is_current' => true]);
        $subject = $this->createSubject($school, $class, ['name' => 'Biology', 'code' => 'BIO']);
        $this->createSubjectOffering($school, $year, $class, $subject);

        $this->delete(route('school.subjects.destroy', $subject))
            ->assertSessionHasErrors('delete');

        $this->assertDatabaseHas('subjects', ['id' => $subject->id]);
    }

    public function test_subject_status_can_be_toggled(): void
    {
        [$school] = $this->schoolWithContext();
        $class = $this->createClass($school);
        $subject = $this->createSubject($school, $class, ['name' => 'English', 'code' => 'ENG', 'is_active' => true]);

        $this->post(route('school.subjects.toggle-status', $subject))
            ->assertRedirect()->assertSessionHas('success');

        $this->assertDatabaseHas('subjects', ['id' => $subject->id, 'is_active' => false]);
    }

    public function test_school_isolation_blocks_other_schools_classes(): void
    {
        [$school] = $this->schoolWithContext();
        $other = $this->createSchool();
        $otherClass = $this->createClass($other, ['name' => 'Other JSS 1']);

        $this->get(route('school.classes.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->whereNot('classes.data', fn ($rows) => collect($rows)->contains('id', '=', $otherClass->id)));
    }
}