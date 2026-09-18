<?php

namespace App\Services;

use App\Models\FeePayment;
use App\Models\School;
use App\Models\SchoolSetting;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class PaymentGatewayService
{
    private int $schoolId;
    private array $settings;

    public function __construct(int $schoolId)
    {
        $this->schoolId = $schoolId;
        $this->settings = SchoolSetting::allFor($schoolId);
    }

    public function initiateOrangeMoney(string $phone, float $amount, string $reference, string $description = ''): array
    {
        $merchantKey = $this->settings['orange_money_merchant_key'] ?? '';
        $apiUser     = $this->settings['orange_money_api_user'] ?? '';
        $apiKey      = $this->settings['orange_money_api_key'] ?? '';

        if (blank($merchantKey) || blank($apiUser) || blank($apiKey)) {
            return ['success' => false, 'error' => 'Orange Money credentials not configured.'];
        }

        try {
            // Step 1: Get access token
            $tokenResponse = Http::withBasicAuth($apiUser, $apiKey)
                ->timeout(10)
                ->post('https://api.orange.com/oauth/v3/token', [
                    'grant_type' => 'client_credentials',
                ]);

            if (!$tokenResponse->successful()) {
                return ['success' => false, 'error' => 'Failed to get Orange Money access token.'];
            }

            $accessToken = $tokenResponse->json('access_token');

            $currency = School::find($this->schoolId)?->currency ?? 'SLL';

            // Step 2: Initiate payment
            $paymentResponse = Http::withToken($accessToken)
                ->timeout(15)
                ->post('https://api.orange.com/orange-money-webpay/dev/v1/webpayment', [
                    'merchant_key'   => $merchantKey,
                    'currency'       => $currency,
                    'order_id'       => $reference,
                    'amount'         => $amount,
                    'return_url'     => url("/school/fees/payments/callback?method=orange_money&ref={$reference}"),
                    'cancel_url'     => url("/school/fees/payments/callback?method=orange_money&ref={$reference}&status=cancelled"),
                    'noti_url'       => url("/api/v1/payments/webhook/orange-money"),
                    'lang'           => 'en',
                ]);

            if ($paymentResponse->successful()) {
                $body = $paymentResponse->json();
                Log::info('Orange Money payment initiated', [
                    'reference' => $reference,
                    'payment_url' => $body['payment_url'] ?? null,
                    'pay_token' => $body['pay_token'] ?? null,
                ]);

                return [
                    'success'     => true,
                    'payment_url' => $body['payment_url'] ?? null,
                    'pay_token'   => $body['pay_token'] ?? null,
                    'noti_token'  => $body['noti_token'] ?? null,
                ];
            }

            $error = $paymentResponse->json('message') ?? 'Orange Money payment initiation failed';
            return ['success' => false, 'error' => $error];
        } catch (\Throwable $e) {
            Log::error('Orange Money exception', ['reference' => $reference, 'error' => $e->getMessage()]);
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    public function initiateAfrimoney(string $phone, float $amount, string $reference, string $description = ''): array
    {
        $apiKey    = $this->settings['afrimoney_api_key'] ?? '';
        $appId     = $this->settings['afrimoney_app_id'] ?? '';
        $appSecret = $this->settings['afrimoney_app_secret'] ?? '';

        if (blank($apiKey) || blank($appId) || blank($appSecret)) {
            return ['success' => false, 'error' => 'Afrimoney credentials not configured.'];
        }

        try {
            $currency = School::find($this->schoolId)?->currency ?? 'SLL';

            $response = Http::withHeaders([
                'Authorization' => 'Basic ' . base64_encode("{$appId}:{$appSecret}"),
                'apikey'        => $apiKey,
                'Content-Type'  => 'application/json',
            ])->timeout(15)->post('https://openapi.africastalking.com/mobilemoney/checkout/v1/request', [
                'productName'     => 'SchoolFees',
                'provider'        => 'OrangeMoneySL',
                'paymentCurrency' => $currency,
                'paymentPhone'    => $phone,
                'paymentAmount'   => (string) $amount,
                'narration'       => $description ?: "School fees payment - {$reference}",
                'metadata'        => [
                    ['name' => 'reference', 'value' => $reference],
                    ['name' => 'school_id', 'value' => (string) $this->schoolId],
                ],
            ]);

            if ($response->successful()) {
                $body = $response->json();
                Log::info('Afrimoney payment initiated', [
                    'reference' => $reference,
                    'transaction_id' => $body['transactionId'] ?? null,
                ]);

                return [
                    'success'        => true,
                    'transaction_id' => $body['transactionId'] ?? null,
                    'status'         => $body['status'] ?? 'Pending',
                ];
            }

            $error = $response->json('errorMessage') ?? 'Afrimoney payment initiation failed';
            return ['success' => false, 'error' => $error];
        } catch (\Throwable $e) {
            Log::error('Afrimoney exception', ['reference' => $reference, 'error' => $e->getMessage()]);
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    public function initiatePayment(string $method, string $phone, float $amount, string $reference, string $description = ''): array
    {
        return match($method) {
            'orange_money' => $this->initiateOrangeMoney($phone, $amount, $reference, $description),
            'afrimoney'    => $this->initiateAfrimoney($phone, $amount, $reference, $description),
            'mobile_money' => $this->initiateOrangeMoney($phone, $amount, $reference, $description),
            default        => ['success' => false, 'error' => "Unsupported payment method: {$method}"],
        };
    }

    public static function isConfigured(int $schoolId): bool
    {
        $settings = SchoolSetting::allFor($schoolId);
        return !blank($settings['orange_money_merchant_key'] ?? '') || !blank($settings['afrimoney_api_key'] ?? '');
    }
}
