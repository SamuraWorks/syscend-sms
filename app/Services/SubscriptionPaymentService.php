<?php

namespace App\Services;

use App\Models\School;
use App\Models\SchoolSubscription;
use App\Models\SubscriptionPayment;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class SubscriptionPaymentService
{
    public function initiatePayment(SchoolSubscription $subscription, string $phone, float $amount, string $method = 'orange_money'): array
    {
        $reference = 'SUB-' . strtoupper(Str::random(10)) . '-' . $subscription->id;

        $payment = SubscriptionPayment::create([
            'school_id'       => $subscription->school_id,
            'subscription_id' => $subscription->id,
            'amount'          => $amount,
            'method'          => $method,
            'transaction_ref' => $reference,
            'status'          => 'pending',
            'payer_phone'     => $phone,
        ]);

        $result = $method === 'monime'
            ? $this->callMonime($phone, $amount, $reference, "Subscription: {$subscription->package->name}", $payment)
            : $this->callOrangeMoney($phone, $amount, $reference, "Subscription: {$subscription->package->name}");

        if ($result['success']) {
            return [
                'success'     => true,
                'payment_url' => $result['payment_url'] ?? null,
                'pay_token'   => $result['pay_token'] ?? null,
                'reference'   => $reference,
                'payment_id'  => $payment->id,
            ];
        }

        $payment->update(['status' => 'failed', 'notes' => $result['error'] ?? 'Unknown error']);
        return ['success' => false, 'error' => $result['error'] ?? 'Payment initiation failed'];
    }

    public function recordOfflinePayment(SchoolSubscription $subscription, float $amount, string $method, string $notes = ''): SubscriptionPayment
    {
        $payment = SubscriptionPayment::create([
            'school_id'       => $subscription->school_id,
            'subscription_id' => $subscription->id,
            'amount'          => $amount,
            'method'          => $method,
            'transaction_ref' => strtoupper('OFF-' . Str::random(8)),
            'status'          => 'confirmed',
            'paid_at'         => now(),
            'confirmed_at'    => now(),
            'notes'           => $notes,
        ]);

        $subscription->update(['payment_method' => $method]);
        $this->checkAndActivate($subscription);

        return $payment;
    }

    /**
     * Confirm a pending payment and activate the subscription when fully paid.
     *
     * Accepts either a SubscriptionPayment or the transaction reference /
     * Monime session id used by the webhook. Returns false when nothing
     * matching a pending payment was found.
     */
    public function confirmPayment(SubscriptionPayment|string $paymentOrRef, ?float $amount = null): bool
    {
        $payment = $paymentOrRef instanceof SubscriptionPayment
            ? $paymentOrRef
            : SubscriptionPayment::where('transaction_ref', $paymentOrRef)
                ->orWhere('monime_session_id', $paymentOrRef)
                ->where('status', 'pending')
                ->first();

        if (! $payment) {
            return false;
        }

        // Webhooks are retried by the gateway; already-confirmed payments are
        // a success, not an error.
        if ($payment->status === 'confirmed') {
            return true;
        }

        // Only pending payments may be confirmed.
        if ($payment->status !== 'pending') {
            return false;
        }

        // Guard against a gateway confirming a different amount than we expect.
        if ($amount !== null && ! $this->amountsMatch($payment, $amount)) {
            $payment->update([
                'status' => 'failed',
                'notes'  => 'Amount mismatch reported by payment gateway.',
            ]);
            Log::warning('Subscription payment amount mismatch', [
                'payment_id' => $payment->id,
                'expected'   => (float) $payment->amount,
                'reported'   => $amount,
            ]);

            return false;
        }

        // NOTE: this must NOT call $payment->confirm(). SubscriptionPayment::confirm()
        // delegates back to this method, which would recurse until the stack blows.
        // The state transition is applied directly here instead.
        $payment->forceFill([
            'status'       => 'confirmed',
            'confirmed_at' => now(),
            'paid_at'      => $payment->paid_at ?? now(),
        ])->save();

        $this->checkAndActivate($payment->subscription()->first());

        return true;
    }

    /**
     * Gateways report currency in minor units (e.g. cents) while we store whole
     * units, so accept whichever interpretation lines up with what we expect.
     */
    private function amountsMatch(SubscriptionPayment $payment, float $reported): bool
    {
        $expected = (float) $payment->amount;

        if ($expected <= 0 || $reported <= 0) {
            return false;
        }

        return abs($expected - $reported) < 0.01
            || abs($expected - ($reported / 100)) < 0.01
            || abs(($expected * 100) - $reported) < 1;
    }

    public function confirmByTransactionRef(string $transactionRef): bool
    {
        return $this->confirmPayment($transactionRef);
    }

    public function failByTransactionRef(string $transactionRef, string $reason = ''): void
    {
        SubscriptionPayment::where('transaction_ref', $transactionRef)
            ->where('status', 'pending')
            ->update(['status' => 'failed', 'notes' => $reason]);
    }

    private function checkAndActivate(?SchoolSubscription $subscription): void
    {
        if (! $subscription) {
            return;
        }

        if ($subscription->is_fully_paid && $subscription->status !== 'active') {
            $subscription->update(['status' => 'active']);
            $subscription->school?->update(['current_subscription_id' => $subscription->id]);
            Log::info("Subscription {$subscription->id} activated for school {$subscription->school_id}");
        }
    }

    private function callMonime(string $phone, float $amount, string $reference, string $description, ?SubscriptionPayment $payment = null): array
    {
        try {
            $result = app(MonimeService::class)->createSubscriptionCheckout([
                'name'          => $description,
                'description'   => $description,
                'amount_cents'  => (int) round($amount * 100),
                'reference'     => $reference,
                'metadata'      => ['phone' => $phone],
            ]);

            if (! ($result['ok'] ?? false)) {
                return ['success' => false, 'error' => $result['error'] ?? 'Monime checkout could not be created.'];
            }

            // Store the session id so the webhook can match the payment even when
            // Monime does not echo our reference back.
            if ($payment && ! empty($result['session_id'])) {
                $payment->forceFill(['monime_session_id' => $result['session_id']])->save();
            }

            return [
                'success'     => true,
                'payment_url' => $result['redirect_url'] ?? null,
                'pay_token'   => null,
            ];
        } catch (\Throwable $e) {
            Log::error('Monime subscription payment failed', ['reference' => $reference, 'error' => $e->getMessage()]);

            return ['success' => false, 'error' => 'Payment gateway error: '.$e->getMessage()];
        }
    }

    private function callOrangeMoney(string $phone, float $amount, string $reference, string $description): array
    {
        $merchantKey = config('services.orange_money.platform_merchant_key', '');
        $apiUser     = config('services.orange_money.platform_api_user', '');
        $apiKey      = config('services.orange_money.platform_api_key', '');

        if (blank($apiUser) || blank($apiKey)) {
            return ['success' => false, 'error' => 'Orange Money platform credentials not configured.'];
        }

        try {
            $tokenResponse = Http::withBasicAuth($apiUser, $apiKey)
                ->timeout(10)
                ->post('https://api.orange.com/oauth/v3/token', [
                    'grant_type' => 'client_credentials',
                ]);

            if (! $tokenResponse->successful()) {
                Log::error('Orange Money token failed', ['status' => $tokenResponse->status()]);
                return ['success' => false, 'error' => 'Failed to authenticate with Orange Money.'];
            }

            $accessToken = $tokenResponse->json('access_token');
            $returnUrl   = url("/super-admin/subscriptions/payment/callback?ref={$reference}");
            $webhookUrl  = url("/api/v1/webhooks/orange-money-subscription");

            $paymentResponse = Http::withToken($accessToken)->timeout(15)
                ->post('https://api.orange.com/orange-money-webpay/dev/v1/webpayment', [
                    'merchant_key' => $merchantKey,
                    'currency'     => 'SLL',
                    'order_id'     => $reference,
                    'amount'       => $amount,
                    'return_url'   => $returnUrl,
                    'cancel_url'   => $returnUrl . '&status=cancelled',
                    'noti_url'     => $webhookUrl,
                    'lang'         => 'en',
                ]);

            if ($paymentResponse->successful()) {
                $body = $paymentResponse->json();
                Log::info('Orange Money subscription payment initiated', [
                    'reference'    => $reference,
                    'payment_url'  => $body['payment_url'] ?? null,
                ]);

                return [
                    'success'     => true,
                    'payment_url' => $body['payment_url'] ?? null,
                    'pay_token'   => $body['pay_token'] ?? null,
                    'noti_token'  => $body['noti_token'] ?? null,
                ];
            }

            $error = $paymentResponse->json('message') ?? 'Payment initiation failed';
            Log::error('Orange Money payment failed', ['reference' => $reference, 'error' => $error]);
            return ['success' => false, 'error' => $error];
        } catch (\Throwable $e) {
            Log::error('Orange Money exception', ['reference' => $reference, 'error' => $e->getMessage()]);
            return ['success' => false, 'error' => 'Payment gateway error: ' . $e->getMessage()];
        }
    }
}
