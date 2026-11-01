<?php

use App\Models\School;
use App\Models\SubscriptionPayment;
use App\Services\SubscriptionPaymentService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Str;

Route::prefix('v1')->middleware('auth:sanctum')->group(function () {

    Route::get('/students/search', function (Request $request) {
        $query = $request->input('q', '');

        if (strlen($query) < 2) {
            return response()->json(['data' => []]);
        }

        $students = School::find($request->user()->school_id)
            ?->students()
            ->where(function ($q) use ($query) {
                $q->where('first_name', 'like', "%{$query}%")
                  ->orWhere('last_name', 'like', "%{$query}%")
                  ->orWhere('admission_no', 'like', "%{$query}%");
            })
            ->select('id', 'first_name', 'last_name', 'admission_no', 'class_id', 'section_id')
            ->limit(20)
            ->get();

        return response()->json(['data' => $students ?? []]);
    });

});

// ── Public webhook routes (no auth, called by Orange Money) ──

Route::prefix('v1')->group(function () {

    Route::post('/webhooks/orange-money-subscription', function (Request $request) {
        Log::info('Orange Money subscription webhook received', [
            'payload' => $request->all(),
            'timestamp' => now()->toIso8601String(),
        ]);

        $orderId  = $request->input('data.order_id') ?? $request->input('order_id');
        $status   = $request->input('data.status') ?? $request->input('status') ?? '';
        $txnId    = $request->input('data.transactionId') ?? $request->input('transaction_id') ?? '';

        if (! $orderId) {
            Log::warning('Orange Money webhook: missing order_id');
            return response()->json(['status' => 'error', 'message' => 'Missing order_id'], 400);
        }

        $payment = SubscriptionPayment::where('transaction_ref', $orderId)->first();
        if (! $payment) {
            Log::warning('Orange Money webhook: payment not found', ['order_id' => $orderId]);
            return response()->json(['status' => 'error', 'message' => 'Payment not found'], 404);
        }

        if ($status === 'SUCCESS' || $status === 'CONFIRMED' || $status === 'successful' || $status === 'confirmed') {
            app(SubscriptionPaymentService::class)->confirmPayment(
                $payment,
                null,
                'orange_money',
                'Confirmed via Orange Money webhook txn: ' . $txnId,
            );
        } else {
            app(SubscriptionPaymentService::class)->failPayment($payment, "Webhook status: {$status} | txn: {$txnId}");
        }

        return response()->json(['status' => 'received']);
    })->middleware('webhook.orange');

    Route::post('/webhooks/monime', [\App\Http\Controllers\Api\MonimeWebhookController::class, 'handle'])
        ->middleware('webhook.monime');

    Route::get('/payments/orange-money-subscription/callback', function (Request $request) {
        $ref    = $request->query('ref');
        $status = $request->query('status', 'pending');

        if ($ref && in_array($status, ['SUCCESS', 'CONFIRMED'])) {
            $payment = SubscriptionPayment::where('transaction_ref', $ref)
                ->where('status', 'pending')
                ->first();

            if ($payment) {
                app(SubscriptionPaymentService::class)->confirmPayment($payment, null, 'orange_money');
            }
        }

        return redirect('/super-admin/subscriptions?payment=' . urlencode($status));
    });

});

// ── Scheduled jobs (Vercel Cron / any external scheduler) ──
//
// Vercel has no long running scheduler, so the entries in routes/console.php
// are exposed here instead. Every call must carry the CRON_SECRET as a
// bearer token and the route fails closed when no secret is configured.

Route::get('/cron/{job}', function (Request $request, string $job) {
    $secret = (string) config('services.cron.secret', '');
    $token  = $request->bearerToken();

    if ($secret === '' || $token === null || ! hash_equals($secret, $token)) {
        return response()->json(['status' => 'unauthorized'], 401);
    }

    $commands = [
        'expire-subscriptions' => ['subscriptions:expire', []],
        'check-escalations'    => ['syscend:check-escalations', []],
        'archive-old-records'  => ['syscend:archive-old-records', []],
        'migrate'              => ['migrate', ['--force' => true]],
    ];

    if (! array_key_exists($job, $commands)) {
        return response()->json(['status' => 'unknown_job', 'job' => $job], 404);
    }

    [$command, $parameters] = $commands[$job];

    $exitCode = Artisan::call($command, $parameters);

    return response()->json([
        'status'    => $exitCode === 0 ? 'ok' : 'failed',
        'job'       => $job,
        'command'   => $command,
        'exit_code' => $exitCode,
        'output'    => trim(Artisan::output()),
    ], $exitCode === 0 ? 200 : 500);
})->where('job', '[a-z0-9\-]+');
