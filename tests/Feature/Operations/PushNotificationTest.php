<?php

namespace Tests\Feature\Operations;

use App\Models\Notification;
use App\Models\PushSubscription;
use App\Models\SchoolNotification;
use App\Models\User;
use App\Services\PushService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Mockery;
use Tests\Concerns\InteractsWithDomain;
use Tests\TestCase;

class PushNotificationTest extends TestCase
{
    use RefreshDatabase, InteractsWithDomain;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seedAllRolesAndPermissions();

        // Never hit a real push service during tests.
        config()->set('services.webpush.vapid', [
            'subject'     => 'mailto:tests@example.com',
            'public_key'  => null,
            'private_key' => null,
        ]);
    }

    private function schoolWithContext(): array
    {
        $school = $this->createSchool();
        $this->activateSchool($school);
        $admin = $this->actingAsSchoolAdmin($school);

        return [$school, $admin];
    }

    public function test_authenticated_user_can_subscribe_to_web_push(): void
    {
        [$school, $admin] = $this->schoolWithContext();

        $this->postJson('/notifications/web-push/subscribe', [
            'endpoint' => 'https://fcm.googleapis.com/fcm/send/sub-abc-123',
            'p256dh'   => base64_encode(str_repeat('a', 65)),
            'auth'     => base64_encode(str_repeat('b', 16)),
        ])
            ->assertOk()
            ->assertJson(['ok' => true]);

        $this->assertDatabaseHas('push_subscriptions', [
            'user_id'    => $admin->id,
            'endpoint'   => 'https://fcm.googleapis.com/fcm/send/sub-abc-123',
            'auth_token' => base64_encode(str_repeat('b', 16)),
        ]);
    }

    public function test_resubscribing_updates_the_existing_endpoint(): void
    {
        [$school, $admin] = $this->schoolWithContext();

        PushSubscription::create([
            'user_id'    => $admin->id,
            'endpoint'   => 'https://fcm.googleapis.com/fcm/send/sub-abc-123',
            'p256dh'     => base64_encode(str_repeat('a', 65)),
            'auth_token' => base64_encode(str_repeat('b', 16)),
        ]);

        $this->postJson('/notifications/web-push/subscribe', [
            'endpoint' => 'https://fcm.googleapis.com/fcm/send/sub-abc-123',
            'p256dh'   => base64_encode(str_repeat('c', 65)),
            'auth'     => base64_encode(str_repeat('d', 16)),
        ])->assertOk();

        $this->assertDatabaseCount('push_subscriptions', 1);
        $this->assertDatabaseHas('push_subscriptions', [
            'user_id'    => $admin->id,
            'p256dh'     => base64_encode(str_repeat('c', 65)),
            'auth_token' => base64_encode(str_repeat('d', 16)),
        ]);
    }

    public function test_user_can_unsubscribe_from_web_push(): void
    {
        [$school, $admin] = $this->schoolWithContext();

        PushSubscription::create([
            'user_id'    => $admin->id,
            'endpoint'   => 'https://fcm.googleapis.com/fcm/send/sub-abc-123',
            'p256dh'     => base64_encode(str_repeat('a', 65)),
            'auth_token' => base64_encode(str_repeat('b', 16)),
        ]);

        $this->deleteJson('/notifications/web-push/subscribe', [
            'endpoint' => 'https://fcm.googleapis.com/fcm/send/sub-abc-123',
        ])->assertOk();

        $this->assertDatabaseMissing('push_subscriptions', [
            'user_id' => $admin->id,
        ]);
    }

    public function test_guest_cannot_subscribe_to_web_push(): void
    {
        $this->post('/notifications/web-push/subscribe', [
            'endpoint' => 'https://fcm.googleapis.com/fcm/send/sub-abc-123',
        ])->assertRedirect(route('login'));
    }

    public function test_creating_school_notification_sends_web_push(): void
    {
        [$school, $admin] = $this->schoolWithContext();

        $mock = Mockery::mock(PushService::class);
        $mock->shouldReceive('sendToUser')
            ->once()
            ->with(
                Mockery::on(fn (User $user) => $user->id === $admin->id),
                'New announcement',
                'A new announcement was published.',
                '/school/communication/announcements'
            );
        $this->app->instance(PushService::class, $mock);

        SchoolNotification::create([
            'user_id' => $admin->id,
            'title'   => 'New announcement',
            'body'    => 'A new announcement was published.',
            'icon'    => 'megaphone',
            'type'    => 'announcement',
            'data'    => ['url' => '/school/communication/announcements'],
        ]);
    }

    public function test_creating_platform_notification_sends_web_push(): void
    {
        [$school, $admin] = $this->schoolWithContext();

        $mock = Mockery::mock(PushService::class);
        $mock->shouldReceive('sendToUser')
            ->once()
            ->with(
                Mockery::on(fn (User $user) => $user->id === $admin->id),
                'Fee Payment Received',
                'A payment has been recorded.',
                '/school/parent/fees'
            );
        $this->app->instance(PushService::class, $mock);

        Notification::create([
            'id'              => fake()->uuid(),
            'type'            => 'App\\Notifications\\SystemNotification',
            'notifiable_type' => User::class,
            'notifiable_id'   => $admin->id,
            'data'            => json_encode([
                'title'   => 'Fee Payment Received',
                'message' => 'A payment has been recorded.',
                'url'     => '/school/parent/fees',
            ]),
        ]);
    }

    public function test_push_service_is_noop_without_vapid_keys(): void
    {
        [$school, $admin] = $this->schoolWithContext();

        $service = app(PushService::class);

        $this->assertFalse($service->isEnabled());
        $this->assertFalse($service->sendToUser($admin, 'Title', 'Message', '/school/dashboard'));
    }
}