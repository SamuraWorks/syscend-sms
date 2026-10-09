<?php

namespace App\Services;

use App\Models\DemoRequest;
use App\Models\PlatformNotificationRead;
use App\Models\School;
use App\Models\SchoolSubscription;
use App\Models\SubscriptionPayment;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;

/**
 * Builds the platform-wide notification feed for super-admins.
 *
 * Notifications are *derived* from source tables rather than materialised as
 * rows. That keeps the feed self-healing: a subscription that starts expiring
 * appears without a scheduler writing anything, and deleting the underlying
 * record removes the notification. Only per-user presentation state (read /
 * dismissed) is persisted, in platform_notification_reads.
 */
class PlatformNotificationService
{
    /** Days before end_date at which a subscription starts warning. */
    public const EXPIRY_WARNING_DAYS = 14;

    /** How far back a one-off event (payment failure) stays in the feed. */
    public const EVENT_WINDOW_DAYS = 30;

    /** Hard cap on derived rows pulled per source, before sorting. */
    private const PER_SOURCE_LIMIT = 25;

    /**
     * How long the unread badge count is cached per user. The badge is polled
     * every 15s and building it means ~10 source queries, so this collapses the
     * poll load. The feed itself is never cached across requests (source
     * changes must surface immediately); only this derived number is. Read /
     * dismiss bust it immediately via forgetFeed().
     */
    private const UNREAD_CACHE_TTL_SECONDS = 60;

    /**
     * Severity ordering used for sorting: most severe first.
     */
    private const SEVERITY_RANK = ['critical' => 0, 'warning' => 1, 'info' => 2];

    /**
     * Return every notification for the given user, newest first.
     *
     * @param  array<string, mixed>  $filters  type / severity / status
     */
    public function feed(User $user, array $filters = []): Collection
    {
        return $this->applyFilters($this->buildFeed($user), $filters);
    }

    /**
     * Build the feed and every derived count from a single source sweep, so a
     * page render costs one sweep instead of one per count.
     *
     * @param  array<string, mixed>  $filters
     * @return array{notifications: Collection, unread_count: int, type_counts: array<string, int>, severity_counts: array<string, int>}
     */
    public function page(User $user, array $filters = []): array
    {
        $all = $this->buildFeed($user);
        $active = $this->applyFilters($all, []);

        return [
            'notifications'   => $this->applyFilters($all, $filters),
            'unread_count'    => $active->where('is_read', false)->count(),
            'type_counts'     => $active->groupBy('type')->map->count()->all(),
            'severity_counts' => $active->groupBy('severity')->map->count()->all(),
        ];
    }

    /**
     * Apply the type / severity / status filters to a built feed.
     *
     * @param  array<string, mixed>  $filters
     */
    private function applyFilters(Collection $items, array $filters): Collection
    {
        // Dismissed items stay retrievable but never clutter the default view.
        if (($filters['status'] ?? 'active') === 'active') {
            $items = $items->reject(fn (array $i) => $i['is_dismissed'])->values();
        }

        if (($filters['status'] ?? 'active') === 'unread') {
            $items = $items
                ->reject(fn (array $i) => $i['is_dismissed'] || $i['is_read'])
                ->values();
        }

        if (! empty($filters['type']) && $filters['type'] !== 'all') {
            $items = $items->where('type', $filters['type'])->values();
        }

        if (! empty($filters['severity']) && $filters['severity'] !== 'all') {
            $items = $items->where('severity', $filters['severity'])->values();
        }

        return $items->values();
    }

    /**
     * Pull every source, merge, attach per-user read state and sort.
     */
    private function buildFeed(User $user): Collection
    {
        $items = $this->collect()
            ->merge($this->demoRequests())
            ->merge($this->pendingApprovals())
            ->merge($this->suspendedSchools())
            ->merge($this->expiringSubscriptions())
            ->merge($this->expiredSubscriptions())
            ->merge($this->failedPayments());

        $state = $this->stateMap($user, $items->pluck('key')->all());

        $items = $items->map(function (array $item) use ($state) {
            $row = $state[$item['key']] ?? null;

            $item['read_at']       = $row?->read_at?->toIso8601String();
            $item['dismissed_at'] = $row?->dismissed_at?->toIso8601String();
            $item['is_read']       = $row?->read_at !== null;
            $item['is_dismissed']  = $row?->dismissed_at !== null;

            return $item;
        });

        return $items
            ->sortBy([
                fn ($a, $b) => self::SEVERITY_RANK[$a['severity']] <=> self::SEVERITY_RANK[$b['severity']],
                fn ($a, $b) => strtotime($b['occurred_at']) <=> strtotime($a['occurred_at']),
            ])
            ->values();
    }

    /**
     * Drop the cached unread count for a user after a state change they made.
     */
    private function forgetFeed(User $user): void
    {
        Cache::forget("platform-notifications:unread:{$user->getKey()}");
    }

    /**
     * Number of notifications the user has not read. Cached briefly because the
     * header badge polls it; read / dismiss invalidate it via forgetFeed().
     */
    public function unreadCount(User $user): int
    {
        return (int) Cache::remember(
            "platform-notifications:unread:{$user->getKey()}",
            now()->addSeconds(self::UNREAD_CACHE_TTL_SECONDS),
            fn () => $this->feed($user)->where('is_read', false)->count(),
        );
    }

    /**
     * Per-type counts for the filter chips.
     *
     * @return array<string, int>
     */
    public function typeCounts(User $user): array
    {
        return $this->feed($user)
            ->groupBy('type')
            ->map->count()
            ->all();
    }

    /**
     * Severity counts for the filter chips.
     *
     * @return array<string, int>
     */
    public function severityCounts(User $user): array
    {
        return $this->feed($user)
            ->groupBy('severity')
            ->map->count()
            ->all();
    }

    /**
     * Mark one notification read. Creates the state row on demand because the
     * notification itself is derived and has no row of its own.
     */
    public function markRead(User $user, string $key): void
    {
        PlatformNotificationRead::updateOrCreate(
            ['user_id' => $user->id, 'notification_key' => $key],
            ['read_at' => now()],
        );

        $this->forgetFeed($user);
    }

    /**
     * Mark every currently visible notification read.
     */
    public function markAllRead(User $user): void
    {
        $keys = $this->feed($user)->where('is_read', false)->pluck('key');

        foreach ($keys as $key) {
            PlatformNotificationRead::updateOrCreate(
                ['user_id' => $user->id, 'notification_key' => $key],
                ['read_at' => now()],
            );
        }

        $this->forgetFeed($user);
    }

    /**
     * Hide a notification for this user without touching its source record.
     */
    public function dismiss(User $user, string $key): void
    {
        PlatformNotificationRead::updateOrCreate(
            ['user_id' => $user->id, 'notification_key' => $key],
            ['read_at' => now(), 'dismissed_at' => now()],
        );

        $this->forgetFeed($user);
    }

    /**
     * Bring a dismissed notification back.
     */
    public function restore(User $user, string $key): void
    {
        PlatformNotificationRead::updateOrCreate(
            ['user_id' => $user->id, 'notification_key' => $key],
            ['read_at' => null, 'dismissed_at' => null],
        );

        $this->forgetFeed($user);
    }

    /**
     * Read-state rows for the given keys, keyed by notification key.
     *
     * @param  array<int, string>  $keys
     * @return Collection<string, PlatformNotificationRead>
     */
    private function stateMap(User $user, array $keys): Collection
    {
        if ($keys === []) {
            return collect();
        }

        return PlatformNotificationRead::where('user_id', $user->id)
            ->whereIn('notification_key', $keys)
            ->get()
            ->keyBy('notification_key');
    }

    private function collect(): Collection
    {
        return collect();
    }

    /**
     * Demo requests that nobody has actioned yet.
     */
    private function demoRequests(): Collection
    {
        return DemoRequest::where('status', 'new')
            ->latest()
            ->limit(self::PER_SOURCE_LIMIT)
            ->get()
            ->map(fn (DemoRequest $r) => [
                'key'         => "demo_request:{$r->id}",
                'type'        => 'demo_request',
                'severity'    => 'info',
                'title'       => "New demo request — " . ($r->school_name ?? 'Unnamed school'),
                'body'        => trim(sprintf(
                    '%s (%s) requested a demo for %s students in %s.',
                    $r->contact_name ?? 'Someone',
                    $r->contact_position ?? 'unspecified role',
                    $r->number_of_students !== null ? (string) $r->number_of_students : 'an unknown number of',
                    $r->district ?? 'an unspecified district',
                )),
                'url'         => "/super-admin/demo-requests/{$r->id}",
                'occurred_at' => $r->created_at?->toIso8601String(),
                'actor'       => $r->contact_name,
            ]);
    }

    /**
     * Schools created but not yet approved by the platform.
     */
    private function pendingApprovals(): Collection
    {
        return School::where('moe_approval_status', 'pending')
            ->latest()
            ->limit(self::PER_SOURCE_LIMIT)
            ->get()
            ->map(fn (School $s) => [
                'key'         => "school_pending:{$s->id}",
                'type'        => 'school',
                'severity'    => 'info',
                'title'       => "School awaiting approval — {$s->name}",
                'body'        => "{$s->name} is pending platform approval.",
                'url'         => "/super-admin/schools/{$s->id}",
                'occurred_at' => $s->created_at?->toIso8601String(),
                'actor'       => null,
            ]);
    }

    /**
     * Suspended schools need a follow-up decision.
     */
    private function suspendedSchools(): Collection
    {
        return School::where('status', 'suspended')
            ->latest()
            ->limit(self::PER_SOURCE_LIMIT)
            ->get()
            ->map(fn (School $s) => [
                'key'         => "school_suspended:{$s->id}",
                'type'        => 'school',
                'severity'    => 'warning',
                'title'       => "School suspended — {$s->name}",
                'body'        => "{$s->name} is currently suspended and blocked from all modules.",
                'url'         => "/super-admin/schools/{$s->id}",
                'occurred_at' => $s->updated_at?->toIso8601String(),
                'actor'       => null,
            ]);
    }

    /**
     * Live subscriptions approaching their end date.
     */
    private function expiringSubscriptions(): Collection
    {
        // end_date is date-granular, so compare against calendar days rather
        // than timestamps to avoid flagging a subscription on its final day.
        $today = Carbon::today();
        $cutoff = $today->copy()->addDays(self::EXPIRY_WARNING_DAYS);

        return SchoolSubscription::with('school:id,name', 'package:id,name')
            ->whereIn('status', ['active', 'trial'])
            ->whereNotNull('end_date')
            ->whereBetween('end_date', [$today, $cutoff])
            ->orderBy('end_date')
            ->limit(self::PER_SOURCE_LIMIT)
            ->get()
            ->map(function (SchoolSubscription $s) use ($cutoff) {
                // The moment this item became "expiring soon" is the day the
                // warning window opened; using that keeps newest-first sorting
                // meaningful instead of pushing the furthest date to the top.
                $enteredWindow = $s->end_date->copy()->subDays(self::EXPIRY_WARNING_DAYS);

                return [
                    'key'         => "subscription_expiring:{$s->id}",
                    'type'        => 'subscription',
                    'severity'    => 'warning',
                    'title'       => "Subscription expiring — {$s->school?->name}",
                    'body'        => "The {$s->status} subscription ends on {$s->end_date->toFormattedDateString()}.",
                    'url'         => '/super-admin/subscriptions',
                    'occurred_at' => $enteredWindow->toIso8601String(),
                    'actor'       => null,
                ];
            });
    }

    /**
     * Subscriptions already past their end date but not yet marked expired.
     */
    private function expiredSubscriptions(): Collection
    {
        return SchoolSubscription::with('school:id,name')
            ->whereIn('status', ['active', 'trial'])
            ->whereNotNull('end_date')
            ->where('end_date', '<', Carbon::today())
            ->orderBy('end_date', 'desc')
            ->limit(self::PER_SOURCE_LIMIT)
            ->get()
            ->map(fn (SchoolSubscription $s) => [
                'key'         => "subscription_expired:{$s->id}",
                'type'        => 'subscription',
                'severity'    => 'critical',
                'title'       => "Subscription lapsed — {$s->school?->name}",
                'body'        => "Ended {$s->end_date->toFormattedDateString()} but is still marked {$s->status}. Modules will stop working.",
                'url'         => '/super-admin/subscriptions',
                'occurred_at' => $s->end_date->toIso8601String(),
                'actor'       => null,
            ]);
    }

    /**
     * Recent failed subscription payments.
     */
    private function failedPayments(): Collection
    {
        $since = Carbon::now()->subDays(self::EVENT_WINDOW_DAYS);

        return SubscriptionPayment::with('school:id,name')
            ->where('status', 'failed')
            ->where('created_at', '>=', $since)
            ->latest()
            ->limit(self::PER_SOURCE_LIMIT)
            ->get()
            ->map(fn (SubscriptionPayment $p) => [
                'key'         => "payment_failed:{$p->id}",
                'type'        => 'payment',
                'severity'    => 'critical',
                'title'       => "Payment failed — {$p->school?->name}",
                'body'        => "Le " . number_format((float) $p->amount, 2) . " via " . strtoupper((string) $p->method) . " was rejected."
                    . ($p->notes ? " Reason: {$p->notes}" : ''),
                'url'         => '/super-admin/subscriptions',
                'occurred_at' => $p->created_at?->toIso8601String(),
                'actor'       => null,
            ]);
    }
}