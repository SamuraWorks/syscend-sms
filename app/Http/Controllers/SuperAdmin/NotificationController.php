<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Services\PlatformNotificationService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class NotificationController extends Controller
{
    public function __construct(private readonly PlatformNotificationService $service) {}

    /**
     * Notification centre for the platform operator.
     */
    public function index(Request $request)
    {
        $filters = $this->filters($request);
        $page = $this->service->page($request->user(), $filters);

        return Inertia::render('SuperAdmin/Notifications/Index', [
            'notifications'   => $page['notifications'],
            'unread_count'    => $page['unread_count'],
            'type_counts'     => $page['type_counts'],
            'severity_counts' => $page['severity_counts'],
            'filters'         => $filters,
        ]);
    }

    /**
     * Lightweight poll endpoint used for real-time updates.
     *
     * Returns the newest activity plus a monotonic cursor so the client only
     * has to append rather than re-render, and an unread count for the badge.
     */
    public function stream(Request $request)
    {
        $user = $request->user();
        $items = $this->service->feed($user);

        // Cursor is the newest occurrence timestamp currently visible; the
        // client sends it back to detect whether anything changed.
        $cursor = $items->max('occurred_at');

        return response()->json([
            'cursor'        => $cursor,
            'unread_count'  => $this->service->unreadCount($user),
            'total'         => $items->count(),
            'latest'        => $items->take(15),
            'server_time'   => now()->toIso8601String(),
        ]);
    }

    public function unreadCount(Request $request)
    {
        return response()->json([
            'count' => $this->service->unreadCount($request->user()),
        ]);
    }

    public function markRead(Request $request, string $key)
    {
        $this->service->markRead($request->user(), $key);

        if ($request->expectsJson()) {
            return response()->json([
                'ok'           => true,
                'unread_count' => $this->service->unreadCount($request->user()),
            ]);
        }

        return back()->with('success', 'Notification marked as read.');
    }

    public function markAllRead(Request $request)
    {
        $this->service->markAllRead($request->user());

        if ($request->expectsJson()) {
            return response()->json([
                'ok'           => true,
                'unread_count' => 0,
            ]);
        }

        return back()->with('success', 'All notifications marked as read.');
    }

    public function dismiss(Request $request, string $key)
    {
        $this->service->dismiss($request->user(), $key);

        if ($request->expectsJson()) {
            return response()->json([
                'ok'           => true,
                'unread_count' => $this->service->unreadCount($request->user()),
            ]);
        }

        return back()->with('success', 'Notification dismissed.');
    }

    public function restore(Request $request, string $key)
    {
        $this->service->restore($request->user(), $key);

        if ($request->expectsJson()) {
            return response()->json([
                'ok'           => true,
                'unread_count' => $this->service->unreadCount($request->user()),
            ]);
        }

        return back()->with('success', 'Notification restored.');
    }

    /**
     * @return array<string, string>
     */
    private function filters(Request $request): array
    {
        return [
            'type'      => in_array($request->query('type'), ['all', 'demo_request', 'school', 'subscription', 'payment'], true)
                ? $request->query('type') : 'all',
            'severity'  => in_array($request->query('severity'), ['all', 'critical', 'warning', 'info'], true)
                ? $request->query('severity') : 'all',
            'status'    => in_array($request->query('status'), ['active', 'all', 'unread'], true)
                ? $request->query('status') : 'active',
        ];
    }
}