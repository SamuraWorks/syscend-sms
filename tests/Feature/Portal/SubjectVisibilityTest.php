<?php

namespace Tests\Feature\Portal;

use App\Models\Staff;
use App\Services\RoleRegistry;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\Concerns\InteractsWithDomain;
use Tests\TestCase;

class SubjectVisibilityTest extends TestCase
{
    use RefreshDatabase, InteractsWithDomain;

    public function test_student_sees_compulsory_class_subjects_without_explicit_enrollment(): void
    {
        $this->seedRolesAndPermissions();

        $school = $this->createSchool();
        $this->activateSchool($school);

        $year = $this->createAcademicYear($school, ['is_current' => true]);
        $class = $this->createClass($school, ['name' => 'JSS 1']);
        $subject = $this->createSubject($school, $class, ['name' => 'Mathematics', 'code' => 'MATH']);
        $this->createSubjectOffering($school, $year, $class, $subject, ['subject_type' => 'compulsory']);

        $user = $this->createUser(['school_id' => $school->id], RoleRegistry::STUDENT);
        $this->createStudent($school, $class, ['user_id' => $user->id]);

        $this->actingAs($user)
            ->get(route('student.subjects'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Student/Subjects')
                ->where('linked', true)
                ->has('subjects', 1)
                ->where('subjects.0.subject_name', 'Mathematics'));
    }

    public function test_teacher_sees_draft_timetable_subjects(): void
    {
        $this->seedRolesAndPermissions();

        $school = $this->createSchool();
        $this->activateSchool($school);

        $class = $this->createClass($school, ['name' => 'JSS 1']);
        $subject = $this->createSubject($school, $class, ['name' => 'Mathematics', 'code' => 'MATH']);

        $user = $this->createTeacher($school);
        $staff = Staff::where('user_id', $user->id)->firstOrFail();

        $this->createTimetable($school, $class, $subject, [
            'teacher_id'  => $staff->id,
            'day_of_week' => 'monday',
            'status'      => 'draft',
        ]);

        $this->actingAs($user)
            ->get(route('teacher.academic'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Teacher/Academic')
                ->where('linked', true)
                ->has('assignedSubjects', 1));
    }
}
