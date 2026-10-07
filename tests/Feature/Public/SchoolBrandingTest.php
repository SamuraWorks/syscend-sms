<?php

namespace Tests\Feature\Public;

use App\Models\SchoolSetting;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Tests\Concerns\InteractsWithDomain;
use Tests\TestCase;

class SchoolBrandingTest extends TestCase
{
    use RefreshDatabase, InteractsWithDomain;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seedAllRolesAndPermissions();
    }

    public function test_branding_accessor_includes_school_settings_assets(): void
    {
        $school = $this->createSchool();

        SchoolSetting::set($school->id, 'favicon', 'schools/branding/fav.ico', 'branding');
        SchoolSetting::set($school->id, 'tagline', 'Excellence in Education', 'branding');
        SchoolSetting::set($school->id, 'footer_text', '© 2026 Test School.', 'branding');

        $branding = $school->branding;

        $this->assertSame('Excellence in Education', $branding['tagline']);
        $this->assertSame('© 2026 Test School.', $branding['footer_text']);
        $this->assertSame(Storage::disk('public')->url('schools/branding/fav.ico'), $branding['favicon_url']);
    }

    public function test_settings_branding_saves_colors_and_text(): void
    {
        $school  = $this->createSchool();
        $this->activateSchool($school);
        $this->actingAsSchoolAdmin($school);

        $response = $this->post('/school/settings/branding', [
            'primary_color'   => '#112233',
            'secondary_color' => '#445566',
            'tagline'         => 'Learning for Life',
            'footer_text'     => '© 2026 Our School.',
        ]);

        $response->assertRedirect();

        $this->assertDatabaseHas('schools', [
            'id'              => $school->id,
            'primary_color'   => '#112233',
            'secondary_color' => '#445566',
        ]);

        $this->assertDatabaseHas('school_settings', [
            'school_id' => $school->id,
            'key'       => 'tagline',
            'value'     => 'Learning for Life',
        ]);
        $this->assertDatabaseHas('school_settings', [
            'school_id' => $school->id,
            'key'       => 'footer_text',
            'value'     => '© 2026 Our School.',
        ]);
    }

    public function test_favicon_url_shared_prefers_school_favicon(): void
    {
        $school = $this->createSchool();
        $this->activateSchool($school);
        $this->actingAsSchoolAdmin($school);

        SchoolSetting::set($school->id, 'favicon', 'schools/branding/fav.ico', 'branding');

        $this->get(route('school.students.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('faviconUrl', Storage::disk('public')->url('schools/branding/fav.ico')));
    }
}