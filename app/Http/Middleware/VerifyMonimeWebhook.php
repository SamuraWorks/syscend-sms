<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class VerifyMonimeWebhook
{
    public function handle(Request $request, Closure $next)
    {
        $secret = config('services.monime.webhook_secret');

        if (empty($secret)) {
            Log::warning('Monime webhook rejected: webhook_secret not configured.');
            return response()->json([
                'status' => 'error',
                'message' => 'Service not configured',
            ], 503);
        }

        $signatureHeader = $request->header('X-Monime-Signature')
            ?? $request->header('Monime-Signature')
            ?? $request->header('X-Webhook-Signature');

        if (! $signatureHeader) {
            Log::warning('Monime webhook missing signature header');
            return response()->json(['status' => 'error', 'message' => 'Missing signature'], 401);
        }

        // Header format: t=<timestamp>,v1=<hex-hmac>
        $parts = collect(explode(',', $signatureHeader))
            ->map(fn ($part) => explode('=', $part, 2))
            ->filter(fn ($pair) => count($pair) === 2);

        $timestamp = $parts->firstWhere(fn ($pair) => $pair[0] === 't')[1] ?? null;
        $signature = $parts->firstWhere(fn ($pair) => $pair[0] === 'v1')[1] ?? null;

        if (! $timestamp || ! $signature) {
            Log::warning('Monime webhook signature header malformed', ['header' => $signatureHeader]);
            return response()->json(['status' => 'error', 'message' => 'Malformed signature'], 401);
        }

        if (abs((int) $timestamp - time()) > 300) {
            Log::warning('Monime webhook replay attack detected', ['timestamp' => $timestamp]);
            return response()->json(['status' => 'error', 'message' => 'Stale signature'], 401);
        }

        $signedPayload = $timestamp.'.'.$request->getContent();
        $expected = hash_hmac('sha256', $signedPayload, $secret);

        if (! hash_equals($expected, $signature)) {
            Log::warning('Monime webhook signature mismatch', [
                'expected' => $expected,
                'received' => $signature,
            ]);
            return response()->json(['status' => 'error', 'message' => 'Invalid signature'], 401);
        }

        return $next($request);
    }
}