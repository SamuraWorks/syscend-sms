<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class MonimeService
{
    private ?string $baseUrl;

    private ?string $accessToken;

    private ?string $spaceId;

    private ?string $apiVersion;

    public function __construct(?string $baseUrl = null, ?string $accessToken = null, ?string $spaceId = null, ?string $apiVersion = null)
    {
        $this->baseUrl     = $baseUrl     ?? rtrim((string) config('services.monime.base_url'), '/');
        $this->accessToken = $accessToken ?? config('services.monime.access_token');
        $this->spaceId     = $spaceId     ?? config('services.monime.space_id');
        $this->apiVersion  = $apiVersion  ?? config('services.monime.api_version');
    }

    public function isConfigured(): bool
    {
        return filled($this->accessToken) && filled($this->spaceId);
    }

    /**
     * Create a hosted Monime checkout session and return the redirect URL.
     *
     * @param  array{name: string, amount_cents: int, description?: string, reference?: string, metadata?: array<string,string>}  $payload
     * @return array{ok: bool, redirect_url?: string, session_id?: string, error?: string}
     */
    public function createSubscriptionCheckout(array $payload): array
    {
        if (! $this->isConfigured()) {
            return ['ok' => false, 'error' => 'Monime is not configured (missing access token or space id).'];
        }

        $body = [
            'name' => $payload['name'],
            'lineItems' => [[
                'type'  => 'custom',
                'name'  => $payload['name'],
                'price' => [
                    'currency' => 'SLE',
                    'value'    => (int) $payload['amount_cents'],
                ],
                'quantity' => 1,
                'reference' => $payload['reference'] ?? null,
            ]],
            'successUrl' => config('services.monime.success_url'),
            'cancelUrl'  => config('services.monime.cancel_url'),
            'metadata'   => $payload['metadata'] ?? null,
        ];

        if (! empty($payload['description'])) {
            $body['description'] = $payload['description'];
        }

        $response = Http::baseUrl($this->baseUrl)
            ->withToken($this->accessToken)
            ->withHeaders([
                'Monime-Space-Id' => $this->spaceId,
                'Monime-Version'  => $this->apiVersion,
                'Idempotency-Key' => $payload['reference'] ?? (string) Str::uuid(),
            ])
            ->asJson()
            ->post('/checkout-sessions', $body);

        if ($response->failed()) {
            return [
                'ok'    => false,
                'error' => 'Monime request failed (HTTP '.$response->status().'): '.$response->body(),
            ];
        }

        $result = $response->json('result', []);

        return [
            'ok'          => true,
            'redirect_url'=> $result['redirectUrl'] ?? null,
            'session_id'  => $result['id'] ?? null,
            'order_number'=> $result['orderNumber'] ?? null,
        ];
    }
}