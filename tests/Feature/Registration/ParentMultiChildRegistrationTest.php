<?php

namespace Tests\Feature\Registration;

use App\Models\Guardian;
use App\Models\School;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\User;
use App\Services\FamilyResolver;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\RateLimiter;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\Concerns\InteractsWithDomain;
use Tests\TestCase;

/**
 * A parent with more than one child in a school is often stored as one
 * guardian row per child. One parent account must still link every row and
 * show every child.
 */
class ParentMultiChildRegistrationTest extends TestCase
{
    use RefreshDatabase, InteractsWithDomain;

    private School $school;
    private \App\Models\SchoolClass $class;
    private Guardian $guardianA;
    private Guardian $guardianB;
    private \App\Models\Student $childA;
    private \App\Models\Student $studentB;

    private string $email = 'jane.doe@example.test';
    private string $phone = '+232761234567';

    protected function setUp(): void
    {
        parent::setUp();

        $this->seedRolesAndPermissions();
        $this->ensureRole('parent');

        RateLimiter::clear('registration-verify-parent:127.0.0.1');

        $this->school = $this->createSchool();
        $this->activateSchool($this->school);
        $class = $this->createClass($this->school, ['name' => 'JSS 1']);

        // A parent with two children is stored as one guardian row per child,
        // both sharing the same email and phone on file.
        $guardianA = $this->createGuardian($this->school, [
            'name'  => 'Jane Doe',
            'email' => $this->email,
            'phone' => '+232760000001',
        ]);
        $guardianB = $this->createGuardian($this->school, [
            'name'  => 'Jane Doe',
            'email' => $this->email,
            'phone' => '+232760000001',
        ]);

        $studentA = $this->createStudent($this->school, $class, [
            'student_id' => 'STU-A',
            'last_name'  => 'Doe',
            'guardian_id'=> $guardianA->id,
        ]);
        $studentB = $this->createStudent($this->school, $class, [
            'student_id' => 'STU-B',
            'last_name'  => 'Doe',
            'guardian_id'=> $guardianB->id,
        ]);

        // Link via the pivot as well (both link sources used in production).
        $studentA->guardians()->attach($guardianA->id, ['school_id' => $this->school->id, 'relationship' => 'parent', 'is_primary' => true]);
        $studentB->guardians()->attach($guardianB->id, ['school_id' => $this->school->id, 'relationship' => 'parent', 'is_primary' => true]);

        $this->guardianA = $guardianA;
        $this->guardianB = $guardianB;
        $this->studentA = $studentA;
        $this->studentB = $studentB;
    }

    public function test_verify_preview_lists_every_child_of_the_parent(): void
    {
        $this->post($this->verifyUrl(), [
            'student_id' => 'STU-A',
            'surname'    => 'Doe',
            'email'      => $this->email,
            'phone'      => '+232760000001',
        ])->assertRedirect()->assertSessionHas('verified');

        $verified = session('verified');

        $this->assertCount(2, $verified['children']);
        $this->assertEqualsCanonicalizing(
            ['John Doe', 'John Doe'],
            array_column($verified['children'], 'name'),
        );
    }

    public function test_completing_registration_links_every_guardian_row(): void
    {
        $this->post($this->verifyUrl(), [
            'student_id' => 'STU-A',
            'surname'    => 'Doe',
            'email'      => $this->email,
            'phone'      => '+232760000001',
        ])->assertRedirect();

        $this->post($this->completeUrl(), [
            'password'              => 'password123',
            'password_confirmation' => 'password123',
        ])->assertRedirect();

        $user = User::where('email', $this->email)->firstOrFail();
        $this->assertAuthenticatedAs($user);

        $this->assertSame($user->id, $this->guardianA->fresh()->user_id);
        $this->assertSame($user->id, $this->guardianB->fresh()->user_id);
        $this->assertSame('registered', $this->guardianB->fresh()->registration_status);
    }

    public function test_parent_dashboard_shows_all_children_across_guardian_rows(): void
    {
        $this->registerParentViaChild('STU-A');

        $user = User::where('email', $this->email)->firstOrFail();
        $user->forceFill(['email_verified_at' => now()])->save();

        $this->get('/school/parent/dashboard')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Parent/Dashboard')
                ->where('linked', true)
                ->has('children', 2));
    }

    public function test_verifying_a_second_child_reports_the_existing_account_with_all_children(): void
    {
        $this->registerParentViaChild('STU-A');

        $this->post($this->verifyUrl(), [
            'student_id' => 'STU-B',
            'surname'    => 'Doe',
            'email'      => $this->email,
            'phone'      => '+232760000001',
        ])->assertRedirect()->assertSessionHas('already_registered');

        $this->assertCount(2, session('already_registered')['children']);
    }

    public function test_family_resolver_groups_guardians_by_phone_when_email_is_missing(): void
    {
        $resolver = new FamilyResolver();

        $a = $this->createGuardian($this->school, ['email' => null, 'phone' => '+232760000009']);
        $b = $this->createGuardian($this->school, ['email' => null, 'phone' => '+232760000009']);
        $c = $this->createGuardian($this->school, ['email' => 'other@example.com', 'phone' => '+232760000010']);

        $this->assertCount(2, $resolver->guardianGroup($a));
        $this->assertFalse($resolver->sameParent($a, $c));
    }

    private function verifyUrl(): string
    {
        return '/' . $this->school->slug . '/register/parent/verify';
    }

    private function completeUrl(): string
    {
        return '/' . $this->school->slug . '/register/parent/complete';
    }

    private function registerParentViaChild(string $studentId): void
    {
        $this->post($this->verifyUrl(), [
            'student_id' => $studentId,
            'surname'    => 'Doe',
            'email'      => $this->email,
            'phone'      => '+232760000001',
        ])->assertRedirect();

        $this->post($this->completeUrl(), [
            'password'              => 'password123',
            'password_confirmation' => 'password123',
        ])->assertRedirect();
    }
}
