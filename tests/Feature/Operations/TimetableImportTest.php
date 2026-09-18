<?php

namespace Tests\Feature\Operations;

use App\Models\{ImportJob, School, SchoolClass, Section, Staff, Subject, Timetable, User};
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Tests\Concerns\InteractsWithDomain;
use Tests\TestCase;

class TimetableImportTest extends TestCase
{
    use RefreshDatabase, InteractsWithDomain;

    private const CSV_HEADER = 'academic_year,day,start_time,end_time,class_name,section_name,subject_name,teacher_name,room,lesson_type';

    private School $school;
    private User $admin;
    private SchoolClass $class;
    private SchoolClass $class2;
    private Section $sectionA;
    private Section $sectionA2;
    private Subject $subject;
    private Subject $subject2;
    private Staff $teacher;

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
        $this->class2 = SchoolClass::create([
            'school_id'    => $this->school->id,
            'name'         => 'JSS 2',
            'numeric_name' => 2,
        ]);

        $this->sectionA = Section::create([
            'school_id' => $this->school->id,
            'class_id'  => $this->class->id,
            'name'      => 'A',
        ]);
        $this->sectionA2 = Section::create([
            'school_id' => $this->school->id,
            'class_id'  => $this->class2->id,
            'name'      => 'A',
        ]);

        $this->subject = Subject::create([
            'school_id' => $this->school->id,
            'class_id'  => $this->class->id,
            'name'      => 'English',
            'code'      => 'ENG01',
        ]);
        $this->subject2 = Subject::create([
            'school_id' => $this->school->id,
            'class_id'  => $this->class2->id,
            'name'      => 'English',
            'code'      => 'ENG02',
        ]);

        $this->teacher = Staff::create([
            'school_id'    => $this->school->id,
            'first_name'   => 'John',
            'last_name'    => 'Teacher',
            'gender'       => 'male',
            'email'        => 'teacher@test.com',
            'status'       => 'active',
            'teacher_type' => 'teaching',
        ]);
    }

    private function csvContent(string ...$rows): string
    {
        return self::CSV_HEADER . "\n" . implode("\n", $rows) . "\n";
    }

    private function upload(string $content): ImportJob
    {
        Storage::fake('private');

        Auth::login($this->admin);

        $this->post('/school-admin/imports/upload/timetables', [
            'file' => UploadedFile::fake()->createWithContent('timetables.csv', $content),
        ])->assertRedirect();

        return ImportJob::query()->forType('timetables')->orderByDesc('id')->firstOrFail();
    }

    private function execute(ImportJob $job): void
    {
        $this->post("/school-admin/imports/execute/{$job->id}")->assertRedirect();
    }

    public function test_upload_and_execute_imports_timetable_rows(): void
    {
        $job = $this->upload($this->csvContent(
            '2026,monday,07:30,08:15,JSS 1,A,English,John Teacher,Room 101,'
        ));

        $this->assertSame('validated', $job->status);
        $this->assertSame(1, $job->total_rows);
        $this->assertSame(0, $job->error_rows);

        $this->execute($job);

        $this->assertSame('completed', $job->fresh()->status);
        $this->assertSame(1, $job->fresh()->imported_rows);
        $this->assertDatabaseHas('timetables', [
            'school_id'   => $this->school->id,
            'class_id'    => $this->class->id,
            'section_id'  => $this->sectionA->id,
            'subject_id'  => $this->subject->id,
            'teacher_id'  => $this->teacher->id,
            'day_of_week' => 'monday',
            'start_time'  => '07:30:00',
            'end_time'    => '08:15:00',
            'room'        => 'Room 101',
            'status'      => 'draft',
        ]);
    }

    public function test_reimport_updates_existing_slot_without_teacher_conflict(): void
    {
        $first = $this->upload($this->csvContent(
            '2026,monday,07:30,08:15,JSS 1,A,English,John Teacher,Room 101,'
        ));
        $this->execute($first);

        $this->assertDatabaseHas('timetables', ['school_id' => $this->school->id, 'room' => 'Room 101']);

        $second = $this->upload($this->csvContent(
            '2026,monday,07:30,08:15,JSS 1,A,English,John Teacher,Room 102,'
        ));
        $this->execute($second);

        $this->assertSame(1, $second->fresh()->imported_rows);
        $this->assertSame(1, Timetable::count());
        $this->assertDatabaseHas('timetables', [
            'school_id'   => $this->school->id,
            'class_id'    => $this->class->id,
            'day_of_week' => 'monday',
            'start_time'  => '07:30:00',
            'room'        => 'Room 102',
        ]);
    }

    public function test_genuine_teacher_overlap_is_still_skipped_with_reason(): void
    {
        $job = $this->upload($this->csvContent(
            '2026,monday,07:30,08:15,JSS 1,A,English,John Teacher,Room 101,',
            '2026,monday,07:45,08:30,JSS 2,A,English,John Teacher,Room 102,'
        ));

        $this->execute($job);

        $result = $job->fresh();
        $this->assertSame(1, $result->imported_rows);
        $this->assertSame(1, $result->import_summary['skipped']);
        $this->assertSame(1, Timetable::count());
    }

    public function test_ragged_csv_rows_do_not_crash_import(): void
    {
        $job = $this->upload($this->csvContent('2026,monday,07:30,08:15,JSS 1'));

        $this->assertSame('validated', $job->status);
        $this->assertSame(1, $job->error_rows);
        $this->assertSame(0, $job->valid_rows);
        $this->assertSame(0, Timetable::count());
    }
}