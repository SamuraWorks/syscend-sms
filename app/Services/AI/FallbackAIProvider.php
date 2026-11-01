<?php

namespace App\Services\AI;

use App\Services\AI\Contracts\AIProvider;
use RuntimeException;
use Throwable;

/**
 * Tries an ordered list of providers and returns the first successful result.
 *
 * Providers without credentials are skipped so a school can configure either
 * Gemini or OpenAI (or both) without code changes. If every provider fails the
 * last error is re-thrown so the pipeline can surface a single stable failure.
 */
class FallbackAIProvider implements AIProvider
{
    /**
     * @param array<int, AIProvider> $providers
     */
    public function __construct(
        protected array $providers,
    ) {
    }

    public function clientName(): string
    {
        return implode('+', array_map(fn (AIProvider $provider) => $provider->clientName(), $this->providers)) ?: 'fallback';
    }

    public function supports(array $capabilities): bool
    {
        foreach ($this->providers as $provider) {
            if ($provider->supports($capabilities)) {
                return true;
            }
        }

        return false;
    }

    public function hasCredentials(): bool
    {
        foreach ($this->providers as $provider) {
            if ($provider->hasCredentials()) {
                return true;
            }
        }

        return false;
    }

    /**
     * {@inheritDoc}
     */
    public function generate(array $params): array
    {
        $lastError = null;

        foreach ($this->providers as $provider) {
            if (! $provider->hasCredentials()) {
                continue;
            }

            try {
                return $provider->generate($params);
            } catch (Throwable $e) {
                $lastError = $e;
            }
        }

        if ($lastError !== null) {
            throw $lastError;
        }

        throw new RuntimeException('No AI provider is configured.');
    }
}
