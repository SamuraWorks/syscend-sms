<?php

namespace App\Services\AI;

use App\Models\School;
use App\Models\User;
use App\Services\AI\Contracts\AIProvider;
use App\Services\AI\Prompts\Prompt;
use RuntimeException;
use Throwable;

/**
 * Feature-agnostic pipeline: permission gate → usage gate → prompt → provider →
 * JSON decode → usage + audit trail. Controllers never talk to the provider
 * directly and never persist AI output without the caller doing so explicitly.
 */
class AIService
{
    public function __construct(
        protected AIProvider $provider,
        protected AIPermissionService $permissions,
        protected AIUsageService $usage,
        protected AIAuditService $audit,
    ) {
    }

    /**
     * Availability snapshot for a feature — consumed by the UI to show
     * "Available / Not available / Daily limit reached" without a provider call.
     */
    public function status(string $feature): array
    {
        $user = auth()->user();

        return [
            'feature'        => $feature,
            'label'          => config('ai.features.' . $feature . '.label'),
            'enabled'        => (bool) config('ai.features.' . $feature . '.enabled', false),
            'has_credentials'=> $this->permissions->hasProviderCredentials(),
            'allowed'        => $user ? $this->permissions->canUse($user, $feature) : false,
            'limits'         => (array) config('ai.features.' . $feature . '.limits', []),
        ];
    }

    public function available(string $feature): bool
    {
        $user = auth()->user();

        return $user !== null && $this->permissions->canUse($user, $feature);
    }

    /**
     * Run one generation for $feature with tenant-scoped context.
     *
     * @return array{content: array, truncated: bool, meta: array, generated_at: string}
     *
     * @throws AIUnavailableException when forbidden, throttled, or the provider failed
     */
    public function generate(School $school, User $user, string $feature, array $context, array $options = []): array
    {
        if (! $this->permissions->canUse($user, $feature) || ! $this->permissions->hasProviderCredentials()) {
            $this->audit->record([
                'school_id'      => $school->id,
                'user_id'        => $user->id,
                'feature'        => $feature,
                'action'         => 'generate',
                'result_status'  => 'denied',
                'input_summary'  => $this->summary($context),
            ]);

            throw new AIUnavailableException('You are not allowed to use this AI feature.', 'forbidden');
        }

        if (! $this->usage->isWithinLimits($feature, $user, $school)) {
            $this->usage->recordThrottled($feature, $user, $school);

            throw new AIUnavailableException('This feature\'s daily limit has been reached. Try again tomorrow.', 'throttled');
        }

        $prompt  = $this->promptFor($feature);
        $input   = $this->capPrompt($prompt->build($context), $prompt->maxPromptChars());
        $config  = config('ai.features.' . $feature, []);

        $params = array_merge([
            'model'           => $config['model'] ?? null,
            'temperature'     => $config['temperature'] ?? null,
            'max_tokens'      => $config['max_tokens'] ?? null,
            'timeout'         => $config['timeout'] ?? null,
            'instructions'    => $prompt->system(),
            'input'           => $input,
            'response_format' => [
                'type'   => 'json_schema',
                'name'   => $prompt->schemaName(),
                'schema' => $prompt->schema(),
            ],
        ], $options);

        try {
            $result = $this->provider->generate($params);
        } catch (Throwable $e) {
            $this->usage->record([
                'school_id'   => $school->id,
                'user_id'     => $user->id,
                'feature'     => $feature,
                'status'      => 'error',
                'model'       => $params['model'],
                'error_code'  => 'provider_error',
            ]);

            $this->audit->record([
                'school_id'      => $school->id,
                'user_id'        => $user->id,
                'feature'        => $feature,
                'action'         => 'generate',
                'result_status'  => 'provider_error',
                'input_summary'  => $this->summary($context),
                'metadata'       => ['message' => $e->getMessage()],
            ]);

            throw new AIUnavailableException(
                $this->providerErrorMessage($e),
                'provider_error',
                $e
            );
        }

        $decoded = $this->decode($result['content'] ?? '');

        $usage = (array) ($result['usage'] ?? []);

        $this->usage->record([
            'school_id'       => $school->id,
            'user_id'         => $user->id,
            'feature'         => $feature,
            'status'          => 'success',
            'model'           => $result['model'] ?? $params['model'],
            'input_tokens'    => $usage['input_tokens'] ?? 0,
            'output_tokens'   => $usage['output_tokens'] ?? 0,
            'total_tokens'    => $usage['total_tokens'] ?? 0,
            'latency_ms'      => $result['latency_ms'] ?? 0,
            'cost_usd_cents'  => AIUsageService::estimateCost($result['model'] ?? '', $usage),
        ]);

        $this->audit->record([
            'school_id'      => $school->id,
            'user_id'        => $user->id,
            'feature'        => $feature,
            'action'         => 'generate',
            'result_status'  => $decoded->truncated ? 'truncated' : 'ok',
            'input_summary'  => $this->summary($context),
            'metadata'       => [
                'model'      => $result['model'] ?? $params['model'],
                'total_tokens' => $usage['total_tokens'] ?? 0,
                'truncated'  => $decoded->truncated,
            ],
        ]);

        return [
            'content'      => $decoded->content,
            'truncated'    => $decoded->truncated,
            'meta'         => [
                'model'         => $result['model'] ?? $params['model'],
                'input_tokens'  => $usage['input_tokens'] ?? 0,
                'output_tokens' => $usage['output_tokens'] ?? 0,
                'total_tokens'  => $usage['total_tokens'] ?? 0,
                'latency_ms'    => $result['latency_ms'] ?? 0,
                'finish_reason' => $result['finish_reason'] ?? 'stop',
            ],
            'generated_at' => now()->toISOString(),
        ];
    }

    private function providerErrorMessage(Throwable $e): string
    {
        $message = $e->getMessage();

        if (str_contains($message, 'insufficient_quota')
            || str_contains($message, 'credit_balance_exhausted')
            || stripos($message, 'credit') !== false
            || stripos($message, 'quota') !== false
            || stripos($message, 'billing') !== false) {
            return 'The AI provider rejected the request because the account is out of credits or over its quota. Add credits (or configure another provider) and try again.';
        }

        return 'The AI service could not be reached. Please try again shortly.';
    }

    private function promptFor(string $feature): Prompt
    {
        $class = config('ai.features.' . $feature . '.prompt');

        if (! $class || ! class_exists($class)) {
            throw new AIUnavailableException("AI feature [{$feature}] is not wired.", 'misconfigured');
        }

        return app($class);
    }

    private function capPrompt(string $input, int $max): string
    {
        if ($max <= 0 || mb_strlen($input) <= $max) {
            return $input;
        }

        return mb_substr($input, 0, $max);
    }

    private function decode(string $content): object
    {
        $content = trim($content);

        if (preg_match('/^```(?:json)?\s*(.*?)\s*```$/s', $content, $m)) {
            $content = trim($m[1]);
        }

        try {
            return (object) [
                'content'   => json_decode($content, true, 512, JSON_THROW_ON_ERROR),
                'truncated' => false,
            ];
        } catch (\JsonException) {
            if (preg_match('/\{.*\}/s', $content, $m)) {
                try {
                    return (object) [
                        'content'   => json_decode($m[0], true, 512, JSON_THROW_ON_ERROR),
                        'truncated' => false,
                    ];
                } catch (\JsonException) {
                    // fall through
                }
            }

            return (object) [
                'content'   => ['error' => 'invalid_json', 'raw' => mb_substr($content, 0, 800)],
                'truncated' => true,
            ];
        }
    }

    private function summary(array $context): string
    {
        $school = $context['school'] ?? [];

        if (is_object($school) && method_exists($school, 'name')) {
            return (string) $school->name;
        }

        if (is_array($school)) {
            return (string) ($school['name'] ?? '');
        }

        return '';
    }
}