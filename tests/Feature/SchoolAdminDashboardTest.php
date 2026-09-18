<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\InteractsWithDomain;
use Tests\TestCase;

class SchoolAdminDashboardTest extends TestCase
{
    use RefreshDatabase, InteractsWithDomain;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seedRolesAndPermissions();
    }

    public function test_school_admin_can_view_dashboard(): void
    {
        $school = $this->createSchool();
        $this->activateSchool($school);
        $this->actingAsSchoolAdmin($school);

        $this->get(route('school.reports.dashboard'))
            ->assertOk();
    }

    public function test_school_admin_is_redirected_when_subscription_inactive(): void
    {
        $school = $this->createSchool();
        $this->actingAsSchoolAdmin($school);

        $this->get(route('school.reports.dashboard'))
            ->assertRedirect('/dashboard')
            ->assertSessionHas('error');
    }

    public function test_unconfigured_school_is_redirected_to_school_setup(): void
    {
        $school = $this->createSchool(['is_configured' => false]);
        $this->activateSchool($school);
        $this->actingAsSchoolAdmin($school);

        $this->get(route('school.reports.dashboard'))
            ->assertRedirect()
            ->assertSessionHas('warning');
    }

    public function test_super_admin_can_view_dashboard(): void
    {
        $school = $this->createSchool();
        $this->activateSchool($school);
        $this->actingAsSuperAdmin();

        $this->get('/super-admin/dashboard')
            ->assertOk();
    }
}