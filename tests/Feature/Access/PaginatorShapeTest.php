<?php

namespace Tests\Feature\Access;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\InteractsWithDomain;
use Tests\TestCase;

/**
 * Inertia v3 serialises a raw paginator flat, so a controller that hands one
 * straight to Inertia::render() produces {data, current_page, last_page, ...}
 * while the pages in this app read `prop.meta.*` because the established
 * convention is to build that shape by hand.
 *
 * When the two disagree the React component dies with
 * "Cannot read properties of undefined (reading 'last_page')" - a white screen
 * that no HTTP assertion catches, because the response is still 200. These
 * tests pin the wire shape itself.
 */
class PaginatorShapeTest extends TestCase
{
    use RefreshDatabase, InteractsWithDomain;

    private function schoolAdmin(): array
    {
        $school = $this->createSchool();
        $this->activateSchool($school);
        $admin = $this->actingAsSchoolAdmin($school);

        return [$school, $admin];
    }

    public function test_subjects_page_receives_nested_meta(): void
    {
        [$school] = $this->schoolAdmin();

        $this->get('/school/subjects')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('SchoolAdmin/Subjects/Index')
                ->has('subjects.data')
                ->where('subjects.meta.current_page', 1)
                ->where('subjects.meta.last_page', 1)
                ->where('subjects.meta.total', 0)
                // the raw paginator would have put these alongside `data`
                ->missing('subjects.current_page')
            );
    }

    public function test_user_audit_log_page_receives_nested_meta(): void
    {
        [, $admin] = $this->schoolAdmin();

        $this->get("/school/users/{$admin->id}/audit-logs")
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('SchoolAdmin/Users/AuditLogs')
                ->has('logs.data')
                ->where('logs.meta.current_page', 1)
                ->where('logs.meta.total', 0)
                ->missing('logs.current_page')
            );
    }

    /**
     * The component is rendered by two controllers with different prefixes, and
     * only one of them used to build `meta` - so the page worked on
     * /school/imports but rendered no pagination at all on
     * /school-admin/imports (or crashed, depending on direction of the fix).
     */
    public function test_imports_component_gets_the_same_shape_on_both_routes(): void
    {
        $this->schoolAdmin();

        foreach (['/school-admin/imports', '/school/imports'] as $uri) {
            $this->get($uri)
                ->assertOk()
                ->assertInertia(fn ($page) => $page
                    ->component('SchoolAdmin/Imports/Index')
                    ->has('imports.data')
                    ->where('imports.meta.current_page', 1)
                    ->where('imports.meta.last_page', 1)
                    ->where('imports.meta.total', 0)
                    ->missing('imports.current_page')
                );
        }
    }
}