<?php

namespace Tests\Feature\Exams;

use App\Models\Exam;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\InteractsWithDomain;
use Tests\TestCase;

class ExamWorkflowTest extends TestCase
{
    use RefreshDatabase, InteractsWithDomain;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seedRolesAndPermissions();
    }

    private function schoolWithClass(): array
    {
        $school = $this->createSchool();
        $this->activateSchool($school);
        $this->actingAsSchoolAdmin($school);
        $class = $this->createClass($school, ['school_level' => 'junior_secondary']);
        $year = $this->createAcademicYear($school, ['is_current' => true]);
        $term = $this->createAcademicTerm($school, $year, ['name' => 'Term 1']);
        return [$school, $class, $year, $term];
    }

    public function test_exams_index_returns_ok(): void
    {
        [$school, $class] = $this->schoolWithClass();
        $this->createExam($school, $class);

        $this->get(route('school.exams.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('SchoolAdmin/Exams/Index'));
    }

    public function test_exam_can_be_created(): void
    {
        [$school, $class, $year, $term] = $this->schoolWithClass();

        $this->post(route('school.exams.store'), [
            'name'             => 'First Term Test',
            'type'             => 'mid_term',
            'class_id'         => $class->id,
            'status'           => 'draft',
            'term_id'          => $term->id,
            'academic_year_id' => $year->id,
            'max_score'        => 100,
            'assessment_model' => 'final_only',
        ])->assertRedirect()->assertSessionHas('success');

        $this->assertDatabaseHas('exams', [
            'school_id' => $school->id,
            'class_id'  => $class->id,
            'name'      => 'First Term Test',
            'status'    => 'draft',
        ]);
    }

    public function test_exam_store_requires_type(): void
    {
        [$school, $class] = $this->schoolWithClass();

        $this->post(route('school.exams.store'), [
            'name'     => 'Bad Exam',
            'class_id' => $class->id,
            'status'   => 'draft',
        ])->assertSessionHasErrors('type');
    }

    public function test_exam_store_requires_valid_status(): void
    {
        [$school, $class] = $this->schoolWithClass();

        $this->post(route('school.exams.store'), [
            'name'     => 'Bad Exam',
            'type'     => 'final',
            'class_id' => $class->id,
            'status'   => 'archived',
        ])->assertSessionHasErrors('status');
    }

    public function test_exam_can_be_updated(): void
    {
        [$school, $class] = $this->schoolWithClass();
        $exam = $this->createExam($school, $class);

        $this->put(route('school.exams.update', $exam), [
            'name'     => 'Mid Term Revised',
            'type'     => 'mid_term',
            'class_id' => $class->id,
            'status'   => 'draft',
        ])->assertRedirect()->assertSessionHas('success');

        $this->assertDatabaseHas('exams', [
            'id'   => $exam->id,
            'name' => 'Mid Term Revised',
        ]);
    }

    public function test_exam_can_be_deleted(): void
    {
        [$school, $class] = $this->schoolWithClass();
        $exam = $this->createExam($school, $class, ['name' => 'Temp Exam']);

        $this->delete(route('school.exams.destroy', $exam))
            ->assertRedirect()->assertSessionHas('success');

        $this->assertSoftDeleted('exams', ['id' => $exam->id]);
    }

    public function test_exam_can_be_submitted(): void
    {
        [$school, $class] = $this->schoolWithClass();
        $exam = $this->createExam($school, $class, ['status' => 'published']);

        $this->post(route('school.exams.submit', $exam))
            ->assertRedirect()->assertSessionHas('success');

        $this->assertDatabaseHas('exams', [
            'id'           => $exam->id,
            'submitted_by' => auth()->id(),
        ]);
        $this->assertNotNull($exam->fresh()->submitted_at);
    }

    public function test_grade_scale_can_be_added_and_deleted(): void
    {
        [$school, $class] = $this->schoolWithClass();

        $this->post(route('school.grade-scales.store'), [
            'grade'     => 'A+',
            'gpa'       => 5.0,
            'min_marks' => 90,
            'max_marks' => 100,
            'remarks'   => 'Outstanding',
        ])->assertRedirect()->assertSessionHas('success');

        $scale = \App\Models\GradeScale::where('school_id', $school->id)->where('grade', 'A+')->first();
        $this->assertNotNull($scale);

        $this->delete(route('school.grade-scales.destroy', $scale))
            ->assertRedirect()->assertSessionHas('success');

        $this->assertDatabaseMissing('grade_scales', ['id' => $scale->id]);
    }
}