<?php

namespace Tests\Feature\AI;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\Concerns\InteractsWithDomain;
use Tests\TestCase;

class AIFeatureTest extends TestCase
{
    use InteractsWithDomain;
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seedAllRolesAndPermissions();

        config([
            'ai.enabled'                  => true,
            'ai.ai_features_enabled'      => true,
            'ai.providers.openai.api_key' => 'sk-test-key',
        ]);
    }

    private function makeConfiguredSchool(): array
    {
        $school = $this->createSchool(['is_configured' => true]);
        $this->activateSchool($school);
        $admin = $this->actingAsSchoolAdmin($school);

        return [$school, $admin];
    }

    public function test_status_returns_a_feature_snapshot_per_feature(): void
    {
        [$school] = $this->makeConfiguredSchool();

        $this->getJson(route('school.ai.status'))
            ->assertOk()
            ->assertJsonPath('globally_enabled', true)
            ->assertJsonPath('provider', 'gemini')
            ->assertJsonPath('features.0.feature', 'homepage')
            ->assertJsonPath('features.0.label', 'School Homepage')
            ->assertJsonPath('features.0.enabled', true)
            ->assertJsonPath('features.0.has_credentials', true)
            ->assertJsonPath('features.0.allowed', true)
            ->assertJsonCount(4, 'features');
    }

    public function test_homepage_generate_returns_a_draft_and_records_usage(): void
    {
        [$school] = $this->makeConfiguredSchool();

        $content = json_encode([
            'hero'           => ['headline' => 'Welcome to Test School', 'tagline' => 'Learn today', 'cta_label' => 'Enrol', 'cta_url' => '/admissions'],
            'about'          => ['heading' => 'About us', 'summary' => 'A great school.', 'highlights' => ['Safe campus']],
            'academics'      => ['heading' => 'Academics', 'description' => 'Strong curriculum', 'levels' => ['JSS'], 'programs' => ['Science']],
            'why_choose_us'  => ['heading' => 'Why us', 'points' => ['Good teachers']],
            'school_life'    => ['heading' => 'School life', 'description' => 'Fun', 'activities' => ['Sports']],
            'contact'        => ['heading' => 'Contact', 'phone' => '123', 'email' => 'a@b.c', 'address' => 'Street', 'hours' => '8am-4pm'],
            'seo'            => ['meta_title' => 'Test School', 'meta_description' => 'A test school'],
        ], JSON_UNESCAPED_SLASHES);

        Http::fake([
            'api.openai.com/*' => Http::response([
                'output'       => [[
                    'type'         => 'message',
                    'content'      => [['type' => 'output_text', 'text' => $content]],
                ]],
                'usage'        => ['input_tokens' => 40, 'output_tokens' => 80, 'total_tokens' => 120],
                'model'        => 'gpt-4o-mini',
            ], 200),
        ]);

        $this->postJson(route('school.ai.homepage.generate'))
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('state', 'draft')
            ->assertJsonPath('draft.hero.headline', 'Welcome to Test School')
            ->assertJsonPath('meta.model', 'gpt-4o-mini');

        $this->assertDatabaseHas('ai_usage_logs', [
            'feature'      => 'homepage',
            'status'       => 'success',
            'model'        => 'gpt-4o-mini',
            'input_tokens' => 40,
            'total_tokens' => 120,
        ]);

        $this->assertDatabaseHas('ai_audit_logs', [
            'feature'       => 'homepage',
            'action'        => 'generate',
            'result_status' => 'ok',
        ]);
    }

    public function test_homepage_generate_is_denied_when_the_feature_is_disabled(): void
    {
        [$school] = $this->makeConfiguredSchool();

        config(['ai.features.homepage.enabled' => false]);

        $this->postJson(route('school.ai.homepage.generate'))
            ->assertStatus(403)
            ->assertJsonPath('type', 'forbidden');
    }

    public function test_homepage_generate_is_throttled_when_the_daily_limit_is_reached(): void
    {
        [$school, $admin] = $this->makeConfiguredSchool();

        $content = json_encode([
            'hero' => ['headline' => 'Welcome', 'tagline' => 't', 'cta_label' => 'Enrol', 'cta_url' => '/admissions'],
            'about' => ['heading' => 'a', 'summary' => 's', 'highlights' => ['h']],
            'academics' => ['heading' => 'a', 'description' => 'd', 'levels' => ['JSS'], 'programs' => ['p']],
            'why_choose_us' => ['heading' => 'w', 'points' => ['p']],
            'school_life' => ['heading' => 's', 'description' => 'd', 'activities' => ['a']],
            'contact' => ['heading' => 'c', 'phone' => '1', 'email' => 'e@e.e', 'address' => 'a', 'hours' => 'h'],
            'seo' => ['meta_title' => 'm', 'meta_description' => 'md'],
        ], JSON_UNESCAPED_SLASHES);

        Http::fake([
            'api.openai.com/*' => Http::response([
                'output' => [['type' => 'message', 'content' => [['type' => 'output_text', 'text' => $content]]]],
                'usage'  => ['input_tokens' => 10, 'output_tokens' => 10, 'total_tokens' => 20],
                'model'  => 'gpt-4o-mini',
            ], 200),
        ]);

        config(['ai.features.homepage.limits.per_user_per_day' => 1]);

        $this->postJson(route('school.ai.homepage.generate'))->assertOk();

        $this->postJson(route('school.ai.homepage.generate'))
            ->assertStatus(429)
            ->assertJsonPath('type', 'throttled');
    }
}