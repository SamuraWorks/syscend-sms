<?php

namespace Tests\Feature\Academics;

use App\Models\AcademicTerm;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\InteractsWithDomain;
use Tests\TestCase;

class AcademicTermsTest extends TestCase
{
    use RefreshDatabase, InteractsWithDomain;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seedAllRolesAndPermissions();
    }

    private function schoolWithContext(): array
    {
        $school = $this->createSchool();
        $this->activateSchool($school);
        $this->actingAsSchoolAdmin($school);
        return [$school];
    }

    public function test_academic_terms_index_returns_ok(): void
    {
        [$school] = $this->schoolWithContext();
        $this->createAcademicYear($school);

        $this->get(route('school.academic-terms.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('SchoolAdmin/AcademicTerms/Index'));
    }

    public function test_academic_term_can_be_created(): void
    {
        [$school] = $this->schoolWithContext();
        $year = $this->createAcademicYear($school);

        $this->post(route('school.academic-terms.store'), [
            'academic_year_id' => $year->id,
            'name'             => 'Term 2',
            'start_date'       => '2026-01-05',
            'end_date'         => '2026-04-10',
        ])->assertRedirect()->assertSessionHas('success');

        $this->assertDatabaseHas('academic_terms', [
            'school_id'        => $school->id,
            'academic_year_id' => $year->id,
            'name'             => 'Term 2',
        ]);
    }

    public function test_academic_term_store_requires_academic_year(): void
    {
        [$school] = $this->schoolWithContext();

        $this->post(route('school.academic-terms.store'), [
            'name'       => 'Term 1',
            'start_date' => '2026-01-05',
            'end_date'   => '2026-04-10',
        ])->assertSessionHasErrors('academic_year_id');
    }

    public function test_academic_term_rejects_end_before_start(): void
    {
        [$school] = $this->schoolWithContext();
        $year = $this->createAcademicYear($school);

        $this->post(route('school.academic-terms.store'), [
            'academic_year_id' => $year->id,
            'name'             => 'Term 1',
            'start_date'       => '2026-04-10',
            'end_date'         => '2026-01-05',
        ])->assertSessionHasErrors('end_date');
    }

    public function test_academic_term_can_be_marked_current(): void
    {
        [$school] = $this->schoolWithContext();
        $year = $this->createAcademicYear($school);

        $this->post(route('school.academic-terms.store'), [
            'academic_year_id' => $year->id,
            'name'             => 'Term 1',
            'start_date'       => '2026-01-05',
            'end_date'         => '2026-04-10',
            'is_current'       => true,
        ])->assertRedirect()->assertSessionHas('success');

        $this->assertSame(1, AcademicTerm::where('school_id', $school->id)->where('is_current', true)->count());
    }

    public function test_academic_term_can_be_updated(): void
    {
        [$school] = $this->schoolWithContext();
        $year = $this->createAcademicYear($school);
        $term = $this->createAcademicTerm($school, $year);

        $this->put(route('school.academic-terms.update', $term), [
            'name'       => 'Term 1 Revised',
            'start_date' => '2026-01-05',
            'end_date'   => '2026-04-10',
        ])->assertRedirect()->assertSessionHas('success');

        $this->assertDatabaseHas('academic_terms', ['id' => $term->id, 'name' => 'Term 1 Revised']);
    }

    public function test_academic_term_can_be_deleted(): void
    {
        [$school] = $this->schoolWithContext();
        $year = $this->createAcademicYear($school);
        $term = $this->createAcademicTerm($school, $year);

        $this->delete(route('school.academic-terms.destroy', $term))
            ->assertRedirect()->assertSessionHas('success');

        $this->assertSoftDeleted('academic_terms', ['id' => $term->id]);
    }

    public function test_shift_can_be_created(): void
    {
        [$school] = $this->schoolWithContext();

        $this->post(route('school.shifts.store'), [
            'name'       => 'Morning Shift',
            'start_time' => '07:30',
            'end_time'   => '14:00',
        ])->assertRedirect()->assertSessionHas('success');

        $this->assertDatabaseHas('shifts', [
            'school_id'  => $school->id,
            'name'       => 'Morning Shift',
            'start_time' => '07:30',
        ]);
    }

    public function test_shift_requires_valid_times(): void
    {
        [$school] = $this->schoolWithContext();

        $this->post(route('school.shifts.store'), [
            'name'       => 'Bad Shift',
            'start_time' => '14:00',
            'end_time'   => '07:00',
        ])->assertSessionHasErrors('end_time');
    }

    public function test_shift_can_be_updated_and_deleted(): void
    {
        [$school] = $this->schoolWithContext();
        $shift = \App\Models\Shift::create([
            'school_id'  => $school->id,
            'name'       => 'Afternoon',
            'start_time' => '12:00',
            'end_time'   => '18:00',
        ]);

        $this->put(route('school.shifts.update', $shift), [
            'name'       => 'Afternoon Updated',
            'start_time' => '12:30',
            'end_time'   => '18:30',
        ])->assertRedirect()->assertSessionHas('success');

        $this->assertDatabaseHas('shifts', ['id' => $shift->id, 'name' => 'Afternoon Updated']);

        $this->delete(route('school.shifts.destroy', $shift))
            ->assertRedirect()->assertSessionHas('success');

        $this->assertSoftDeleted('shifts', ['id' => $shift->id]);
    }

    public function test_holiday_can_be_created(): void
    {
        [$school] = $this->schoolWithContext();

        $this->post(route('school.holidays.store'), [
            'name'        => 'Independence Day',
            'date'        => '2026-04-27',
            'description' => 'National holiday',
        ])->assertRedirect()->assertSessionHas('success');

        $this->assertDatabaseHas('holidays', [
            'school_id' => $school->id,
            'name'      => 'Independence Day',
            'date'      => '2026-04-27',
        ]);
    }

    public function test_holiday_requires_date(): void
    {
        [$school] = $this->schoolWithContext();

        $this->post(route('school.holidays.store'), ['name' => 'No Date'])
            ->assertSessionHasErrors('date');
    }

    public function test_holiday_can_be_updated_and_deleted(): void
    {
        [$school] = $this->schoolWithContext();
        $holiday = \App\Models\Holiday::create([
            'school_id' => $school->id,
            'name'      => 'Easter',
            'date'      => '2026-04-03',
        ]);

        $this->put(route('school.holidays.update', $holiday), [
            'name' => 'Easter Break',
            'date' => '2026-04-02',
        ])->assertRedirect()->assertSessionHas('success');

        $this->assertDatabaseHas('holidays', ['id' => $holiday->id, 'name' => 'Easter Break']);

        $this->delete(route('school.holidays.destroy', $holiday))
            ->assertRedirect()->assertSessionHas('success');
    }

    public function test_academic_settings_can_be_saved(): void
    {
        [$school] = $this->schoolWithContext();

        $this->post(route('school.settings.academic'), [
            'academic_year'  => '2025-2026',
            'terms_per_year' => 3,
            'grading_scale'  => 'percentage',
            'pass_mark'      => 50,
        ])->assertRedirect()->assertSessionHas('success');

        $this->assertDatabaseHas('school_settings', [
            'school_id' => $school->id,
            'key'       => 'academic_year',
            'value'     => '2025-2026',
        ]);
    }
}