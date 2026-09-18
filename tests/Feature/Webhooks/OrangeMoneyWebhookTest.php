<?php

namespace Tests\Feature\Webhooks;

use App\Models\SubscriptionPayment;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OrangeMoneyWebhookTest extends TestCase
{
    use RefreshDatabase;

    public function test_webhook_rejected_when_signature_missing(): void
    {
        config()->set('services.orange_money.platform_api_key', 'secret-key-123');

        $response = $this->postJson('/api/v1/webhooks/orange-money-subscription', [
            'order_id'  => 'ORD-1',
            'status'    => 'SUCCESS',
            'transaction_id' => 'TXN-1',
        ]);

        $response->assertStatus(401);
    }

    public function test_webhook_rejected_when_signature_invalid(): void
    {
        config()->set('services.orange_money.platform_api_key', 'secret-key-123');

        $payload = json_encode([
            'order_id'  => 'ORD-1',
            'status'    => 'SUCCESS',
            'transaction_id' => 'TXN-1',
        ]);

        $response = $this->call(
            'POST',
            '/api/v1/webhooks/orange-money-subscription',
            [],
            [],
            [],
            ['HTTP_X_ORANGE_SIGNATURE' => 'wrong-signature'],
            $payload
        );

        $response->assertStatus(401);
    }

    public function test_webhook_rejected_when_secret_not_configured(): void
    {
        config()->set('services.orange_money.platform_api_key', '');

        $response = $this->postJson('/api/v1/webhooks/orange-money-subscription', [
            'order_id' => 'ORD-MISSING',
            'status'   => 'SUCCESS',
        ]);

        $response->assertStatus(503);
        $response->assertJson(['message' => 'Service not configured']);
    }
}