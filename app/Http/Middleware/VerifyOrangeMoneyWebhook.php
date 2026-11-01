<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class VerifyOrangeMoneyWebhook
{
    public function handle(Request $request, Closure $next)
    {
        $secret = config('services.orange_money.platform_api_key');

        if (empty($secret)) {
            Log::warning('Orange Money webhook rejected: platform_api_key not configured.');
            return response()->json([
                'status' => 'error',
                'message' => 'Service not configured',
            ], 503);
        }

        $signature = $request->header('X-Orange-Signature');

        if (! $signature) {
            Log::warning('Orange Money webhook missing X-Orange-Signature header');
            return response()->json(['status' => 'error', 'message' => 'Missing signature'], 401);
        }

        $expected = hash_hmac('sha256', $request->getContent(), $secret);

        if (! hash_equals($expected, $signature)) {
            Log::warning('Orange Money webhook signature mismatch', [
                'expected' => $expected,
                'received' => $signature,
            ]);
            return response()->json(['status' => 'error', 'message' => 'Invalid signature'], 401);
        }

        return $next($request);
    }
}
