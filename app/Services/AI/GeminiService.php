<?php

namespace App\Services\AI;

use App\Services\AI\Contracts\AIProvider;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;
use RuntimeException;

/**
 * Google Gemini text provider.
 *
 * Mirrors OpenAIService's normalized request/response contract so the feature
 * pipeline (AIService) is provider-agnostic. Gemini does not accept the
 * `additionalProperties` / `$schema` / `strict` JSON-Schema keywords, so those
 * are stripped from any schema before it is sent.
 */
class GeminiService implements AIProvider
{
    public function clientName(): string
    {
        return 'gemini';
    }

    public function supports(array $capabilities): bool
    {
        $capable = [
            'chunked'          => false,
            'images'           => false,
            'structured_json'  => true,
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
            throw new RuntimeException('Gemini API key is not configured.');
        }

        $attempts    = max(1, (int) $this->config('retries.attempts', 1));
        $backoffMs   = (int) $this->config('retries.backoff_ms', 800);
        $timeout     = (int) ($params['timeout'] ?? $this->config('timeout', 90));

        $model = $params['model'] ?? $this->config('model', 'gemini-2.0-flash');

        $url = rtrim($this->config('base_url', 'https://generativelanguage.googleapis.com/v1beta'), '/')
            . '/models/' . $model . ':generateContent';

        $body = $this->buildRequestBody($params);

        $attempt = 0;

        while (true) {
            $attempt++;

            $startedAt = hrtime(true);
            $response = Http::withHeaders([
                'x-goog-api-key' => $this->config('api_key'),
                'Accept'         => 'application/json',
            ])
                ->timeout($timeout)
                ->retry(0)
                ->post($url, $body);
            $latencyMs = (int) floor((hrtime(true) - $startedAt) / 1_000_000);

            if (! $response->failed()) {
                return $this->normalize($response, $model, $latencyMs);
            }

            $retryable = $this->isRetryable($response) && $attempt < $attempts;

            if (! $retryable) {
                $this->throwProviderException($response);
            }

            usleep($backoffMs * 1000);
        }
    }

    private function buildRequestBody(array $params): array
    {
        $body = [
            'contents' => [[
                'role'  => 'user',
                'parts' => [['text' => (string) ($params['input'] ?? '')]],
            ]],
        ];

        if (! empty($params['instructions'])) {
            $body['systemInstruction'] = [
                'parts' => [['text' => (string) $params['instructions']]],
            ];
        }

        $generation = [];

        if (array_key_exists('temperature', $params) && $params['temperature'] !== null) {
            $generation['temperature'] = (float) $params['temperature'];
        }

        if (array_key_exists('max_tokens', $params) && $params['max_tokens'] !== null) {
            $generation['maxOutputTokens'] = (int) $params['max_tokens'];
        }

        $format = $params['response_format'] ?? null;
        if (is_array($format) && ($format['type'] ?? null) === 'json_schema' && ! empty($format['schema'])) {
            $generation['responseMimeType'] = 'application/json';
            $generation['responseSchema']   = $this->toGeminiSchema($format['schema']);
        }

        if ($generation !== []) {
            $body['generationConfig'] = $generation;
        }

        if (is_array($params['extra'] ?? null)) {
            $body = array_merge($body, $params['extra']);
        }

        return $body;
    }

    private function normalize(Response $response, string $model, int $latencyMs): array
    {
        $content = (string) $response->json('candidates.0.content.parts.0.text', '');

        $usage = $response->json('usageMetadata', []);

        $inputTokens  = (int) ($usage['promptTokenCount'] ?? 0);
        $outputTokens = (int) ($usage['candidatesTokenCount'] ?? 0);

        return [
            'content'       => $content,
            'finish_reason' => $this->finishReason((string) $response->json('candidates.0.finishReason', 'STOP')),
            'model'         => $model,
            'usage'         => [
                'input_tokens'  => $inputTokens,
                'output_tokens' => $outputTokens,
                'total_tokens'  => (int) ($usage['totalTokenCount'] ?? ($inputTokens + $outputTokens)),
            ],
            'latency_ms'    => $latencyMs,
            'raw'           => $response->json(),
        ];
    }

    private function finishReason(string $reason): string
    {
        return match (strtoupper($reason)) {
            'MAX_TOKENS'      => 'length',
            'SAFETY', 'RECITATION', 'BLOCKLIST', 'PROHIBITED_CONTENT' => 'content_filter',
            default           => 'stop',
        };
    }

    private function isRetryable(Response $response): bool
    {
        return $response->status() === 429 || $response->serverError();
    }

    private function throwProviderException(Response $response): never
    {
        $message = $response->json('error.message')
            ?? $response->json('error')
            ?? 'Unknown Gemini API error';

        if (is_array($message)) {
            $message = json_encode($message);
        }

        throw new RuntimeException('Gemini API error: ' . (string) $message);
    }

    /**
     * Recursively drop keywords Gemini's responseSchema rejects.
     */
    private function toGeminiSchema(array $schema): array
    {
        $clean = [];

        foreach ($schema as $key => $value) {
            if (in_array($key, ['additionalProperties', '$schema', 'strict'], true)) {
                continue;
            }

            if ($key === 'properties' && is_array($value)) {
                $properties = [];
                foreach ($value as $name => $definition) {
                    $properties[$name] = is_array($definition) ? $this->toGeminiSchema($definition) : $definition;
                }
                $clean[$key] = $properties;
                continue;
            }

            if ($key === 'items' && is_array($value)) {
                $clean[$key] = $this->toGeminiSchema($value);
                continue;
            }

            $clean[$key] = $value;
        }

        return $clean;
    }

    private function config(string $key, $default = null)
    {
        return data_get(config('ai.providers.gemini'), $key, $default);
    }
}
