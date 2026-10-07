<?php

namespace Tests\Feature\Public;

use App\Models\School;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\InteractsWithDomain;
use Tests\TestCase;

class SchoolPublicHomepageTest extends TestCase
{
    use RefreshDatabase, InteractsWithDomain;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seedRolesAndPermissions();
    }

    private function createEnabledSchool(array $attributes = []): School
    {
        return $this->createSchool(array_merge([
            'public_profile_enabled' => true,
            'about_school'           => 'A leading school in Freetown.',
            'primary_color'          => '#123456',
        ], $attributes));
    }

    public function test_school_slug_serves_branded_school_homepage(): void
    {
        $school = $this->createEnabledSchool();

        $this->get("/{$school->slug}")
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Public/SchoolHomepage')
                ->where('school.id', $school->id)
                ->where('school.slug', $school->slug)
                ->where('school.primary_color', '#123456'));
    }

    public function test_school_homepage_gated_by_public_profile_flag(): void
    {
        $school = $this->createSchool(['public_profile_enabled' => false]);

        $this->get("/{$school->slug}")->assertNotFound();
    }

    public function test_school_homepage_gated_by_active_status(): void
    {
        $school = $this->createEnabledSchool(['status' => 'inactive']);

        $this->get("/{$school->slug}")->assertNotFound();
    }

    public function test_unknown_school_slug_returns_404(): void
    {
        $this->get('/no-such-school')->assertNotFound();
    }

    public function test_platform_manifest_route_returns_json(): void
    {
        $this->get('/manifest.webmanifest')
            ->assertOk()
            ->assertHeader('Content-Type', 'application/manifest+json')
            ->assertJsonPath('display', 'standalone');
    }

    public function test_school_manifest_is_branded(): void
    {
        $school = $this->createEnabledSchool(['primary_color' => '#123456']);

        $this->get("/{$school->slug}/manifest.webmanifest")
            ->assertOk()
            ->assertHeader('Content-Type', 'application/manifest+json')
            ->assertJsonPath('name', $school->name)
            ->assertJsonPath('start_url', '/' . $school->slug)
            ->assertJsonPath('theme_color', '#123456');
    }

    public function test_school_manifest_gated_on_active_status(): void
    {
        $school = $this->createEnabledSchool(['status' => 'suspended']);

        $this->get("/{$school->slug}/manifest.webmanifest")->assertNotFound();
    }
}