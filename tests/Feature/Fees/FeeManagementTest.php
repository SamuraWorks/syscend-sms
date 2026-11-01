<?php

namespace Tests\Feature\Fees;

use App\Models\FeeCategory;
use App\Models\Student;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\InteractsWithDomain;
use Tests\TestCase;

class FeeManagementTest extends TestCase
{
    use RefreshDatabase, InteractsWithDomain;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seedAllRolesAndPermissions();
    }

    private function schoolWithClassAndStudent(): array
    {
        $school = $this->createSchool();
        $this->activateSchool($school);
        $this->actingAsSchoolAdmin($school);
        $class = $this->createClass($school, ['school_level' => 'junior_secondary']);
        $student = $this->createStudent($school, $class, ['admission_no' => 'ADM-FEE-001']);
        return [$school, $class, $student];
    }

    public function test_fees_categories_index_returns_ok(): void
    {
        [$school] = $this->schoolWithClassAndStudent();
        $this->createFeeCategory($school);

        $this->get(route('school.fees.categories.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('SchoolAdmin/Fees/Categories'));
    }

    public function test_fee_category_can_be_created(): void
    {
        [$school] = $this->schoolWithClassAndStudent();

        $this->post(route('school.fees.categories.store'), [
            'name'        => 'School Bus',
            'type'        => 'transport',
            'description' => 'Daily transport',
        ])->assertRedirect()->assertSessionHas('success');

        $this->assertDatabaseHas('fee_categories', [
            'school_id' => $school->id,
            'name'      => 'School Bus',
            'type'      => 'transport',
            'is_active' => true,
        ]);
    }

    public function test_fee_category_requires_valid_type(): void
    {
        [$school] = $this->schoolWithClassAndStudent();

        $this->post(route('school.fees.categories.store'), [
            'name' => 'Invalid',
            'type' => 'unknown_type',
        ])->assertSessionHasErrors('type');
    }

    public function test_fee_category_can_be_updated(): void
    {
        [$school] = $this->schoolWithClassAndStudent();
        $category = $this->createFeeCategory($school);

        $this->put(route('school.fees.categories.update', $category), [
            'name'      => 'Boarding Fees',
            'type'      => 'hostel',
            'is_active' => 1,
        ])->assertRedirect()->assertSessionHas('success');

        $this->assertDatabaseHas('fee_categories', [
            'id'   => $category->id,
            'name' => 'Boarding Fees',
            'type' => 'hostel',
        ]);
    }

    public function test_fee_category_can_be_deleted(): void
    {
        [$school] = $this->schoolWithClassAndStudent();
        $category = $this->createFeeCategory($school, ['name' => 'Remove Me']);

        $this->delete(route('school.fees.categories.destroy', $category))
            ->assertRedirect()->assertSessionHas('success');

        $this->assertSoftDeleted('fee_categories', ['id' => $category->id]);
    }

    public function test_fees_structures_index_returns_ok(): void
    {
        [$school, $class] = $this->schoolWithClassAndStudent();
        $category = $this->createFeeCategory($school);
        $this->createFeeStructure($school, $class, $category);

        $this->get(route('school.fees.structures.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('SchoolAdmin/Fees/Structures'));
    }

    public function test_fee_structure_can_be_created(): void
    {
        [$school, $class] = $this->schoolWithClassAndStudent();
        $category = $this->createFeeCategory($school);

        $this->post(route('school.fees.structures.store'), [
            'class_id'        => $class->id,
            'fee_category_id' => $category->id,
            'academic_year'   => '2025-2026',
            'amount'          => 250,
            'frequency'       => 'annual',
            'due_date'        => '2026-01-15',
        ])->assertRedirect()->assertSessionHas('success');

        $this->assertDatabaseHas('fee_structures', [
            'school_id'        => $school->id,
            'class_id'         => $class->id,
            'fee_category_id'  => $category->id,
            'academic_year'    => '2025-2026',
            'amount'           => 250,
            'frequency'        => 'annual',
            'is_active'        => true,
        ]);
    }

    public function test_fee_structure_rejects_negative_amount(): void
    {
        [$school, $class] = $this->schoolWithClassAndStudent();
        $category = $this->createFeeCategory($school);

        $this->post(route('school.fees.structures.store'), [
            'class_id'        => $class->id,
            'fee_category_id' => $category->id,
            'academic_year'   => '2025-2026',
            'amount'          => -10,
            'frequency'       => 'monthly',
        ])->assertSessionHasErrors('amount');
    }

    public function test_fee_structure_can_be_updated(): void
    {
        [$school, $class] = $this->schoolWithClassAndStudent();
        $category = $this->createFeeCategory($school);
        $structure = $this->createFeeStructure($school, $class, $category);

        $this->put(route('school.fees.structures.update', $structure), [
            'class_id'        => $class->id,
            'fee_category_id' => $category->id,
            'academic_year'   => '2026-2027',
            'amount'          => 300,
            'frequency'       => 'quarterly',
        ])->assertRedirect()->assertSessionHas('success');

        $this->assertDatabaseHas('fee_structures', [
            'id'            => $structure->id,
            'academic_year' => '2026-2027',
            'amount'        => 300,
        ]);
    }

    public function test_fee_structure_can_be_deleted(): void
    {
        [$school, $class] = $this->schoolWithClassAndStudent();
        $category = $this->createFeeCategory($school);
        $structure = $this->createFeeStructure($school, $class, $category);

        $this->delete(route('school.fees.structures.destroy', $structure))
            ->assertRedirect()->assertSessionHas('success');

        $this->assertSoftDeleted('fee_structures', ['id' => $structure->id]);
    }

    public function test_fee_collect_page_returns_ok(): void
    {
        [$school, $class, $student] = $this->schoolWithClassAndStudent();
        $category = $this->createFeeCategory($school);
        $structure = $this->createFeeStructure($school, $class, $category);
        $structure->update(['frequency' => 'annual']);

        $this->get(route('school.fees.payments.create', ['student_id' => $student->id]))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('SchoolAdmin/Fees/Collect'));
    }

    public function test_full_cash_payment_is_marked_paid(): void
    {
        [$school, $class, $student] = $this->schoolWithClassAndStudent();
        $category = $this->createFeeCategory($school);
        $structure = $this->createFeeStructure($school, $class, $category);

        $this->post(route('school.fees.payments.store'), [
            'student_id'       => $student->id,
            'fee_structure_id' => $structure->id,
            'amount_due'       => 500,
            'amount_paid'      => 500,
            'payment_date'     => '2026-01-10',
            'method'           => 'cash',
        ])->assertRedirect('/school/fees/payments')->assertSessionHas('success');

        $this->assertDatabaseHas('fee_payments', [
            'school_id'  => $school->id,
            'student_id' => $student->id,
            'amount_paid' => 500,
            'status'     => 'paid',
        ]);
    }

    public function test_partial_payment_is_marked_partial(): void
    {
        [$school, $class, $student] = $this->schoolWithClassAndStudent();
        $category = $this->createFeeCategory($school);
        $structure = $this->createFeeStructure($school, $class, $category);

        $this->post(route('school.fees.payments.store'), [
            'student_id'       => $student->id,
            'fee_structure_id' => $structure->id,
            'amount_due'       => 500,
            'amount_paid'      => 200,
            'payment_date'     => '2026-01-10',
            'method'           => 'cash',
        ])->assertRedirect('/school/fees/payments');

        $this->assertDatabaseHas('fee_payments', [
            'school_id'  => $school->id,
            'student_id' => $student->id,
            'status'     => 'partial',
        ]);
    }

    public function test_payment_requires_student_and_structure(): void
    {
        [$school, , $student] = $this->schoolWithClassAndStudent();

        $this->post(route('school.fees.payments.store'), [
            'amount_due'  => 100,
            'amount_paid' => 100,
            'method'      => 'cash',
        ])->assertSessionHasErrors(['student_id', 'fee_structure_id']);
    }

    public function test_payment_receipt_shows(): void
    {
        [$school, $class, $student] = $this->schoolWithClassAndStudent();
        $category = $this->createFeeCategory($school);
        $structure = $this->createFeeStructure($school, $class, $category);
        $payment = $this->createFeePayment($school, $student, $structure, ['status' => 'paid']);

        $this->get(route('school.fees.payments.show', $payment))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('SchoolAdmin/Fees/Receipt'));
    }

    public function test_outstanding_index_returns_ok(): void
    {
        [$school, $class, $student] = $this->schoolWithClassAndStudent();
        $category = $this->createFeeCategory($school);
        $structure = $this->createFeeStructure($school, $class, $category);
        $this->createFeePayment($school, $student, $structure, ['status' => 'partial']);

        $this->get(route('school.fees.outstanding'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('SchoolAdmin/Fees/Outstanding'));
    }
}