<?php

namespace Tests\Feature\Webhooks;

use App\Models\Package;
use App\Models\School;
use App\Models\SchoolSubscription;
use App\Models\SubscriptionPayment;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class MonimeWebhookTest extends TestCase
{
    use RefreshDatabase;

    private function makePayment(): SubscriptionPayment
    {
        $school = School::create([
            'name'           => 'Test School',
            'slug'           => 'test-school-' . uniqid(),
            'email'          => 'admin@test.com',
            'phone'          => '+1234567890',
            'address'        => '123 Test St',
            'city'           => 'Test City',
            'country'        => 'US',
            'plan'           => 'standard',
            'max_students'   => 500,
            'max_teachers'   => 50,
            'timezone'       => 'UTC',
            'date_format'    => 'Y-m-d',
            'currency'       => 'USD',
            'currency_symbol'=> '$',
            'working_days'   => 'monday,tuesday,wednesday,thursday,friday',
            'school_opening_time' => '08:00',
            'school_closing_time' => '15:00',
            'clock_format'   => '24h',
            'is_configured'  => true,
        ]);

        $package = Package::create([
            'name'           => 'Small school',
            'slug'           => 'small-school-test-' . uniqid(),
            'price_per_term' => 850,
            'is_active'      => true,
            'features'       => ['students'],
        ]);

        $subscription = SchoolSubscription::create([
            'school_id'     => $school->id,
            'package_id'    => $package->id,
            'start_date'    => now(),
            'end_date'      => now()->addYear(),
            'status'        => 'trial',
            'price_per_term'=> 850,
            'amount_paid'   => 0,
        ]);

        return SubscriptionPayment::create([
            'school_id'       => $school->id,
            'subscription_id' => $subscription->id,
            'amount'          => 850,
            'method'          => 'monime',
            'transaction_ref' => 'SUB-TEST-' . Str::upper(Str::random(8)),
            'status'          => 'pending',
        ]);
    }

    private function validSignature(string $payload): string
    {
        $secret  = config('services.monime.webhook_secret');
        $stamp   = (string) time();
        $hmac = hash_hmac('sha256', $stamp . '.' . $payload, $secret);


        return "t={$stamp},v1={$hmac}";
    }

    private function postWebhook(string $payload, string $signature): \Illuminate\Testing\TestResponse
    {
        return $this->call(
            'POST',
            '/api/v1/webhooks/monime',
            [],
            [],
            [],
            [
                'CONTENT_TYPE' => 'application/json',
                'HTTP_X_MONIME_SIGNATURE' => $signature,
            ],
            $payload
        );
    }

    public function test_webhook_confirms_payment_by_reference(): void
    {
        config()->set('services.monime.webhook_secret', 'whsec_test');

        $payment = $this->makePayment();

        $body = [
            'apiVersion' => 'caph.2025-08-23',
            'event' => [
                'id'        => 'wke-'.uniqid(),
                'name'      => 'checkout_session.completed',
                'timestamp' => (string) time(),
            ],
            'object' => [
                'id'   => 'cs-'.uniqid(),
                'type' => 'checkout_session',
            ],
            'data' => [
                'id'        => 'cs-'.uniqid(),
                'reference' => $payment->transaction_ref,
                'status'    => 'completed',
            ],
        ];

        $payload = json_encode($body);

        $response = $this->postWebhook($payload, $this->validSignature($payload));

        $response->assertOk();
        $this->assertDatabaseHas('subscription_payments', [
            'id'     => $payment->id,
            'status' => 'confirmed',
        ]);
        $this->assertDatabaseHas('school_subscriptions', [
            'id'     => $payment->subscription_id,
            'status' => 'active',
        ]);
    }

    public function test_webhook_rejects_invalid_signature(): void
    {
        config()->set('services.monime.webhook_secret', 'whsec_test');

        $payment = $this->makePayment();

        $payload = json_encode([
            'event' => [
                'id'   => 'wke-'.uniqid(),
                'name' => 'checkout_session.completed',
            ],
            'object' => [
                'id'   => 'cs-'.uniqid(),
                'type' => 'checkout_session',
            ],
            'data' => [
                'reference' => $payment->transaction_ref,
            ],
        ]);

        $response = $this->postWebhook($payload, 't='.time().',v1=invalid');

        $response->assertStatus(401);
        $this->assertDatabaseHas('subscription_payments', [
            'id'     => $payment->id,
            'status' => 'pending',
        ]);
    }

    public function test_webhook_rejected_when_secret_not_configured(): void
    {
        config()->set('services.monime.webhook_secret', '');

        $payment = $this->makePayment();

        $payload = json_encode([
            'data' => [
                'reference'       => $payment->transaction_ref,
                'status'          => 'completed',
                'currency_amount' => (int) round(((float) $payment->amount) * 100),
            ],
        ]);

        $response = $this->postWebhook($payload, 't='.time().',v1=invalid');

        $response->assertStatus(503);
        $response->assertJson(['message' => 'Service not configured']);
        $this->assertDatabaseHas('subscription_payments', [
            'id'     => $payment->id,
            'status' => 'pending',
        ]);
    }

    public function test_non_completion_event_is_ignored(): void
    {
        config()->set('services.monime.webhook_secret', 'whsec_test');

        $payment = $this->makePayment();

        $payload = json_encode([
            'event' => [
                'id'   => 'wke-'.uniqid(),
                'name' => 'checkout_session.expired',
            ],
            'object' => [
                'id'   => 'cs-'.uniqid(),
                'type' => 'checkout_session',
            ],
            'data' => [
                'reference' => $payment->transaction_ref,
                'status'    => 'expired',
            ],
        ]);

        $response = $this->postWebhook($payload, $this->validSignature($payload));

        $response->assertOk();
        $this->assertDatabaseHas('subscription_payments', [
            'id'     => $payment->id,
            'status' => 'pending',
        ]);
    }
}