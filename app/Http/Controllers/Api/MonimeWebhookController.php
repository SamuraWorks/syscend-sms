<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SubscriptionPayment;
use App\Services\SubscriptionPaymentService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class MonimeWebhookController extends Controller
{
    public function handle(Request $request)
    {
        $payload = $request->json()->all();

        // Verify the Monime webhook signature before trusting any payload.
        $signature = $request->header('X-Monime-Signature');
        $secret    = config('services.monime.webhook_secret');

        if (! $signature || ! $secret) {
            Log::warning('Monime webhook missing signature or secret', [
                'has_signature' => (bool) $signature,
                'has_secret'    => (bool) $secret,
            ]);
            return response()->json(['error' => 'invalid signature'], 401);
        }
        // Monime stamps the HMAC with the same timestamp it signs, formatted
        // as `t=<stamp>,v1=<sha256>` in the X-Monime-Signature header.
        if (! preg_match('/^t=(\d+),v1=([0-9a-f]+)$/', $signature, $m)) {
            Log::warning('Monime webhook: malformed signature header');
            return response()->json(['error' => 'invalid signature'], 401);
        }

        $stamp        = $m[1];
        $providedHmac = $m[2];
        $expectedHmac = hash_hmac('sha256', $stamp . '.' . $request->getContent(), $secret);

        if (! hash_equals($expectedHmac, $providedHmac)) {
            Log::warning('Monime webhook signature mismatch', [
                'expected' => $expectedHmac,
                'received' => $providedHmac,
            ]);
            return response()->json(['error' => 'invalid signature'], 401);
        }

        Log::info('Monime webhook received', [            'event' => $payload['event']['name'] ?? null,
            'type'  => $payload['object']['type'] ?? null,
            'id'    => $payload['event']['id'] ?? null,
        ]);

        $eventName = $payload['event']['name'] ?? '';

        // Only completion events should confirm a payment.
        if (! in_array($eventName, ['checkout_session.completed', 'payment_code.completed'], true)) {
            return response()->json(['status' => 'received']);
        }

        $data = $payload['data'] ?? [];

        // checkout_session.completed exposes `reference`; payment_code events do not.
        $reference = $data['reference'] ?? ($payload['object']['id'] ?? null);

        $payment = null;

        if ($reference) {
            $payment = SubscriptionPayment::where('transaction_ref', $reference)
                ->orWhere('monime_session_id', $reference)
                ->first();
        }

        if (! $payment) {
            // Fall back to matching an order number embedded in the payload.
            $orderNumber = $data['paymentData']['orderNumber']
                ?? $data['orderNumber']
                ?? $data['paymentData']['orderId']
                ?? null;

            if ($orderNumber) {
                $payment = SubscriptionPayment::where('transaction_ref', $orderNumber)
                    ->orWhere('monime_session_id', $orderNumber)
                    ->first();
            }
        }

        if (! $payment) {
            Log::warning('Monime webhook: payment not found', [
                'event'     => $eventName,
                'reference' => $reference,
            ]);
            return response()->json(['status' => 'received', 'note' => 'payment not found']);
        }

        // Monime reports amounts in minor units (cents); reconcile against
        // what we expect before confirming anything.
        $amountMinor = $data['currency_amount'] ?? $data['amount']
            ?? $payload['object']['currency_amount'] ?? $payload['object']['amount'] ?? null;

        $confirmed = app(SubscriptionPaymentService::class)->confirmPayment(
            $payment,
            $amountMinor !== null ? (float) $amountMinor : null,
        );

        if (! $confirmed) {
            Log::warning('Monime webhook: payment rejected or mismatched', [
                'payment_id'   => $payment->id,
                'amount_reported' => $amountMinor,
                'amount_expected' => $payment->amount,
            ]);

            return response()->json(['status' => 'received', 'note' => 'payment rejected'], 200);
        }

        Log::info("Monime webhook confirmed payment {$payment->id} (event {$eventName})");

        return response()->json(['status' => 'received', 'payment_id' => $payment->id]);
    }
}