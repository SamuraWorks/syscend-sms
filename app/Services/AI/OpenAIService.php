<?php

namespace App\Services\AI;

use App\Services\AI\Contracts\AIProvider;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;
use RuntimeException;

class OpenAIService implements AIProvider
{
    public function clientName(): string
    {
        return 'openai';
    }

    public function supports(array $capabilities): bool
    {
        $capable = [
            'chunked'      => false,
            'images'       => false,
            'structured_json' => true,
            'function_calling' => true,
        ];

        foreach ($capabilities as $capability) {
            if (($capable[$capability] ?? false) !== true) {
                return false;
            }
        }

        return true;
    }

    public function hasCredentials(): bool
    {
        return (bool) $this->config('api_key');
    }

    /**
     * {@inheritDoc}
     */
    public function generate(array $params): array
    {
        if (! $this->hasCredentials()) {
            throw new RuntimeException('OpenAI API key is not configured.');
        }

        $attempts    = max(1, (int) $this->config('retries.attempts', 1));
        $backoffMs   = (int) $this->config('retries.backoff_ms', 800);
        $ratelimitMs = (int) $this->config('retries.max_token_ms', 2000);
        $timeout     = (int) ($params['timeout'] ?? $this->config('timeout', 90));

        $body = $this->buildRequestBody($params);

        $attempt = 0;

        while (true) {
            $attempt++;

            $startedAt = hrtime(true);
            $response = Http::withToken($this->config('api_key'))
                ->withHeaders(array_filter([
                    'OpenAI-Organization' => $this->config('organization') ?: null,
                ]))
                ->timeout($timeout)
                ->retry(0)
                ->post(rtrim($this->config('base_url', 'https://api.openai.com/v1'), '/') . '/responses', $body);
            $latencyMs = (int) floor((hrtime(true) - $startedAt) / 1_000_000);

            if (! $response->failed()) {
                return $this->normalize($response, $latencyMs);
            }

            $retryable = $this->isRetryable($response) && $attempt < $attempts;

            if (! $retryable) {
                $this->throwProviderException($response);
            }

            usleep($this->isRateLimited($response) ? $ratelimitMs * 1000 : $backoffMs * 1000);
        }
    }

    private function buildRequestBody(array $params): array
    {
        $body = [
            'model' => $params['model'] ?? $this->config('model', 'gpt-4o-mini'),
        ];

        if (! empty($params['instructions'])) {
            $body['instructions'] = $params['instructions'];
        }

        $body['input'] = $params['input'] ?? '';

        foreach (['temperature', 'max_tokens'] as $key) {
            if (array_key_exists($key, $params) && $params[$key] !== null) {
                $body[$key === 'max_tokens' ? 'max_output_tokens' : $key] = $params[$key];
            }
        }

        $format = $params['response_format'] ?? null;
        if (is_array($format) && ($format['type'] ?? null) === 'json_schema' && ! empty($format['schema'])) {
            $body['text']['format'] = [
                'type'   => 'json_schema',
                'name'   => $format['name'] ?? 'structured_output',
                'schema' => $format['schema'],
                'strict' => (bool) ($format['strict'] ?? true),
            ];
        }

        if (is_array($params['extra'] ?? null)) {
            $body = array_merge($body, $params['extra']);
        }

        return $body;
    }

    private function normalize(Response $response, int $latencyMs): array
    {
        $output = $response->json('output', []);
        $content = $this->extractText($output);

        $usage = $response->json('usage', []);

        return [
            'content'       => $content,
            'finish_reason' => $this->finishReason($output),
            'model'         => $response->json('model', ''),
            'usage'         => [
                'input_tokens'  => (int) ($usage['input_tokens'] ?? 0),
                'output_tokens' => (int) ($usage['output_tokens'] ?? 0),
                'total_tokens'  => (int) ($usage['total_tokens'] ?? 0),
            ],
            'latency_ms'    => $latencyMs,
            'raw'           => $response->json(),
        ];
    }

    private function extractText(array $output): string
    {
        $parts = [];

        foreach ($output as $item) {
            if (($item['type'] ?? null) === 'message') {
                foreach (($item['content'] ?? []) as $content) {
                    if (($content['type'] ?? null) === 'output_text') {
                        $parts[] = $content['text'] ?? '';
                    }
                }
            }
        }

        return implode('', $parts);
    }

    private function finishReason(array $output): string
    {
        foreach ($output as $item) {
            if (($item['type'] ?? null) === 'message') {
                return (! empty($item['incomplete_output'])) ? 'length' : 'stop';
            }
        }

        return 'stop';
    }

    private function isRetryable(Response $response): bool
    {
        if ($response->clientError() && $response->status() !== 429) {
            return false;
        }

        $code = $response->json('error.code') ?? $response->json('error.type');

        return in_array($code, ['insufficient_quota', 'rate_limit_exceeded'], true)
            || $response->status() === 429
            || $response->serverError()
            || $code === 'api_error';
    }

    private function isRateLimited(Response $response): bool
    {
        return $response->status() === 429 || $response->json('error.code') === 'rate_limit_exceeded';
    }

    private function throwProviderException(Response $response): never
    {
        $message = $response->json('error.message')
            ?? $response->json('error')
            ?? 'Unknown OpenAI API error';

        if (is_array($message)) {
            $message = json_encode($message);
        }

        throw new RuntimeException('OpenAI API error: ' . (string) $message);
    }

    private function config(string $key, $default = null)
    {
        return data_get(config('ai.providers.openai'), $key, $default);
    }
}