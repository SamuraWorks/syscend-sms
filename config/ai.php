<?php

use App\Services\AI\Prompts\AnnouncementPrompt;
use App\Services\AI\Prompts\HomepagePrompt;
use App\Services\AI\Prompts\LessonPlanPrompt;

return [

    /*
    |--------------------------------------------------------------------------
    | AI Master Switches
    |--------------------------------------------------------------------------
    |
    | OPENAI_ENABLED          Controls whether the OpenAI provider may be
    |                         contacted. When false (or the key is absent) the
    |                         app must degrade gracefully — every feature falls
    |                         back to a "not available" response instead of
    |                         throwing.
    | OPENAI_AI_FEATURES_ENABLED  Platform-level kill switch independently
    |                         readable at runtime so an operator can pause AI
    |                         without redeploying.
    |
    */

    'enabled'                => (bool) env('OPENAI_ENABLED', true),
    'ai_features_enabled'    => (bool) env('OPENAI_AI_FEATURES_ENABLED', true),

    /*
    |--------------------------------------------------------------------------
    | Provider selection
    |--------------------------------------------------------------------------
    |
    | The provider abstraction allows a second provider to be introduced later
    | without touching feature controllers. Only 'openai' ships today.
    |
    */

    'provider' => env('AI_PROVIDER', 'openai'),

    'providers' => [
        'openai' => [
            'api_key'      => env('OPENAI_API_KEY'),
            'organization' => env('OPENAI_ORGANIZATION'),
            'base_url'     => rtrim(env('OPENAI_BASE_URL', 'https://api.openai.com/v1'), '/'),
            'model'        => env('OPENAI_MODEL', 'gpt-4o-mini'),
            'timeout'      => (int) env('OPENAI_TIMEOUT', 90),
            'max_tokens'   => (int) env('OPENAI_MAX_TOKENS', 2048),
            'retries'      => [
                'attempts'    => (int) env('OPENAI_RETRY_ATTEMPTS', 2),
                'backoff_ms'  => (int) env('OPENAI_RETRY_BACKOFF_MS', 800),
                'max_token_ms' => (int) env('OPENAI_RETRY_RATE_LIMIT_MS', 2000),
            ],
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Feature registry
    |--------------------------------------------------------------------------
    |
    | One entry per AI feature. Centralising config here (rather than scattering
    | env() calls across controllers) keeps auditing, throttling and model
    | selection predictable. Each feature may override the provider defaults.
    |
    |   enabled         per-feature switch
    |   model           model override for this feature
    |   temperature     creativity
    |   max_tokens      output cap
    |   timeout         seconds
    |   prompt          the Prompt class rendering instructions + schema
    |   cache_ttl       seconds; 0 disables. Never set for generation flows the
    |                   user edits (e.g. homepage previews).
    |   limits          optional per-feature usage caps per period
    */

    'features' => [
        'homepage' => [
            'label'           => 'School Homepage',
            'model'           => env('OPENAI_HOMEPAGE_MODEL', env('OPENAI_MODEL', 'gpt-4o-mini')),
            'temperature'     => (float) env('OPENAI_HOMEPAGE_TEMPERATURE', 0.4),
            'max_tokens'      => (int) env('OPENAI_HOMEPAGE_MAX_TOKENS', 4096),
            'timeout'         => (int) env('OPENAI_HOMEPAGE_TIMEOUT', 120),
            'enabled'         => (bool) env('OPENAI_HOMEPAGE_ENABLED', true),
            'prompt'          => HomepagePrompt::class,
            'allowed_roles'   => ['school-admin', 'principal', 'proprietor'],
            'cache_ttl'       => 0,
            'limits'          => [
                'per_school_per_day' => (int) env('OPENAI_HOMEPAGE_SCHOOL_DAILY_LIMIT', 10),
                'per_user_per_day'   => (int) env('OPENAI_HOMEPAGE_USER_DAILY_LIMIT', 5),
            ],
        ],

        'announcement' => [
            'label'           => 'Announcement',
            'model'           => env('OPENAI_MODEL', 'gpt-4o-mini'),
            'temperature'     => 0.3,
            'max_tokens'      => 1024,
            'timeout'         => 60,
            'enabled'         => (bool) env('OPENAI_ANNOUNCEMENT_ENABLED', true),
            'prompt'          => AnnouncementPrompt::class,
            'allowed_roles'   => ['school-admin', 'principal', 'teacher'],
            'cache_ttl'       => 0,
            'limits'          => [
                'per_school_per_day' => (int) env('OPENAI_ANNOUNCEMENT_SCHOOL_DAILY_LIMIT', 20),
                'per_user_per_day'   => (int) env('OPENAI_ANNOUNCEMENT_USER_DAILY_LIMIT', 10),
            ],
        ],

        'lesson_plan' => [
            'label'           => 'Lesson Plan',
            'model'           => env('OPENAI_MODEL', 'gpt-4o-mini'),
            'temperature'     => 0.4,
            'max_tokens'      => 2048,
            'timeout'         => 90,
            'enabled'         => (bool) env('OPENAI_LESSON_PLAN_ENABLED', true),
            'prompt'          => LessonPlanPrompt::class,
            'allowed_roles'   => ['teacher', 'principal'],
            'cache_ttl'       => 0,
            'limits'          => [
                'per_school_per_day' => (int) env('OPENAI_LESSON_PLAN_SCHOOL_DAILY_LIMIT', 20),
                'per_user_per_day'   => (int) env('OPENAI_LESSON_PLAN_USER_DAILY_LIMIT', 10),
            ],
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Hard limits
    |--------------------------------------------------------------------------
    |
    | Input size guardrail keeps a large school payload from blowing a token
    | budget. Limits are enforced by AIUsageService when enforce is true.
    |
    */

    'limits' => [
        'enforce'           => (bool) env('OPENAI_ENFORCE_LIMITS', true),
        'max_prompt_chars'  => (int) env('OPENAI_MAX_PROMPT_CHARS', 20000),
    ],

];