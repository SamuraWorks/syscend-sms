<?php

namespace Tests\Feature;

use App\Models\{School, SchoolClass, Staff, Subject, Timetable, User};
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Auth;
use Tests\Concerns\InteractsWithDomain;
use Tests\TestCase;

class TimetablePublishTest extends TestCase
{
    use RefreshDatabase, InteractsWithDomain;

    private School $school;
    private User $admin;
    private SchoolClass $class;
    private Subject $subject;
    private Staff $teacher;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seedRolesAndPermissions();

        $this->school = $this->createSchool();
        $this->activateSchool($this->school);

        $this->admin = $this->createUser(['school_id' => $this->school->id]);

        $this->class = SchoolClass::create([
            'school_id'     => $this->school->id,
            'name'          => 'JSS 1',
            'numeric_name'  => 1,
        ]);

        $this->subject = Subject::create([
            'school_id' => $this->school->id,
            'class_id'  => $this->class->id,
            'name'      => 'English',
            'code'      => 'ENG01',
        ]);

        $this->teacher = Staff::create([
            'school_id'     => $this->school->id,
            'first_name'    => 'John',
            'last_name'     => 'Teacher',
            'gender'        => 'male',
            'email'         => 'teacher@test.com',
            'status'        => 'active',
            'teacher_type'  => 'teaching',
        ]);
    }

    public function test_timetable_defaults_to_published_for_existing_data(): void
    {
        Auth::login($this->admin);

        $timetable = Timetable::create([
            'school_id'   => $this->school->id,
            'class_id'    => $this->class->id,
            'subject_id'  => $this->subject->id,
            'teacher_id'  => $this->teacher->id,
            'day_of_week' => 'monday',
            'start_time'  => '08:00',
            'end_time'    => '08:45',
            'status'      => 'published',
        ]);

        $this->assertEquals('published', $timetable->fresh()->status);
    }

    public function test_publish_action_sets_status(): void
    {
        Auth::login($this->admin);

        $timetable = Timetable::create([
            'school_id'   => $this->school->id,
            'class_id'    => $this->class->id,
            'subject_id'  => $this->subject->id,
            'teacher_id'  => $this->teacher->id,
            'day_of_week' => 'monday',
            'start_time'  => '08:00',
            'end_time'    => '08:45',
            'status'      => 'draft',
        ]);

        $response = $this->post('/school/timetable/publish', [
            'class_id' => $this->class->id,
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('timetables', [
            'id'     => $timetable->id,
            'status' => 'published',
        ]);
    }

    public function test_unpublish_action_sets_draft(): void
    {
        Auth::login($this->admin);

        $timetable = Timetable::create([
            'school_id'   => $this->school->id,
            'class_id'    => $this->class->id,
            'subject_id'  => $this->subject->id,
            'teacher_id'  => $this->teacher->id,
            'day_of_week' => 'monday',
            'start_time'  => '08:00',
            'end_time'    => '08:45',
            'status'      => 'published',
        ]);

        $response = $this->post('/school/timetable/unpublish', [
            'class_id' => $this->class->id,
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('timetables', [
            'id'     => $timetable->id,
            'status' => 'draft',
        ]);
    }

    public function test_teacher_conflict_check_prevents_duplicate(): void
    {
        Auth::login($this->admin);

        Timetable::create([
            'school_id'   => $this->school->id,
            'class_id'    => $this->class->id,
            'subject_id'  => $this->subject->id,
            'teacher_id'  => $this->teacher->id,
            'day_of_week' => 'monday',
            'start_time'  => '08:00',
            'end_time'    => '08:45',
            'status'      => 'published',
        ]);

        // A different class collides only on the teacher, so the teacher
        // conflict rule (not the class conflict rule) must reject it.
        $otherClass = SchoolClass::create([
            'school_id'    => $this->school->id,
            'name'         => 'JSS 2',
            'numeric_name' => 2,
        ]);

        $response = $this->post('/school/timetable', [
            'class_id'    => $otherClass->id,
            'subject_id'  => $this->subject->id,
            'teacher_id'  => $this->teacher->id,
            'day_of_week' => 'monday',
            'start_time'  => '08:00',
            'end_time'    => '08:45',
        ]);

        $response->assertSessionHasErrors('teacher_id');
    }
}