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
    public function initiatePayment(SchoolSubscription $subscription, string $phone, float $amount): array
    {
        $reference = 'SUB-' . strtoupper(Str::random(10)) . '-' . $subscription->id;

        $payment = SubscriptionPayment::create([
            'school_id'       => $subscription->school_id,
            'subscription_id' => $subscription->id,
            'amount'          => $amount,
            'method'          => 'orange_money',
            'transaction_ref' => $reference,
            'status'          => 'pending',
            'payer_phone'     => $phone,
        ]);

        $result = $this->callOrangeMoney($phone, $amount, $reference, "Subscription: {$subscription->package->name}");

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

    public function confirmByTransactionRef(string $transactionRef): bool
    {
        $payment = SubscriptionPayment::where('transaction_ref', $transactionRef)->where('status', 'pending')->first();
        if (! $payment) return false;

        $payment->confirm();
        $this->checkAndActivate($payment->subscription);

        return true;
    }

    public function failByTransactionRef(string $transactionRef, string $reason = ''): void
    {
        SubscriptionPayment::where('transaction_ref', $transactionRef)
            ->where('status', 'pending')
            ->update(['status' => 'failed', 'notes' => $reason]);
    }

    private function checkAndActivate(SchoolSubscription $subscription): void
    {
        if ($subscription->is_fully_paid && $subscription->status !== 'active') {
            $subscription->update(['status' => 'active']);
            $subscription->school->update(['current_subscription_id' => $subscription->id]);
            Log::info("Subscription {$subscription->id} activated for school {$subscription->school_id}");
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
