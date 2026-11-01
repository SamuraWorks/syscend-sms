<?php

namespace Tests\Feature\AI;

use App\Models\ImportJob;
use App\Models\School;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Tests\Concerns\InteractsWithDomain;
use Tests\TestCase;

class ImportColumnMappingTest extends TestCase
{
    use InteractsWithDomain;
    use RefreshDatabase;

    private School $school;
    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seedAllRolesAndPermissions();

        config([
            'ai.enabled'                  => true,
            'ai.ai_features_enabled'      => true,
            'ai.providers.openai.api_key' => 'sk-test-key',
            'ai.providers.gemini.api_key' => null,
        ]);

        $this->school = $this->createSchool(['is_configured' => true]);
        $this->activateSchool($this->school);
        $this->admin = $this->actingAsSchoolAdmin($this->school);
    }

    private function makeJob(string $contents, string $type = 'students'): ImportJob
    {
        Storage::disk('private')->put('imports/test-import.csv', $contents);

        return ImportJob::create([
            'school_id'   => $this->school->id,
            'user_id'     => $this->admin->id,
            'import_type' => $type,
            'file_name'   => 'test-import.csv',
            'file_path'   => 'imports/test-import.csv',
            'file_type'   => 'csv',
            'status'      => 'uploaded',
        ]);
    }

    private function fakeMapping(array $mappings, string $summary = 'Looks good.'): void
    {
        $content = json_encode(['mappings' => $mappings, 'summary' => $summary]);

        Http::fake([
            'api.openai.com/*' => Http::response([
                'output' => [[
                    'type'    => 'message',
                    'content' => [['type' => 'output_text', 'text' => $content]],
                ]],
                'usage'  => ['input_tokens' => 30, 'output_tokens' => 60, 'total_tokens' => 90],
                'model'  => 'gpt-4o-mini',
            ], 200),
        ]);
    }

    public function test_it_suggests_a_column_mapping_and_persists_it(): void
    {
        $job = $this->makeJob(
            "Full Name,Gender,Class,Admission No\nJohn Kamara,male,JSS 1,STU001\nFatima Bangura,female,JSS 2,STU002\n"
        );

        $this->fakeMapping([
            ['source_column' => 'Full Name',    'target_field' => 'first_name',   'confidence' => 0.6,  'reason' => 'name column'],
            ['source_column' => 'Gender',       'target_field' => 'gender',       'confidence' => 0.99, 'reason' => 'male/female values'],
            ['source_column' => 'Class',        'target_field' => 'class_name',   'confidence' => 0.9,  'reason' => 'class'],
            ['source_column' => 'Admission No', 'target_field' => 'student_id_no', 'confidence' => 0.8, 'reason' => 'identifier'],
        ], 'Mapped 4 columns.');

        $this->postJson(route('school-admin.imports.analyze', $job))
            ->assertOk()
            ->assertJsonPath('import_type', 'students')
            ->assertJsonPath('mappings.1.target_field', 'gender')
            ->assertJsonPath('missing_required_fields', ['last_name'])
            ->assertJsonPath('summary', 'Mapped 4 columns.');

        $this->assertSame(
            'gender',
            $job->fresh()->import_options['column_mapping']['mappings'][1]['target_field']
        );

        $this->assertDatabaseHas('ai_usage_logs', [
            'feature' => 'import_column_mapping',
            'status'  => 'success',
        ]);
    }

    public function test_it_drops_hallucinated_fields_and_flags_missing_and_unmatched(): void
    {
        $job = $this->makeJob("Name,Phone,Notes\nJohn,123,hello\n");

        $this->fakeMapping([
            ['source_column' => 'Name',  'target_field' => 'first_name',    'confidence' => 0.7, 'reason' => 'name'],
            ['source_column' => 'Phone', 'target_field' => 'made_up_field', 'confidence' => 0.5, 'reason' => 'phone'],
            ['source_column' => 'Notes', 'target_field' => '',              'confidence' => 0.1, 'reason' => 'free text'],
        ]);

        $this->postJson(route('school-admin.imports.analyze', $job))
            ->assertOk()
            ->assertJsonPath('mappings.1.target_field', null)
            ->assertJsonPath('mappings.2.target_field', null)
            ->assertJsonPath('unmatched_columns', ['Phone', 'Notes'])
            ->assertJsonPath('missing_required_fields', ['last_name', 'gender', 'class_name']);
    }

    public function test_it_forbids_a_job_from_another_school(): void
    {
        $job = $this->makeJob("Name\nJohn\n");

        $other = $this->createSchool();
        $this->activateSchool($other);
        $this->actingAsSchoolAdmin($other);

        $this->postJson(route('school-admin.imports.analyze', $job))
            ->assertStatus(403);
    }

    public function test_it_returns_403_when_the_feature_is_disabled(): void
    {
        $job = $this->makeJob("Name\nJohn\n");

        config(['ai.features.import_column_mapping.enabled' => false]);

        $this->postJson(route('school-admin.imports.analyze', $job))
            ->assertStatus(403)
            ->assertJsonPath('type', 'forbidden');
    }

    public function test_it_returns_422_when_the_file_cannot_be_read(): void
    {
        $job = ImportJob::create([
            'school_id'   => $this->school->id,
            'user_id'     => $this->admin->id,
            'import_type' => 'students',
            'file_name'   => 'missing.csv',
            'file_path'   => 'imports/does-not-exist.csv',
            'file_type'   => 'csv',
            'status'      => 'uploaded',
        ]);

        $this->postJson(route('school-admin.imports.analyze', $job))
            ->assertStatus(422);
    }
}
