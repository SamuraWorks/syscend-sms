<?php

namespace Tests\Feature\Imports;

use App\Models\ImportJob;
use App\Services\StudentImportService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Tests\Concerns\InteractsWithDomain;
use Tests\TestCase;

class ClassNameMatchingTest extends TestCase
{
    use RefreshDatabase, InteractsWithDomain;

    private $school;
    private $user;

    private function makeStudentJob(string $csv): ImportJob
    {
        Storage::fake('private');
        Storage::disk('private')->put('imports/classes.csv', $csv);

        return ImportJob::create([
            'school_id'   => $this->school->id,
            'user_id'     => $this->user->id,
            'import_type' => 'students',
            'file_name'   => 'classes.csv',
            'file_path'   => 'imports/classes.csv',
            'file_type'   => 'csv',
            'status'      => 'uploaded',
        ]);
    }

    protected function setUp(): void
    {
        parent::setUp();

        $this->seedRolesAndPermissions();
        $this->school = $this->createSchool();
        $this->activateSchool($this->school);
        $this->user = $this->createUser(['school_id' => $this->school->id]);
    }

    public function test_class_match_ignores_case_padding_and_non_breaking_spaces(): void
    {
        $this->createClass($this->school, ['name' => 'Grade 6']);

        // Surrounding space, mixed case and a non-breaking space all appear in
        // real spreadsheets; all must still resolve to the stored class.
        $job = $this->makeStudentJob(
            "First Name,Last Name,Sex,Class\nJohn,Kamara,male,  gRaDe\xC2\xA06  \n"
        );

        $result = (new StudentImportService($this->school->id))->validateRows($job);

        $this->assertSame([], $result['errors'], print_r($result['errors'], true));
        $this->assertCount(1, $result['valid']);
    }

    public function test_missing_class_error_lists_available_classes(): void
    {
        $this->createClass($this->school, ['name' => 'Grade 5']);
        $this->createClass($this->school, ['name' => 'Grade 6']);

        $job = $this->makeStudentJob(
            "First Name,Last Name,Sex,Class\nJohn,Kamara,male,Grade 7\n"
        );

        $result = (new StudentImportService($this->school->id))->validateRows($job);

        $this->assertArrayHasKey(2, $result['errors']);
        $message = implode(' ', $result['errors'][2]);
        $this->assertStringContainsString("class_name 'Grade 7' not found.", $message);
        $this->assertStringContainsString('Available classes: Grade 5, Grade 6.', $message);
    }
}
