<?php

namespace Tests\Feature\Attendance;

use App\Models\Attendance;
use App\Models\Student;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\InteractsWithDomain;
use Tests\TestCase;

class AttendanceMarkTest extends TestCase
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
        $this->actingAsSchoolAdmin($school);
        $class = $this->createClass($school);
        $student = $this->createStudent($school, $class);
        return [$school, $class, $student];
    }

    public function test_attendance_index_returns_ok(): void
    {
        [$school, $class, $student] = $this->schoolWithStudent();

        $this->get(route('school.attendance.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('SchoolAdmin/Attendance/Index'));
    }

    public function test_attendance_can_be_marked_as_draft(): void
    {
        [$school, $class, $student] = $this->schoolWithStudent();

        $this->post(route('school.attendance.store'), [
            'date'     => now()->toDateString(),
            'class_id' => $class->id,
            'records'  => [
                ['student_id' => $student->id, 'status' => 'present'],
            ],
        ])->assertRedirect()->assertSessionHas('success');

        $this->assertDatabaseHas('attendances', [
            'school_id'       => $school->id,
            'date'            => now()->toDateString(),
            'attendable_type' => Student::class,
            'attendable_id'   => $student->id,
            'status'          => 'present',
            'status_draft'    => 'draft',
        ]);
    }

    public function test_attendance_can_be_submitted_immediately(): void
    {
        [$school, $class, $student] = $this->schoolWithStudent();

        $this->post(route('school.attendance.store'), [
            'date'               => now()->toDateString(),
            'class_id'           => $class->id,
            'submit_immediately' => true,
            'records'            => [
                ['student_id' => $student->id, 'status' => 'absent', 'remarks' => 'Sick'],
            ],
        ])->assertRedirect()->assertSessionHas('success');

        $this->assertDatabaseHas('attendances', [
            'school_id'       => $school->id,
            'attendable_id'   => $student->id,
            'status'          => 'absent',
            'status_draft'    => 'submitted',
        ]);
    }

    public function test_attendance_store_requires_records(): void
    {
        [$school, $class, $student] = $this->schoolWithStudent();

        $this->post(route('school.attendance.store'), [
            'date'     => now()->toDateString(),
            'class_id' => $class->id,
            'records'  => [],
        ])->assertSessionHasErrors('records');
    }

    public function test_attendance_requires_valid_status(): void
    {
        [$school, $class, $student] = $this->schoolWithStudent();

        $this->post(route('school.attendance.store'), [
            'date'     => now()->toDateString(),
            'class_id' => $class->id,
            'records'  => [
                ['student_id' => $student->id, 'status' => 'sleeping'],
            ],
        ])->assertSessionHasErrors('records.0.status');
    }

    public function test_attendance_can_be_submitted_in_bulk(): void
    {
        [$school, $class, $student] = $this->schoolWithStudent();

        $this->post(route('school.attendance.store'), [
            'date'     => now()->toDateString(),
            'class_id' => $class->id,
            'records'  => [
                ['student_id' => $student->id, 'status' => 'present'],
            ],
        ])->assertRedirect();

        $this->post(route('school.attendance.submit'), [
            'date'     => now()->toDateString(),
            'class_id' => $class->id,
        ])->assertRedirect()->assertSessionHas('success');

        $this->assertDatabaseHas('attendances', [
            'school_id'     => $school->id,
            'attendable_id' => $student->id,
            'status_draft'  => 'submitted',
        ]);
    }
}
