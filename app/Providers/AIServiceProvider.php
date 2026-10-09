<?php

namespace App\Providers;

use App\Services\AI\AIAuditService;
use App\Services\AI\AIPermissionService;
use App\Services\AI\AIService;
use App\Services\AI\AIUsageService;
use App\Services\AI\Contracts\AIProvider;
use App\Services\AI\FallbackAIProvider;
use App\Services\AI\GeminiService;
use App\Services\AI\OpenAIService;
use Illuminate\Support\ServiceProvider;

class AIServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton('ai.provider', function ($app) {
            $factories = [
                'openai' => fn () => new OpenAIService(),
                'gemini' => fn () => new GeminiService(),
            ];

            $chain = (array) $app['config']->get('ai.provider_chain', []);
            $chain = array_values(array_filter(array_map(
                fn ($name) => trim((string) $name),
                $chain
            )));

            if ($chain === []) {
                $chain = [(string) $app['config']->get('ai.provider', 'openai')];
            }

            $providers = [];

            foreach ($chain as $name) {
                if (! isset($factories[$name])) {
                    throw new \InvalidArgumentException("Unknown AI provider [{$name}].");
                }

                $providers[] = $factories[$name]();
            }

            return count($providers) === 1 ? $providers[0] : new FallbackAIProvider($providers);
        });

        $this->app->bind(\App\Services\AI\Contracts\AIProvider::class, fn () => app('ai.provider'));

        $this->app->singleton(AIService::class);
        $this->app->singleton(AIUsageService::class);
        $this->app->singleton(AIAuditService::class);
        $this->app->singleton(AIPermissionService::class);
    }
}