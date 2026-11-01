<?php

namespace Tests\Feature\Hr;

use App\Models\City;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\InteractsWithDomain;
use Tests\TestCase;

class StaffLeavePayrollTest extends TestCase
{
    use RefreshDatabase, InteractsWithDomain;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seedAllRolesAndPermissions();
    }

    private function schoolWithStaff(): array
    {
        $school = $this->createSchool();
        $this->activateSchool($school);
        $this->actingAsSchoolAdmin($school);
        $staff = $this->createStaff($school, [
            'first_name' => 'Mohamed',
            'last_name'  => 'Koroma',
            'gender'     => 'male',
            'status'     => 'active',
        ]);
        return [$school, $staff];
    }

    public function test_staff_index_returns_ok(): void
    {
        [$school, $staff] = $this->schoolWithStaff();

        $this->get(route('school.staff.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('SchoolAdmin/Staff/Index'));
    }

    public function test_staff_can_be_created(): void
    {
        [$school] = $this->schoolWithStaff();

        $this->post(route('school.staff.store'), [
            'first_name'  => 'Aminata',
            'last_name'   => 'Bangura',
            'gender'      => 'female',
            'salary_type' => 'fixed',
            'salary'      => 1800,
            'status'      => 'active',
        ])->assertRedirect(route('school.staff.index'));

        $this->assertDatabaseHas('staff', [
            'school_id'  => $school->id,
            'first_name' => 'Aminata',
            'last_name'  => 'Bangura',
        ]);
    }

    public function test_staff_store_requires_gender(): void
    {
        [$school] = $this->schoolWithStaff();

        $this->post(route('school.staff.store'), [
            'first_name'  => 'No Gender',
            'salary_type' => 'fixed',
            'status'      => 'active',
        ])->assertSessionHasErrors('gender');
    }

    public function test_staff_can_be_viewed(): void
    {
        [$school, $staff] = $this->schoolWithStaff();

        $this->get(route('school.staff.show', $staff))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('SchoolAdmin/Staff/Show'));
    }

    public function test_staff_can_be_updated(): void
    {
        [$school, $staff] = $this->schoolWithStaff();

        $this->put(route('school.staff.update', $staff), [
            'first_name'  => 'Mohamed',
            'last_name'   => 'Sesay',
            'gender'      => 'male',
            'salary_type' => 'fixed',
            'salary'      => 2000,
            'status'      => 'active',
        ])->assertRedirect(route('school.staff.show', $staff));

        $this->assertDatabaseHas('staff', [
            'id'        => $staff->id,
            'last_name' => 'Sesay',
        ]);
    }

    public function test_staff_can_be_deleted(): void
    {
        [$school, $staff] = $this->schoolWithStaff();

        $this->delete(route('school.staff.destroy', $staff))
            ->assertRedirect(route('school.staff.index'));

        $this->assertSoftDeleted('staff', ['id' => $staff->id]);
    }

    public function test_leave_types_index_returns_ok(): void
    {
        [$school] = $this->schoolWithStaff();
        $this->createLeaveType($school);

        $this->get(route('school.hr.leave-types.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('SchoolAdmin/HR/LeaveTypes'));
    }

    public function test_leave_type_can_be_created(): void
    {
        [$school] = $this->schoolWithStaff();

        $this->post(route('school.hr.leave-types.store'), [
            'name'              => 'Maternity Leave',
            'max_days_per_year' => 90,
            'is_paid'           => 1,
        ])->assertRedirect()->assertSessionHas('success');

        $this->assertDatabaseHas('leave_types', [
            'school_id'         => $school->id,
            'name'              => 'Maternity Leave',
            'max_days_per_year' => 90,
        ]);
    }

    public function test_leave_type_rejects_excessive_days(): void
    {
        [$school] = $this->schoolWithStaff();

        $this->post(route('school.hr.leave-types.store'), [
            'name'              => 'Sabbatical',
            'max_days_per_year' => 500,
        ])->assertSessionHasErrors('max_days_per_year');
    }

    public function test_leave_type_can_be_deleted(): void
    {
        [$school] = $this->schoolWithStaff();
        $type = $this->createLeaveType($school);

        $this->delete(route('school.hr.leave-types.destroy', $type))
            ->assertRedirect()->assertSessionHas('success');

        $this->assertSoftDeleted('leave_types', ['id' => $type->id]);
    }

    public function test_leave_requests_index_returns_ok(): void
    {
        [$school, $staff] = $this->schoolWithStaff();
        $type = $this->createLeaveType($school);

        $this->post(route('school.hr.leaves.store'), [
            'staff_id'      => $staff->id,
            'leave_type_id' => $type->id,
            'start_date'    => '2026-02-01',
            'end_date'      => '2026-02-05',
            'reason'        => 'Medical',
        ])->assertRedirect()->assertSessionHas('success');

        $this->get(route('school.hr.leaves.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('SchoolAdmin/HR/Leaves'));
    }

    public function test_leave_request_requires_valid_dates(): void
    {
        [$school, $staff] = $this->schoolWithStaff();
        $type = $this->createLeaveType($school);

        $this->post(route('school.hr.leaves.store'), [
            'staff_id'      => $staff->id,
            'leave_type_id' => $type->id,
            'start_date'    => '2026-03-10',
            'end_date'      => '2026-03-01',
        ])->assertSessionHasErrors('end_date');
    }

    public function test_payroll_index_returns_ok(): void
    {
        [$school, $staff] = $this->schoolWithStaff();
        $this->createSalaryStructure($school, $staff, ['basic_salary' => 1500]);
        $this->createPayroll($school, $staff, ['month_year' => '2026-01']);

        $this->get(route('school.hr.payroll.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('SchoolAdmin/HR/Payroll'));
    }

    public function test_salary_structure_can_be_saved(): void
    {
        [$school, $staff] = $this->schoolWithStaff();

        $this->put(route('school.hr.salary-structure.save', $staff), [
            'basic_salary' => 2200,
            'allowances'   => [
                ['label' => 'Housing', 'amount' => 300],
            ],
        ])->assertRedirect()->assertSessionHas('success');

        $this->assertDatabaseHas('salary_structures', [
            'school_id'    => $school->id,
            'staff_id'     => $staff->id,
            'basic_salary' => 2200,
        ]);
    }

    public function test_salary_structure_requires_basic_salary(): void
    {
        [$school, $staff] = $this->schoolWithStaff();

        $this->put(route('school.hr.salary-structure.save', $staff), [])
            ->assertSessionHasErrors('basic_salary');
    }

    public function test_payroll_can_be_generated(): void
    {
        [$school, $staff] = $this->schoolWithStaff();
        $this->createSalaryStructure($school, $staff, ['basic_salary' => 1500]);

        $this->post(route('school.hr.payroll.generate'), [
            'month_year'   => '2026-02',
            'working_days' => 20,
        ])->assertRedirect()->assertSessionHas('success');

        $this->assertDatabaseHas('payrolls', [
            'school_id'   => $school->id,
            'month_year'  => '2026-02',
            'staff_id'    => $staff->id,
        ]);
    }
}