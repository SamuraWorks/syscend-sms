<?php

namespace Tests\Feature\Students;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\InteractsWithDomain;
use Tests\TestCase;

class ParentManagementTest extends TestCase
{
    use RefreshDatabase, InteractsWithDomain;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seedRolesAndPermissions();
    }

    private function schoolWithContext(): array
    {
        $school = $this->createSchool();
        $this->activateSchool($school);
        $this->actingAsSchoolAdmin($school);
        return [$school];
    }

    public function test_parents_index_returns_ok(): void
    {
        [$school] = $this->schoolWithContext();
        $this->createGuardian($school);

        $this->get(route('school-admin.parents.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('SchoolAdmin/Parents/Index'));
    }

    public function test_parents_create_page_returns_ok(): void
    {
        [$school] = $this->schoolWithContext();

        $this->get(route('school-admin.parents.create'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('SchoolAdmin/Parents/Create'));
    }

    public function test_parent_can_be_created(): void
    {
        [$school] = $this->schoolWithContext();

        $this->post(route('school-admin.parents.store'), [
            'name'     => 'Mohamed Sesay',
            'relation' => 'father',
            'phone'    => '+23276000002',
        ])->assertRedirect(route('school-admin.parents.index'))->assertSessionHas('success');

        $this->assertDatabaseHas('guardians', [
            'school_id' => $school->id,
            'name'      => 'Mohamed Sesay',
            'relation'  => 'father',
            'phone'     => '+23276000002',
        ]);
    }

    public function test_parent_store_requires_valid_relation(): void
    {
        [$school] = $this->schoolWithContext();

        $this->post(route('school-admin.parents.store'), [
            'name'     => 'Test Parent',
            'relation' => 'not-a-relation',
            'phone'    => '+23276000003',
        ])->assertSessionHasErrors('relation');
    }

    public function test_parent_can_be_viewed_and_updated(): void
    {
        [$school] = $this->schoolWithContext();
        $parent = $this->createGuardian($school, ['name' => 'Jane Doe']);

        $this->get(route('school-admin.parents.show', $parent))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('SchoolAdmin/Parents/Show'));

        $this->put(route('school-admin.parents.update', $parent), [
            'name'     => 'Jane Smith',
            'relation' => 'mother',
            'phone'    => '+23276000004',
        ])->assertRedirect()->assertSessionHas('success');

        $this->assertDatabaseHas('guardians', [
            'id'   => $parent->id,
            'name' => 'Jane Smith',
        ]);
    }

    public function test_parent_can_be_deleted(): void
    {
        [$school] = $this->schoolWithContext();
        $parent = $this->createGuardian($school, ['name' => 'Jane Doe']);

        $this->delete(route('school-admin.parents.destroy', $parent))
            ->assertRedirect()->assertSessionHas('success');

        $this->assertSoftDeleted('guardians', ['id' => $parent->id]);
    }

    public function test_parent_creation_rejects_duplicate_contacts(): void
    {
        [$school] = $this->schoolWithContext();
        $this->createGuardian($school, ['name' => 'Jane Doe', 'phone' => '+23276000005']);

        $this->post(route('school-admin.parents.store'), [
            'name'     => 'Jane Doe Jr',
            'relation' => 'guardian',
            'phone'    => '+23276000005',
        ])->assertRedirect()->assertSessionHas('error');
    }
}