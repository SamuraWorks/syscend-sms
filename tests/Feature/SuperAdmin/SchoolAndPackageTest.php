<?php

namespace Tests\Feature\SuperAdmin;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\InteractsWithDomain;
use Tests\TestCase;

class SchoolAndPackageTest extends TestCase
{
    use RefreshDatabase, InteractsWithDomain;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seedRolesAndPermissions();
        $this->actingAsSuperAdmin();
    }

    public function test_schools_index_returns_ok(): void
    {
        $school = $this->createSchool();

        $this->get(route('super-admin.schools.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('SuperAdmin/Schools/Index'));
    }

    public function test_school_can_be_created(): void
    {
        $this->post(route('super-admin.schools.store'), [
            'name'    => 'Freetown Secondary School',
            'email'   => 'fss@example.com',
            'phone'   => '+23276123456',
            'country' => 'SL',
        ])->assertRedirect(route('super-admin.schools.index'))->assertSessionHas('success');

        $this->assertDatabaseHas('schools', [
            'name'  => 'Freetown Secondary School',
            'email' => 'fss@example.com',
            'slug'  => 'freetown-secondary-school',
        ]);
    }

    public function test_school_store_requires_name(): void
    {
        $this->post(route('super-admin.schools.store'), [])
            ->assertSessionHasErrors('name');
    }

    public function test_school_can_be_updated(): void
    {
        $school = $this->createSchool(['name' => 'Old Name']);

        $this->put(route('super-admin.schools.update', $school), [
            'name'  => 'Liberty Academy',
            'phone' => '+23270222222',
        ])->assertRedirect(route('super-admin.schools.index'));

        $this->assertDatabaseHas('schools', [
            'id'    => $school->id,
            'name'  => 'Liberty Academy',
        ]);
    }

    public function test_school_can_be_suspended_and_activated(): void
    {
        $school = $this->createSchool();

        $this->patch(route('super-admin.schools.suspend', $school))
            ->assertRedirect()->assertSessionHas('success');
        $this->assertSame('suspended', $school->fresh()->status);

        $this->patch(route('super-admin.schools.activate', $school))
            ->assertRedirect()->assertSessionHas('success');
        $this->assertSame('active', $school->fresh()->status);
    }

    public function test_school_can_be_deleted(): void
    {
        $school = $this->createSchool();

        $this->delete(route('super-admin.schools.destroy', $school))
            ->assertRedirect(route('super-admin.schools.index'));

        $this->assertSoftDeleted('schools', ['id' => $school->id]);
    }

    public function test_packages_index_returns_ok(): void
    {
        $this->createPackage();

        $this->get(route('super-admin.packages.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('SuperAdmin/Packages/Index'));
    }

    public function test_package_can_be_created(): void
    {
        $this->post(route('super-admin.packages.store'), [
            'name'          => 'Enterprise Plan',
            'description'   => 'For large schools',
            'price_monthly'  => 300,
            'price_yearly'   => 3000,
            'price_per_term'=> 1600,
            'max_students'  => 5000,
            'max_staff'     => 300,
            'storage_gb'    => 100,
            'modules'       => ['students', 'fees', 'exams'],
        ])->assertRedirect()->assertSessionHas('success');

        $this->assertDatabaseHas('packages', [
            'name'          => 'Enterprise Plan',
            'slug'          => 'enterprise-plan',
            'price_monthly' => 300,
            'is_active'     => true,
        ]);

        $package = \App\Models\Package::where('slug', 'enterprise-plan')->firstOrFail();
        $this->assertSame(3, $package->modules()->count());
    }

    public function test_package_store_requires_pricing_and_limits(): void
    {
        $this->post(route('super-admin.packages.store'), [
            'name' => 'Incomplete',
        ])->assertSessionHasErrors(['price_monthly', 'price_yearly', 'max_students', 'max_staff', 'storage_gb']);
    }

    public function test_package_rejects_unknown_module(): void
    {
        $this->post(route('super-admin.packages.store'), [
            'name'          => 'HackPlan',
            'price_monthly' => 10,
            'price_yearly'  => 100,
            'max_students'  => 10,
            'max_staff'     => 10,
            'storage_gb'    => 5,
            'modules'       => ['crypto'],
        ])->assertSessionHasErrors('modules.0');
    }

    public function test_package_can_be_updated(): void
    {
        $package = $this->createPackage();

        $this->put(route('super-admin.packages.update', $package), [
            'name'          => 'Standard Plan',
            'description'   => 'Mid tier',
            'price_monthly'  => 150,
            'price_yearly'   => 1500,
            'price_per_term'=> 800,
            'max_students'  => 1500,
            'max_staff'     => 150,
            'storage_gb'    => 50,
        ])->assertRedirect()->assertSessionHas('success');

        $this->assertDatabaseHas('packages', [
            'id'            => $package->id,
            'name'          => 'Standard Plan',
            'price_monthly' => 150,
        ]);
    }

    public function test_package_can_be_deleted(): void
    {
        $package = $this->createPackage();

        $this->delete(route('super-admin.packages.destroy', $package))
            ->assertRedirect()->assertSessionHas('success');

        $this->assertSoftDeleted('packages', ['id' => $package->id]);
    }

    public function test_subscriptions_index_returns_ok(): void
    {
        $school = $this->createSchool();
        $package = $this->createPackage();
        $this->createSubscription($school, $package);

        $this->get(route('super-admin.subscriptions.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('SuperAdmin/Subscriptions/Index'));
    }

    public function test_subscription_can_be_created(): void
    {
        $school = $this->createSchool();
        $package = $this->createPackage();

        $this->post(route('super-admin.subscriptions.store'), [
            'school_id'      => $school->id,
            'package_id'     => $package->id,
            'start_date'     => '2026-01-01',
            'end_date'       => '2026-12-31',
            'term_number'    => 1,
            'price_per_term' => 5000,
            'status'         => 'active',
            'is_trial'       => 1,
        ])->assertRedirect()->assertSessionHas('success');

        $this->assertDatabaseHas('school_subscriptions', [
            'school_id'      => $school->id,
            'package_id'     => $package->id,
            'status'         => 'active',
            'price_per_term' => 5000,
        ]);
    }

    public function test_subscription_store_requires_valid_term(): void
    {
        $school = $this->createSchool();
        $package = $this->createPackage();

        $this->post(route('super-admin.subscriptions.store'), [
            'school_id'      => $school->id,
            'package_id'     => $package->id,
            'start_date'     => '2026-01-01',
            'end_date'       => '2026-06-30',
            'term_number'    => 5,
            'price_per_term' => 100,
            'status'         => 'active',
        ])->assertSessionHasErrors('term_number');
    }

    public function test_super_admin_dashboard_returns_ok(): void
    {
        $this->get(route('super-admin.dashboard'))
            ->assertOk();
    }
}