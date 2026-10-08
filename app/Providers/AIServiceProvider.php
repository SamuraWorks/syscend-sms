<?php

namespace App\Providers;

use App\Services\AI\AIAuditService;
use App\Services\AI\AIPermissionService;
use App\Services\AI\AIService;
use App\Services\AI\AIUsageService;
use App\Services\AI\OpenAIService;
use Illuminate\Support\ServiceProvider;

class AIServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton('ai.provider', function ($app) {
            $provider = (string) ($app['config']->get('ai.provider', 'openai'));

            return match ($provider) {
                'openai' => new OpenAIService(),
                default  => throw new \InvalidArgumentException("Unknown AI provider [{$provider}]."),
            };
        });

        $this->app->bind(\App\Services\AI\Contracts\AIProvider::class, fn () => app('ai.provider'));

        $this->app->singleton(AIService::class);
        $this->app->singleton(AIUsageService::class);
        $this->app->singleton(AIAuditService::class);
        $this->app->singleton(AIPermissionService::class);
    }
}