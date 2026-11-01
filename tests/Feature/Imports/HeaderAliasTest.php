<?php

namespace Tests\Feature\Imports;

use App\Models\ImportJob;
use App\Services\StudentImportService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Tests\Concerns\InteractsWithDomain;
use Tests\TestCase;

class HeaderAliasTest extends TestCase
{
    use RefreshDatabase, InteractsWithDomain;

    private $school;
    private $user;

    private function makeStudentJob(string $csv, array $options = []): ImportJob
    {
        Storage::fake('private');
        Storage::disk('private')->put('imports/aliases.csv', $csv);

        return ImportJob::create([
            'school_id'      => $this->school->id,
            'user_id'        => $this->user->id,
            'import_type'    => 'students',
            'file_name'      => 'aliases.csv',
            'file_path'      => 'imports/aliases.csv',
            'file_type'      => 'csv',
            'status'         => 'uploaded',
            'import_options' => $options,
        ]);
    }

    protected function setUp(): void
    {
        parent::setUp();

        $this->seedRolesAndPermissions();
        $this->school = $this->createSchool();
        $this->activateSchool($this->school);
        $this->user = $this->createUser(['school_id' => $this->school->id]);
        $this->createClass($this->school, ['name' => 'JSS 1']);
    }

    public function test_student_import_accepts_common_header_aliases(): void
    {
        $job = $this->makeStudentJob(
            "First Name,Last Name,Sex,Class\nJohn,Kamara,male,JSS 1\n"
        );

        $result = (new StudentImportService($this->school->id))->validateRows($job);

        $this->assertSame([], $result['errors'], print_r($result['errors'], true));
        $this->assertCount(1, $result['valid']);
        $this->assertSame('JSS 1', $result['valid'][0]['class_name']);
    }

    public function test_persisted_ai_column_mapping_is_applied_during_parsing(): void
    {
        $job = $this->makeStudentJob(
            "Learner,Surname,Sex,Classroom\nJohn,Kamara,male,JSS 1\n",
            [
                'column_mapping' => [
                    'mappings' => [
                        ['source_column' => 'Learner', 'target_field' => 'first_name'],
                        ['source_column' => 'Surname', 'target_field' => 'last_name'],
                        ['source_column' => 'Sex', 'target_field' => 'gender'],
                        ['source_column' => 'Classroom', 'target_field' => 'class_name'],
                    ],
                ],
            ]
        );

        $result = (new StudentImportService($this->school->id))->validateRows($job);

        $this->assertSame([], $result['errors'], print_r($result['errors'], true));
        $this->assertCount(1, $result['valid']);
        $this->assertSame('John', $result['valid'][0]['first_name']);
        $this->assertSame('Kamara', $result['valid'][0]['last_name']);
        $this->assertSame('JSS 1', $result['valid'][0]['class_name']);
    }
}
