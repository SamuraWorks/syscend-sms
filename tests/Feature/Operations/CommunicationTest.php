<?php

namespace Tests\Feature\Operations;

use App\Models\Message;
use App\Models\SchoolNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\InteractsWithDomain;
use Tests\TestCase;

class CommunicationTest extends TestCase
{
    use RefreshDatabase, InteractsWithDomain;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seedAllRolesAndPermissions();
    }

    private function schoolWithContext(): array
    {
        $school = $this->createSchool();
        $this->activateSchool($school);
        $admin = $this->actingAsSchoolAdmin($school);
        return [$school, $admin];
    }

    public function test_announcements_index_returns_ok(): void
    {
        [$school, $admin] = $this->schoolWithContext();
        $this->createAnnouncement($school, $admin);

        $this->get(route('school.communication.announcements'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('SchoolAdmin/Communication/Announcements'));
    }

    public function test_announcement_can_be_published(): void
    {
        [$school] = $this->schoolWithContext();

        $this->post(route('school.communication.announcements.store'), [
            'title'    => 'Mid-term Break',
            'body'     => 'School closes for mid-term on Friday.',
            'audience' => 'all',
        ])->assertRedirect()->assertSessionHas('success');

        $this->assertDatabaseHas('announcements', [
            'school_id'  => $school->id,
            'title'      => 'Mid-term Break',
            'audience'   => 'all',
            'author_id'  => auth()->id(),
        ]);
    }

    public function test_announcement_requires_valid_audience(): void
    {
        [, $admin] = $this->schoolWithContext();

        $this->post(route('school.communication.announcements.store'), [
            'title'    => 'Bad',
            'body'     => 'x',
            'audience' => 'aliens',
        ])->assertSessionHasErrors('audience');
    }

    public function test_announcement_can_be_deleted(): void
    {
        [$school, $admin] = $this->schoolWithContext();
        $announcement = $this->createAnnouncement($school, $admin);

        $this->delete(route('school.communication.announcements.destroy', $announcement))
            ->assertRedirect()->assertSessionHas('success');

        $this->assertSoftDeleted('announcements', ['id' => $announcement->id]);
    }

    public function test_messages_index_returns_ok(): void
    {
        $this->schoolWithContext();

        $this->get(route('school.communication.messages'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('SchoolAdmin/Communication/Messages'));
    }

    public function test_message_can_be_sent(): void
    {
        [$school, $admin] = $this->schoolWithContext();
        $recipient = $this->createUser(['school_id' => $school->id], 'teacher');

        $this->post(route('school.communication.messages.send'), [
            'recipient_id' => $recipient->id,
            'subject'      => 'Meeting',
            'body'         => 'Please attend the staff meeting.',
        ])->assertRedirect()->assertSessionHas('success');

        $this->assertDatabaseHas('messages', [
            'school_id'    => $school->id,
            'sender_id'    => $admin->id,
            'recipient_id' => $recipient->id,
        ]);
    }

    public function test_message_requires_recipient_and_body(): void
    {
        $this->schoolWithContext();

        $this->post(route('school.communication.messages.send'), [])
            ->assertSessionHasErrors(['recipient_id', 'body']);
    }

    public function test_message_can_be_marked_read(): void
    {
        [$school, $admin] = $this->schoolWithContext();
        $sender = $this->createUser(['school_id' => $school->id], 'teacher');
        $message = Message::create([
            'school_id'    => $school->id,
            'sender_id'    => $sender->id,
            'recipient_id' => $admin->id,
            'subject'      => 'Hello',
            'body'         => 'Good morning.',
        ]);

        $this->put(route('school.communication.messages.read', $message))
            ->assertRedirect();

        $this->assertNotNull($message->fresh()->read_at);
    }

    public function test_blast_page_returns_ok(): void
    {
        $this->schoolWithContext();

        $this->get(route('school.communication.blast'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('SchoolAdmin/Communication/Blast'));
    }

    public function test_sms_blast_can_be_queued(): void
    {
        [$school, $class] = $this->schoolWithContext();
        unset($class);
        $student = $this->createStudent($school, $this->createClass($school, ['school_level' => 'junior_secondary']), [
            'admission_no' => 'ADM-COM-001',
            'phone'        => '23276123456',
        ]);

        $this->post(route('school.communication.blast.send'), [
            'channel'  => 'sms',
            'audience' => 'all_students',
            'message'  => 'School will be closed on Monday.',
        ])->assertRedirect()->assertSessionHas('success');

        $this->assertNotNull($student);
    }

    public function test_blast_requires_channel(): void
    {
        $this->schoolWithContext();

        $this->post(route('school.communication.blast.send'), [
            'audience' => 'all_students',
            'message'  => 'Test message',
        ])->assertSessionHasErrors('channel');
    }

    public function test_email_template_can_be_created(): void
    {
        [$school] = $this->schoolWithContext();

        $this->post(route('school.communication.email-templates.store'), [
            'name'      => 'Welcome Letter',
            'slug'      => 'welcome',
            'subject'   => 'Welcome to our school',
            'body'      => 'Dear {{student_name}}...',
        ])->assertRedirect()->assertSessionHas('success');

        $this->assertDatabaseHas('email_templates', [
            'school_id' => $school->id,
            'slug'      => 'welcome',
            'name'      => 'Welcome Letter',
        ]);
    }

    public function test_email_template_slug_must_be_alpha_dash(): void
    {
        $this->schoolWithContext();

        $this->post(route('school.communication.email-templates.store'), [
            'name'      => 'Bad',
            'slug'      => 'not a slug!',
            'subject'   => 'x',
            'body'      => 'y',
        ])->assertSessionHasErrors('slug');
    }

    public function test_notifications_index_returns_ok(): void
    {
        [$school, $admin] = $this->schoolWithContext();
        SchoolNotification::create([
            'user_id'  => $admin->id,
            'title'    => 'New term starting',
            'body'     => 'Term 1 begins Monday.',
            'icon'     => 'calendar',
            'type'     => 'info',
        ]);

        $this->get(route('school.communication.notifications'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('SchoolAdmin/Communication/Notifications'));
    }

    public function test_all_notifications_can_be_marked_read(): void
    {
        [$school, $admin] = $this->schoolWithContext();
        SchoolNotification::create([
            'user_id' => $admin->id,
            'title'   => 'Old notice',
            'body'    => 'Read me',
            'icon'    => 'bell',
            'type'    => 'info',
        ]);
        SchoolNotification::create([
            'user_id' => $admin->id,
            'title'   => 'Older notice',
            'body'    => 'Read me too',
            'icon'    => 'bell',
            'type'    => 'info',
        ]);

        $this->put(route('school.communication.notifications.read-all'))
            ->assertRedirect()->assertSessionHas('success');

        $this->assertDatabaseMissing('school_notifications', [
            'user_id' => $admin->id,
            'read_at' => null,
        ]);
    }
}