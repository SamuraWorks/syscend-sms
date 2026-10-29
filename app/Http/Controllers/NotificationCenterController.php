<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class NotificationCenterController extends Controller
{
    public function summary(Request $request)
    {
        $user = $request->user();
        $notifications = $user->notifications()
            ->latest()
            ->limit(12)
            ->get()
            ->map(fn ($notification) => [
                'id' => (string) $notification->id,
                'title' => data_get($notification->data, 'title', 'Notification'),
                'body' => data_get($notification->data, 'message', data_get($notification->data, 'body', 'You have a new notification.')),
                'created_at' => optional($notification->created_at)->toISOString(),
                'read' => $notification->read_at !== null,
                'url' => data_get($notification->data, 'url'),
            ]);

        return response()->json([
            'unread_count' => $user->unreadNotifications()->count(),
            'notifications' => $notifications,
        ]);
    }

    public function markRead(Request $request, string $notification)
    {
        $record = $request->user()->notifications()->whereKey($notification)->firstOrFail();
        $record->markAsRead();

        return response()->json(['success' => true]);
    }

    public function markAllRead(Request $request)
    {
        $request->user()->unreadNotifications->markAsRead();

        return response()->json(['success' => true]);
    }
}
