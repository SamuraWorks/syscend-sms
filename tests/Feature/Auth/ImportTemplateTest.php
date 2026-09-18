<?php

namespace Tests\Feature;

use App\Models\{School, User};
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Auth;
use Tests\Concerns\InteractsWithDomain;
use Tests\TestCase;

class ImportTemplateTest extends TestCase
{
    use RefreshDatabase, InteractsWithDomain;

    private School $school;
    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seedRolesAndPermissions();

        $this->school = $this->createSchool();
        $this->activateSchool($this->school);

        $this->admin = $this->createUser(['school_id' => $this->school->id]);
    }

    public function test_student_template_download(): void
    {
        Auth::login($this->admin);

        $response = $this->get('/school-admin/imports/template/students');
        $response->assertStatus(200)
            ->assertHeaderContains('Content-Disposition', 'students_import_template.xlsx');
    }

    public function test_staff_template_download(): void
    {
        Auth::login($this->admin);

        $response = $this->get('/school-admin/imports/template/staff');
        $response->assertStatus(200)
            ->assertHeaderContains('Content-Disposition', 'staff_import_template.xlsx');
    }

    public function test_parent_template_download(): void
    {
        Auth::login($this->admin);

        $response = $this->get('/school-admin/imports/template/parents');
        $response->assertStatus(200)
            ->assertHeaderContains('Content-Disposition', 'parents_import_template.xlsx');
    }

    public function test_curriculum_template_download(): void
    {
        Auth::login($this->admin);

        $response = $this->get('/school-admin/imports/template/curriculum');
        $response->assertStatus(200)
            ->assertHeaderContains('Content-Disposition', 'curriculum_import_template.xlsx');
    }

    public function test_timetable_template_download(): void
    {
        Auth::login($this->admin);

        $response = $this->get('/school-admin/imports/template/timetables');
        $response->assertStatus(200)
            ->assertHeaderContains('Content-Disposition', 'timetables_import_template.xlsx');
    }

    public function test_invalid_type_returns_404(): void
    {
        Auth::login($this->admin);

        $response = $this->get('/school-admin/imports/template/invalid_type');
        $response->assertStatus(404);
    }
}