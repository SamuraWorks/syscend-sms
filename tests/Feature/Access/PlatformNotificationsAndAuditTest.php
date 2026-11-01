<?php

namespace Tests\Feature\Access;

use App\Models\DemoRequest;
use App\Models\PlatformNotificationRead;
use App\Models\SchoolSubscription;
use App\Models\SubscriptionPayment;
use App\Services\PlatformNotificationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Activitylog\Models\Activity;
use Tests\Concerns\InteractsWithDomain;
use Tests\TestCase;

/**
 * Platform-wide Notifications and Reports & Audit pages.
 *
 * These replace the school-scoped nav entries a super-admin could never load:
 * both pages are deliberately NOT scoped to a single school, so they render for
 * a platform operator even when no school exists.
 */
class PlatformNotificationsAndAuditTest extends TestCase
{
    use RefreshDatabase, InteractsWithDomain;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seedAllRolesAndPermissions();
    }

    /**
     * demo_requests has several NOT NULL columns with no defaults.
     */
    private function createDemoRequest(array $attributes = []): DemoRequest
    {
        return DemoRequest::create(array_merge([
            'status'                   => 'new',
            'school_name'              => 'Bai Fade School',
            'school_type'              => 'private',
            'school_level'             => 'primary',
            'district'                 => 'Western Area',
            'number_of_students'       => 420,
            'contact_name'             => 'Amadu Bangura',
            'contact_position'         => 'principal',
            'contact_email'            => 'head@baifade.test',
            'contact_phone'            => '+23280100001',
            'modules_of_interest'      => ['students', 'fees'],
            'current_management'       => 'paper',
            'preferred_contact_method' => 'phone',
        ], $attributes));
    }

    /**
     * A school that is already approved, so it does not also raise a
     * "school awaiting approval" notification and skew feed counts.
     */
    private function createApprovedSchool(array $attributes = []): \App\Models\School
    {
        return $this->createSchool(array_merge(['moe_approval_status' => 'approved'], $attributes));
    }

    // â”€â”€ Access â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    public function test_notification_centre_loads_without_any_school(): void
    {
        // The old nav linked to /school/communication/notifications, which 404s
        // because no school context exists. The platform page must still work.
        $this->actingAsSuperAdmin();

        $this->get('/super-admin/notifications')
            ->assertOk()
            ->assertInertia(fn ($p) => $p
                ->component('SuperAdmin/Notifications/Index')
                ->has('notifications')
                ->has('filters')
            );
    }

    public function test_audit_log_loads_without_any_school(): void
    {
        $this->actingAsSuperAdmin();

        $this->get('/super-admin/audit-log')
            ->assertOk()
            ->assertInertia(fn ($p) => $p
                ->component('SuperAdmin/AuditLog/Index')
                ->has('logs')
                ->has('stats')
            );
    }

    public function test_non_platform_roles_are_kept_off_both_pages(): void
    {
        // The school needs a live subscription with modules enabled, otherwise
        // EnforceSubscriptionModules redirects before the role middleware runs
        // and the test would pass for the wrong reason.
        $school = $this->createApprovedSchool();
        $this->activateSchool($school);

        $this->actingAsSchoolAdmin($school);

        $this->get('/super-admin/notifications')->assertForbidden();
        $this->get('/super-admin/audit-log')->assertForbidden();
    }

    // â”€â”€ Derived notification feed â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    public function test_new_demo_request_appears_in_the_feed(): void
    {
        $request = $this->createDemoRequest();

        $this->actingAsSuperAdmin();

        $this->get('/super-admin/notifications')
            ->assertInertia(fn ($p) => $p
                ->component('SuperAdmin/Notifications/Index')
                ->has('notifications', 1)
                ->where('notifications.0.type', 'demo_request')
                ->where('notifications.0.key', "demo_request:{$request->id}")
                ->where('notifications.0.severity', 'info')
                ->where('notifications.0.is_read', false)
            );
    }

    public function test_school_awaiting_approval_appears_in_the_feed(): void
    {
        // New schools default to moe_approval_status = pending, so creating one
        // must raise a notification without any dispatcher hook.
        $school = $this->createSchool(['moe_approval_status' => 'pending']);

        $this->actingAsSuperAdmin();

        $this->get('/super-admin/notifications')
            ->assertInertia(fn ($p) => $p
                ->has('notifications', 1)
                ->where('notifications.0.type', 'school')
                ->where('notifications.0.key', "school_pending:{$school->id}")
            );
    }

    public function test_approved_school_drops_out_of_the_feed(): void
    {
        $school = $this->createSchool(['moe_approval_status' => 'pending']);
        $admin = $this->actingAsSuperAdmin();
        $this->assertCount(1, app(PlatformNotificationService::class)->feed($admin));

        $school->update(['moe_approval_status' => 'approved']);

        $this->assertCount(0, app(PlatformNotificationService::class)->feed($admin));
    }

    public function test_contacted_demo_request_drops_out_of_the_feed(): void
    {
        // The feed is derived from source rows, so acting on a request removes
        // its notification without any cleanup step.
        $request = $this->createDemoRequest();
        $this->assertCount(1, app(PlatformNotificationService::class)->feed($this->actingAsSuperAdmin()));

        $request->update(['status' => 'contacted']);

        $this->assertCount(0, app(PlatformNotificationService::class)->feed($this->actingAsSuperAdmin()));
    }

    public function test_subscription_expiring_within_the_window_warns(): void
    {
        $school = $this->createApprovedSchool();
        $package = $this->createPackage();
        $this->createSubscription($school, $package, [
            'status'    => 'active',
            'end_date'  => now()->addDays(5),
        ]);

        $this->actingAsSuperAdmin();

        $this->get('/super-admin/notifications')
            ->assertInertia(fn ($p) => $p
                ->has('notifications', 1)
                ->where('notifications.0.type', 'subscription')
                ->where('notifications.0.severity', 'warning')
            );
    }

    public function test_subscription_far_in_the_future_is_not_flagged(): void
    {
        $school = $this->createApprovedSchool();
        $package = $this->createPackage();
        $this->createSubscription($school, $package, [
            'status'   => 'active',
            'end_date' => now()->addDays(90),
        ]);

        $this->actingAsSuperAdmin();

        $this->get('/super-admin/notifications')
            ->assertInertia(fn ($p) => $p->has('notifications', 0));
    }

    public function test_lapsed_subscription_is_critical(): void
    {
        $school = $this->createApprovedSchool();
        $package = $this->createPackage();
        $this->createSubscription($school, $package, [
            'status'   => 'active',
            'end_date' => now()->subDays(2),
        ]);

        $this->actingAsSuperAdmin();

        $this->get('/super-admin/notifications')
            ->assertInertia(fn ($p) => $p
                ->has('notifications', 1)
                ->where('notifications.0.severity', 'critical')
            );
    }

    public function test_subscription_ending_today_is_not_yet_lapsed(): void
    {
        // end_date is date-granular: a subscription is valid through its end day.
        $school = $this->createApprovedSchool();
        $package = $this->createPackage();
        $this->createSubscription($school, $package, [
            'status'   => 'active',
            'end_date' => now(),
        ]);

        $this->actingAsSuperAdmin();

        $this->get('/super-admin/notifications')
            ->assertInertia(fn ($p) => $p
                ->has('notifications', 1)
                ->where('notifications.0.severity', 'warning')
            );
    }

    public function test_failed_payment_is_critical(): void
    {
        $school = $this->createApprovedSchool();
        $package = $this->createPackage();
        $subscription = $this->createSubscription($school, $package);

        SubscriptionPayment::create([
            'school_id'        => $school->id,
            'subscription_id'  => $subscription->id,
            'amount'           => 2500,
            'method'           => 'monime',
            'status'           => 'failed',
            'notes'            => 'Insufficient balance',
        ]);

        $this->actingAsSuperAdmin();

        $this->get('/super-admin/notifications')
            ->assertInertia(fn ($p) => $p
                ->has('notifications', 1)
                ->where('notifications.0.type', 'payment')
                ->where('notifications.0.severity', 'critical')
            );
    }

    public function test_critical_notifications_sort_above_warnings(): void
    {
        $school = $this->createApprovedSchool();
        $package = $this->createPackage();
        $this->createSubscription($school, $package, [
            'status'   => 'active',
            'end_date' => now()->subDays(1),
        ]);
        $this->createDemoRequest();

        $this->actingAsSuperAdmin();

        $this->get('/super-admin/notifications')
            ->assertInertia(fn ($p) => $p
                ->where('notifications.0.severity', 'critical')
                ->where('notifications.1.severity', 'info')
            );
    }

    // â”€â”€ Read / dismiss state â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    public function test_marking_a_notification_read_persists_and_updates_the_badge(): void
    {
        $request = $this->createDemoRequest();
        $admin = $this->actingAsSuperAdmin();

        // Nothing is persisted until the user acts on a notification.
        $this->assertDatabaseCount('platform_notification_reads', 0);

        $this->postJson("/super-admin/notifications/demo_request:{$request->id}/read")
            ->assertOk()
            ->assertJson(['ok' => true, 'unread_count' => 0]);

        $this->assertDatabaseHas('platform_notification_reads', [
            'user_id'                  => $admin->id,
            'notification_key'         => "demo_request:{$request->id}",
            'dismissed_at'             => null,
        ]);

        $this->assertNotNull(
            PlatformNotificationRead::where('user_id', $admin->id)->first()?->read_at
        );
    }

    public function test_dismiss_hides_the_item_and_restore_brings_it_back(): void
    {
        $request = $this->createDemoRequest();
        $this->actingAsSuperAdmin();

        $this->postJson("/super-admin/notifications/demo_request:{$request->id}/dismiss")
            ->assertOk();

        $this->get('/super-admin/notifications')
            ->assertInertia(fn ($p) => $p->has('notifications', 0));

        $this->postJson("/super-admin/notifications/demo_request:{$request->id}/restore")
            ->assertOk();

        $this->get('/super-admin/notifications')
            ->assertInertia(fn ($p) => $p->has('notifications', 1));
    }

    public function test_mark_all_read_clears_the_unread_badge(): void
    {
        $this->createDemoRequest();
        $this->createDemoRequest();
        $admin = $this->actingAsSuperAdmin();

        $this->postJson('/super-admin/notifications/read-all')
            ->assertOk()
            ->assertJson(['unread_count' => 0]);

        $this->assertSame(0, PlatformNotificationRead::where('user_id', $admin->id)
            ->whereNull('read_at')->count());
    }

    public function test_read_state_is_per_user_not_shared(): void
    {
        $request = $this->createDemoRequest();
        $first = $this->actingAsSuperAdmin();
        $this->postJson("/super-admin/notifications/demo_request:{$request->id}/read")->assertOk();

        $this->actingAs($this->createSuperAdmin());

        $this->getJson('/super-admin/notifications/unread-count')
            ->assertOk()
            ->assertJson(['count' => 1]);
    }

    public function test_unread_filter_hides_read_items(): void
    {
        $request = $this->createDemoRequest();
        $this->actingAsSuperAdmin();

        $this->get('/super-admin/notifications?status=unread')
            ->assertInertia(fn ($p) => $p->has('notifications', 1));

        $this->postJson("/super-admin/notifications/demo_request:{$request->id}/read")->assertOk();

        $this->get('/super-admin/notifications?status=unread')
            ->assertInertia(fn ($p) => $p->has('notifications', 0));
    }

    // â”€â”€ Real-time endpoints â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    public function test_stream_endpoint_reports_cursor_and_counts(): void
    {
        $this->createDemoRequest();
        $this->actingAsSuperAdmin();

        $this->getJson('/super-admin/notifications/stream')
            ->assertOk()
            ->assertJsonPath('total', 1)
            ->assertJsonPath('unread_count', 1)
            ->assertJsonStructure(['cursor', 'unread_count', 'total', 'latest', 'server_time']);
    }

    public function test_audit_stream_flags_entries_newer_than_the_cursor(): void
    {
        $this->actingAsSuperAdmin();

        $this->getJson('/super-admin/audit-log/stream?cursor=0')
            ->assertOk()
            ->assertJsonPath('has_new', false);

        $entry = Activity::create([
            'log_name' => 'default',
            'description' => 'created a school',
            'event' => 'created',
        ]);

        $this->getJson('/super-admin/audit-log/stream?cursor=0')
            ->assertOk()
            ->assertJsonPath('has_new', true)
            ->assertJsonPath('new_count', 1)
            ->assertJsonPath('latest_id', $entry->id);
    }

    // â”€â”€ Audit log â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    public function test_audit_log_lists_activity_and_computes_stats(): void
    {
        $admin = $this->actingAsSuperAdmin();

        Activity::create(['log_name' => 'default', 'description' => 'created a school', 'event' => 'created']);
        Activity::create(['log_name' => 'default', 'description' => 'deleted a package', 'event' => 'deleted']);
        Activity::create(['log_name' => 'default', 'description' => 'system sweep', 'event' => 'sweep']);

        $this->get('/super-admin/audit-log')
            ->assertInertia(fn ($p) => $p
                ->component('SuperAdmin/AuditLog/Index')
                ->has('logs.data', 3)
                ->where('stats.total', 3)
                ->where('stats.critical_count', 1)
            );
    }

    public function test_audit_log_is_platform_wide_not_school_scoped(): void
    {
        // Two schools: activity for both must appear for one platform operator.
        $schoolA = $this->createSchool(['name' => 'Alpha']);
        $schoolB = $this->createSchool(['name' => 'Beta']);

        $userA = $this->createUser([], 'school-admin');
        $userA->update(['school_id' => $schoolA->id]);
        $userB = $this->createUser([], 'school-admin');
        $userB->update(['school_id' => $schoolB->id]);

        Activity::create([
            'log_name' => 'default', 'description' => 'alpha action', 'event' => 'updated',
            'causer_type' => \App\Models\User::class, 'causer_id' => $userA->id,
        ]);
        Activity::create([
            'log_name' => 'default', 'description' => 'beta action', 'event' => 'updated',
            'causer_type' => \App\Models\User::class, 'causer_id' => $userB->id,
        ]);

        $this->actingAsSuperAdmin();

        $this->get('/super-admin/audit-log')
            ->assertInertia(fn ($p) => $p
                ->has('logs.data', 2)
                ->where('stats.schools_touched', 2)
                ->where('stats.unique_actors', 2)
            );
    }

    public function test_audit_paginator_matches_the_app_meta_convention(): void
    {
        // Every other paginated page in this app reads `prop.meta.current_page`
        // etc. because controllers build that shape by hand - Inertia v3 would
        // serialise a raw paginator flat instead, crashing those components
        // with "cannot read properties of undefined (reading 'last_page')".
        Activity::create(['log_name' => 'default', 'description' => 'row', 'event' => 'created']);

        $this->actingAsSuperAdmin();

        $this->get('/super-admin/audit-log')
            ->assertInertia(fn ($p) => $p
                ->has('logs.data')
                ->where('logs.meta.current_page', 1)
                ->where('logs.meta.last_page', 1)
                ->where('logs.meta.total', 1)
                ->where('logs.meta.per_page', 50)
                ->missing('logs.current_page')
            );
    }

    public function test_audit_log_filters_by_actor_event_and_date(): void
    {
        $user = $this->createUser();
        $other = $this->createUser();

        Activity::create([
            'log_name' => 'default', 'description' => 'kept', 'event' => 'created',
            'causer_type' => \App\Models\User::class, 'causer_id' => $user->id,
            'created_at' => now(),
        ]);
        Activity::create([
            'log_name' => 'default', 'description' => 'old', 'event' => 'updated',
            'causer_type' => \App\Models\User::class, 'causer_id' => $other->id,
            'created_at' => now()->subDays(40),
        ]);

        $this->actingAsSuperAdmin();

        $this->get("/super-admin/audit-log?causer_id={$user->id}")
            ->assertInertia(fn ($p) => $p
                ->has('logs.data', 1)
                ->where('logs.data.0.description', 'kept')
            );

        $this->get('/super-admin/audit-log?event=updated')
            ->assertInertia(fn ($p) => $p
                ->has('logs.data', 1)
                ->where('logs.data.0.description', 'old')
            );

        $this->get('/super-admin/audit-log?from_date=' . now()->subDays(7)->toDateString())
            ->assertInertia(fn ($p) => $p->has('logs.data', 1));
    }

    public function test_audit_log_can_filter_to_critical_events_only(): void
    {
        Activity::create(['log_name' => 'default', 'description' => 'gone', 'event' => 'deleted']);
        Activity::create(['log_name' => 'default', 'description' => 'kept', 'event' => 'created']);

        $this->actingAsSuperAdmin();

        $this->get('/super-admin/audit-log?severity=critical')
            ->assertInertia(fn ($p) => $p
                ->has('logs.data', 1)
                ->where('logs.data.0.event', 'deleted')
            );
    }

    public function test_audit_export_streams_csv_with_a_filtered_set(): void
    {
        Activity::create(['log_name' => 'default', 'description' => 'alpha row', 'event' => 'created']);
        Activity::create(['log_name' => 'default', 'description' => 'beta row', 'event' => 'updated']);

        $this->actingAsSuperAdmin();

        $response = $this->get('/super-admin/audit-log/export');
        $response->assertOk();
        $response->assertHeader('content-type', 'text/csv; charset=UTF-8');

        $csv = $response->streamedContent();
        $this->assertStringContainsString('Timestamp,Log,Event', $csv);
        $this->assertStringContainsString('alpha row', $csv);
        $this->assertStringContainsString('beta row', $csv);
    }

    public function test_audit_export_honours_filters(): void
    {
        Activity::create(['log_name' => 'default', 'description' => 'alpha row', 'event' => 'created']);
        Activity::create(['log_name' => 'default', 'description' => 'beta row', 'event' => 'updated']);

        $this->actingAsSuperAdmin();

        $csv = $this->get('/super-admin/audit-log/export?event=created')->streamedContent();
        $this->assertStringContainsString('alpha row', $csv);
        $this->assertStringNotContainsString('beta row', $csv);
    }
}