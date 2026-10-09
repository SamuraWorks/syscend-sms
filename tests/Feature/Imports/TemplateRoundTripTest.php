<?php

namespace Tests\Feature\Imports;

use App\Models\{ImportJob, School, User};
use App\Services\StaffImportService;
use App\Services\StudentImportService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Tests\Concerns\InteractsWithDomain;
use Tests\TestCase;

class TemplateRoundTripTest extends TestCase
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

    private function uploadTemplate(string $type, string $content): ImportJob
    {
        Auth::login($this->admin);

        Storage::fake('private');

        $this->post("/school-admin/imports/upload/{$type}", [
            'file' => UploadedFile::fake()->createWithContent("{$type}_import_template.xlsx", $content),
        ])->assertRedirect();

        return ImportJob::query()->forType($type)->orderByDesc('id')->firstOrFail();
    }

    public function test_students_template_downloads_and_round_trips(): void
    {
        Auth::login($this->admin);

        $content = $this->get('/school-admin/imports/template/students')->streamedContent();

        $this->assertNotEmpty($content);

        $job = $this->uploadTemplate('students', $content);
        $rows = (new StudentImportService($this->school->id))->parseFile($job);

        $this->assertCount(4, $rows);
        $this->assertArrayHasKey('class_name', $rows[0]);
        $this->assertSame('John', $rows[0]['first_name']);
        $this->assertSame('STU001', $rows[0]['student_id_no']);
        $this->assertArrayNotHasKey('middle_name', $rows[0]);
    }

    public function test_staff_template_downloads_and_round_trips(): void
    {
        Auth::login($this->admin);

        $content = $this->get('/school-admin/imports/template/staff')->streamedContent();

        $this->assertNotEmpty($content);

        $job = $this->uploadTemplate('staff', $content);
        $rows = (new StaffImportService($this->school->id))->parseFile($job);

        $this->assertCount(4, $rows);
        $this->assertArrayHasKey('teacher_type', $rows[0]);
        $this->assertSame('Sarah', $rows[0]['first_name']);
        $this->assertArrayNotHasKey('middle_name', $rows[0]);
    }
}
