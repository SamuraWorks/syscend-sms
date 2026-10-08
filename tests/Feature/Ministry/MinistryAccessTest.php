<?php

namespace Tests\Feature\Ministry;

use App\Services\RoleRegistry;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Route;
use Tests\Concerns\InteractsWithDomain;
use Tests\TestCase;

class MinistryAccessTest extends TestCase
{
    use RefreshDatabase, InteractsWithDomain;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seedRolesAndPermissions();
        $admin = $this->createUser([], RoleRegistry::MINISTRY_ADMIN);
        $this->actingAs($admin);
    }

    public function test_dashboard_returns_ok(): void
    {
        $this->get(route('ministry.dashboard'))->assertOk();
    }

    public function test_schools_returns_ok(): void
    {
        $this->createSchool();
        $this->get(route('ministry.schools'))->assertOk();
    }

    public function test_school_approvals_returns_ok(): void
    {
        $this->get(route('ministry.schools.approvals'))->assertOk();
    }

    public function test_ministry_cannot_approve_or_reject_schools(): void
    {
        $school = $this->createSchool();

        $this->assertFalse(Route::has('ministry.schools.approve'));
        $this->assertFalse(Route::has('ministry.schools.suspend'));

        $this->post('/ministry/schools/' . $school->id . '/approve')->assertNotFound();
        $this->patch('/ministry/schools/' . $school->id . '/suspend')->assertNotFound();
    }

    public function test_districts_returns_ok(): void
    {
        $this->get(route('ministry.districts'))->assertOk();
    }

    public function test_district_officers_returns_ok(): void
    {
        $this->get(route('ministry.districts.officers'))->assertOk();
    }

    public function test_students_returns_ok(): void
    {
        $this->get(route('ministry.students'))->assertOk();
    }

    public function test_student_analytics_returns_ok(): void
    {
        $this->get(route('ministry.students.analytics'))->assertOk();
    }

    public function test_teachers_returns_ok(): void
    {
        $this->get(route('ministry.teachers'))->assertOk();
    }

    public function test_teacher_licensing_returns_ok(): void
    {
        $this->get(route('ministry.teachers.licensing'))->assertOk();
    }

    public function test_exams_npse_returns_ok(): void
    {
        $this->get(route('ministry.exams.npse'))->assertOk();
    }

    public function test_exams_analytics_returns_ok(): void
    {
        $this->get(route('ministry.exams.analytics'))->assertOk();
    }

    public function test_inspections_returns_ok(): void
    {
        $this->get(route('ministry.inspections'))->assertOk();
    }

    public function test_inspection_ratings_returns_ok(): void
    {
        $this->get(route('ministry.inspections.ratings'))->assertOk();
    }

    public function test_reports_returns_ok(): void
    {
        $this->get(route('ministry.reports'))->assertOk();
    }

    public function test_report_enrollment_returns_ok(): void
    {
        $this->get(route('ministry.reports.enrollment'))->assertOk();
    }

    public function test_report_gender_returns_ok(): void
    {
        $this->get(route('ministry.reports.gender'))->assertOk();
    }

    public function test_communication_announcements_returns_ok(): void
    {
        $this->get(route('ministry.communication.announcements'))->assertOk();
    }

    public function test_downloads_returns_ok(): void
    {
        $this->get(route('ministry.downloads'))->assertOk();
    }

    public function test_school_admin_cannot_access_ministry(): void
    {
        auth()->logout();

        $school = $this->createSchool();
        $this->actingAsSchoolAdmin($school);

        $response = $this->get(route('ministry.dashboard'));
        $this->assertNotSame(200, $response->getStatusCode());
    }
}