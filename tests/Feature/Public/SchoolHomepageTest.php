<?php

namespace Tests\Feature\Public;

use App\Models\School;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\InteractsWithDomain;
use Tests\TestCase;

class SchoolHomepageTest extends TestCase
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
            'school_mission'         => 'Quality education for all.',
            'school_vision'          => 'To lead the region.',
            'primary_color'          => '#123456',
            'secondary_color'        => '#abcdef',
        ], $attributes));
    }

    public function test_home_serves_branded_school_homepage_for_single_active_school(): void
    {
        $school = $this->createEnabledSchool();

        $this->get('/')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Public/SchoolHomepage')
                ->where('school.id', $school->id)
                ->where('school.name', $school->name)
                ->where('school.slug', $school->slug)
                ->where('school.about_school', 'A leading school in Freetown.')
                ->where('school.primary_color', '#123456')
                ->where('school.secondary_color', '#abcdef')
                ->has('school.footer_text'));
    }

    public function test_home_falls_back_to_marketing_when_profile_disabled(): void
    {
        $this->createSchool(['public_profile_enabled' => false]);

        $this->get('/')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('Public/Homepage'));
    }

    public function test_home_falls_back_to_marketing_when_no_school_exists(): void
    {
        $this->get('/')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('Public/Homepage'));
    }

    public function test_home_falls_back_to_marketing_when_multiple_schools_are_ambiguous(): void
    {
        $this->createEnabledSchool();
        $this->createEnabledSchool();

        $this->get('/')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('Public/Homepage'));
    }

    public function test_home_prefers_configured_installation_school(): void
    {
        $this->createEnabledSchool();
        $configured = $this->createEnabledSchool();

        config()->set('app.installation_school_id', $configured->id);

        $this->get('/')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Public/SchoolHomepage')
                ->where('school.id', $configured->id));
    }

    public function test_home_fails_closed_when_configured_school_does_not_exist(): void
    {
        config()->set('app.installation_school_id', 999999);

        $this->get('/')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('Public/Homepage'));
    }

    public function test_home_redirects_authenticated_users_away(): void
    {
        $school = $this->createEnabledSchool();
        $this->actingAsSchoolAdmin($school);

        $this->get('/')->assertStatus(302);
    }
}