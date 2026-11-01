<?php

namespace App\Http\Controllers;

use App\Models\PushSubscription;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WebPushController extends Controller
{
    public function subscribe(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'endpoint'   => ['required', 'url', 'max:2048'],
            'p256dh'     => ['required', 'string', 'max:2048'],
            'auth'       => ['required', 'string', 'max:255'],
            'user_agent' => ['nullable', 'string', 'max:500'],
        ]);

        $subscription = PushSubscription::where('user_id', $request->user()->id)
            ->where('endpoint', $validated['endpoint'])
            ->first();

        if ($subscription) {
            $subscription->update([
                'p256dh'          => $validated['p256dh'],
                'auth_token'      => $validated['auth'],
                'user_agent'      => $validated['user_agent'] ?? $request->userAgent(),
                'last_active_at'  => now(),
            ]);
        } else {
            PushSubscription::create([
                'user_id'         => $request->user()->id,
                'endpoint'        => $validated['endpoint'],
                'p256dh'          => $validated['p256dh'],
                'auth_token'      => $validated['auth'],
                'user_agent'      => $validated['user_agent'] ?? $request->userAgent(),
                'last_active_at'  => now(),
            ]);
        }

        return response()->json(['ok' => true]);
    }

    public function unsubscribe(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'endpoint' => ['required', 'url', 'max:2048'],
        ]);

        PushSubscription::where('user_id', $request->user()->id)
            ->where('endpoint', $validated['endpoint'])
            ->delete();

        return response()->json(['ok' => true]);
    }
}