<?php

namespace Tests\Feature\Academics;

use App\Models\{AcademicYear, ImportJob, School, SchoolClass, Subject, SubjectOffering, User};
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Tests\Concerns\InteractsWithDomain;
use Tests\TestCase;

class SubjectImportTest extends TestCase
{
    use RefreshDatabase, InteractsWithDomain;

    private const CSV_HEADER = 'class_name,name,code,type,full_marks,pass_marks,department_name,is_core';

    private School $school;
    private User $admin;
    private SchoolClass $jssClass;
    private SchoolClass $sssClass;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seedRolesAndPermissions();

        $this->school = $this->createSchool();
        $this->activateSchool($this->school);

        $this->admin = $this->createUser(['school_id' => $this->school->id]);

        $this->class = SchoolClass::create([
            'school_id'    => $this->school->id,
            'name'         => 'JSS 1',
            'numeric_name' => 1,
        ]);

        $this->sss = SchoolClass::create([
            'school_id'    => $this->school->id,
            'name'         => 'SSS 1',
            'numeric_name' => 4,
            'school_level' => 'senior_secondary',
        ]);
    }

    private function csvContent(string ...$rows): string
    {
        return 'class_name,name,code,type,full_marks,pass_marks,department_name,is_core' . "\n" . implode("\n", $rows) . "\n";
    }

    private function upload(string $content): ImportJob
    {
        Storage::fake('private');

        Auth::login($this->admin);

        $this->post('/school-admin/imports/upload/subjects', [
            'file' => UploadedFile::fake()->createWithContent('subjects.csv', $content),
        ])->assertRedirect();

        return ImportJob::query()->forType('subjects')->orderByDesc('id')->firstOrFail();
    }

    public function test_upload_and_execute_imports_subject_rows(): void
    {
        $job = $this->upload("class_name,name,code,type,full_marks,pass_marks,department_name,is_core\n"
            . 'JSS 1,Mathematics,MATH,theory,100,33,,yes');

        $this->assertSame('validated', $job->status);
        $this->assertSame(1, $job->total_rows);
        $this->assertSame(0, $job->error_rows);

        $this->post("/school-admin/imports/execute/{$job->id}")->assertRedirect();

        $this->assertSame('completed', $job->fresh()->status);
        $this->assertSame(1, $job->fresh()->imported_rows);
        $this->assertDatabaseHas('subjects', [
            'school_id' => $this->school->id,
            'class_id'  => $this->class->id,
            'name'      => 'Mathematics',
            'code'      => 'MATH',
            'type'      => 'theory',
            'is_core'   => true,
        ]);
    }

    public function test_subject_is_added_to_current_curriculum(): void
    {
        $year = AcademicYear::create([
            'school_id'  => $this->school->id,
            'name'       => '2026',
            'start_date' => '2026-09-01',
            'end_date'   => '2027-06-30',
            'is_current' => true,
        ]);

        $job = $this->upload($this->csvContent('JSS 1,Mathematics,MATH,theory,100,33,,yes'));
        $this->post("/school-admin/imports/execute/{$job->id}")->assertRedirect();

        $subject = Subject::where('school_id', $this->school->id)->where('code', 'MATH')->firstOrFail();
        $this->assertDatabaseHas('subject_offerings', [
            'school_id'        => $this->school->id,
            'academic_year_id' => $year->id,
            'class_id'         => $this->class->id,
            'subject_id'       => $subject->id,
            'subject_code'     => 'MATH',
        ]);
        $this->assertSame(1, $job->fresh()->import_summary['offerings_created']);
    }

    public function test_unknown_class_is_rejected(): void
    {
        $job = $this->upload($this->csvContent('JSS 9,Mathematics,MATH,theory,100,33,,yes'));

        $this->assertSame('validated', $job->status);
        $this->assertSame(0, $job->valid_rows);
        $this->assertSame(1, $job->error_rows);
        $this->assertSame(0, Subject::count());
    }

    public function test_department_is_only_allowed_for_sss(): void
    {
        $job = $this->upload($this->csvContent('JSS 1,Mathematics,MATH,theory,100,33,Science,yes'));

        $this->assertSame(1, $job->error_rows);
        $this->assertSame(0, $job->valid_rows);
    }

    public function test_duplicate_subject_code_is_rejected(): void
    {
        Subject::create([
            'school_id' => $this->school->id,
            'class_id'  => $this->class->id,
            'name'      => 'Existing',
            'code'      => 'MATH',
            'type'      => 'theory',
        ]);

        $job = $this->upload($this->csvContent('JSS 1,Mathematics,MATH,theory,100,33,,yes'));

        $this->assertSame(1, $job->error_rows);
        $this->assertSame(0, $job->valid_rows);
    }

    private function csvContentRows(string ...$rows): string
    {
        return 'class_name,name,code,type,full_marks,pass_marks,department_name,is_core' . "\n" . implode("\n", $rows) . "\n";
    }

    private function uploadRaw(string $content): ImportJob
    {
        Storage::fake('private');
        Auth::login($this->admin);
        $this->post('/school-admin/imports/upload/subjects', [
            'file' => UploadedFile::fake()->createWithContent('subjects.csv', $content),
        ])->assertRedirect();

        return ImportJob::query()->forType('subjects')->orderByDesc('id')->firstOrFail();
    }
}
