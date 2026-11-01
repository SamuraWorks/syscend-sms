<?php

namespace Tests\Feature\SuperAdmin;

use App\Models\DemoRequest;
use App\Models\School;
use App\Models\User;
use App\Services\RoleRegistry;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\InteractsWithDomain;
use Tests\TestCase;

class DemoRequestConversionTest extends TestCase
{
    use RefreshDatabase, InteractsWithDomain;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seedRolesAndPermissions();
    }

    private function createDemoRequest(array $attributes = []): DemoRequest
    {
        return DemoRequest::create(array_merge([
            'request_id'               => 'DEMO-' . strtoupper(bin2hex(random_bytes(4))),
            'status'                   => 'new',
            'school_name'              => 'Kissi Road Primary',
            'school_type'              => 'government',
            'school_level'             => 'primary',
            'district'                 => 'Kailahun',
            'number_of_students'       => 200,
            'number_of_teachers'       => 12,
            'contact_name'             => 'Alpha Sesay',
            'contact_position'         => 'principal',
            'contact_email'            => 'alpha@example.test',
            'contact_phone'            => '+23276000001',
            'modules_of_interest'      => ['students', 'fees'],
            'current_management'       => 'paper',
            'preferred_contact_method' => 'phone',
        ], $attributes));
    }

    public function test_super_admin_can_convert_demo_request_to_school(): void
    {
        $this->actingAsSuperAdmin();
        $demo = $this->createDemoRequest();

        $this->post("/super-admin/demo-requests/{$demo->id}/convert")
            ->assertRedirect(route('super-admin.demo-requests.show', $demo));

        $school = School::where('demo_request_id', $demo->id)->first();
        $this->assertNotNull($school);
        $this->assertSame('Kissi Road Primary', $school->name);
        $this->assertSame('active', $school->status);

        $admin = User::where('school_id', $school->id)->first();
        $this->assertNotNull($admin);
        $this->assertTrue($admin->hasRole(RoleRegistry::SCHOOL_ADMIN));
        $this->assertSame('alpha@example.test', $admin->email);

        $this->assertSame('converted', $demo->fresh()->status);
        $this->assertDatabaseHas('demo_request_status_history', [
            'demo_request_id' => $demo->id,
            'new_status'      => 'converted',
        ]);
    }

    public function test_already_converted_request_cannot_be_converted_again(): void
    {
        $this->actingAsSuperAdmin();
        $demo = $this->createDemoRequest();

        $this->post("/super-admin/demo-requests/{$demo->id}/convert")->assertRedirect();

        $this->assertSame(1, School::where('demo_request_id', $demo->id)->count());

        $this->post("/super-admin/demo-requests/{$demo->id}/convert")
            ->assertRedirect(route('super-admin.demo-requests.show', $demo))
            ->assertSessionHas('error');

        $this->assertSame(1, School::where('demo_request_id', $demo->id)->count());
        $this->assertSame(1, User::where('school_id', $demo->convertedSchool->id)->count());
    }
}