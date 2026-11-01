<?php

namespace Tests\Feature\Auth;

use App\Models\Guardian;
use App\Models\School;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\RateLimiter;
use Tests\Concerns\InteractsWithDomain;
use Tests\TestCase;

class StudentSelfRegistrationTest extends TestCase
{
    use RefreshDatabase, InteractsWithDomain;

    private School $school;
    private SchoolClass $class;
    private Student $student;
    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seedRolesAndPermissions();
        $this->ensureRole('student');

        foreach (['registration-verify-student', 'registration-verify-parent', 'registration-verify-staff'] as $key) {
            RateLimiter::clear($key . ':127.0.0.1');
        }

        $this->school = $this->createSchool();
        $this->class = $this->createClass($this->school);
        $this->student = $this->createStudent($this->school, $this->class, [
            'student_id'  => 'STU-REG-1',
            'first_name'  => 'John',
            'last_name'   => 'Doe',
            'email'       => null,
        ]);
        $this->admin = $this->createUser(['school_id' => $this->school->id]);
    }

    public function test_guest_can_view_landing_and_student_registration_pages(): void
    {
        $this->get('/' . $this->school->slug . '/register')->assertOk();
        $this->get('/' . $this->school->slug . '/register/student')->assertOk();
    }

    public function test_verify_rejects_unknown_student_id(): void
    {
        $this->post('/' . $this->school->slug . '/register/student/verify', [
            'student_id' => 'STU-NOT-FOUND',
            'full_name'  => 'John Doe',
        ])->assertSessionHasErrors('student_id');
    }

    public function test_verify_fails_when_name_does_not_match(): void
    {
        $this->post('/' . $this->school->slug . '/register/student/verify', [
            'student_id' => $this->student->student_id,
            'full_name'  => 'Someone Else',
        ])->assertSessionHasErrors('student_id');
    }

    public function test_verify_requires_name(): void
    {
        $this->post('/' . $this->school->slug . '/register/student/verify', [
            'student_id' => $this->student->student_id,
        ])->assertSessionHasErrors('surname');
    }

    public function test_verify_requires_email_when_student_has_one_on_file(): void
    {
        $this->student->update(['email' => 'john.registry@example.com']);

        $this->post('/' . $this->school->slug . '/register/student/verify', [
            'student_id' => $this->student->student_id,
            'full_name'  => 'John Doe',
        ])->assertSessionHasErrors('email');

        $this->post('/' . $this->school->slug . '/register/student/verify', [
            'student_id' => $this->student->student_id,
            'full_name'  => 'John Doe',
            'email'      => 'someone@example.com',
        ])->assertSessionHasErrors('student_id');
    }

    public function test_verify_success_sets_verification_session(): void
    {
        $this->post('/' . $this->school->slug . '/register/student/verify', [
            'student_id' => $this->student->student_id,
            'full_name'  => 'John Doe',
        ])->assertRedirect()->assertSessionHas('verified');

        $this->assertNotNull(session('registration.verify_token'));
    }

    public function test_complete_without_previous_verification_fails(): void
    {
        $this->post('/' . $this->school->slug . '/register/student/complete', [
            'email'                 => 'new.student@example.com',
            'password'              => 'password123',
            'password_confirmation' => 'password123',
        ])->assertSessionHasErrors('message');

        $this->assertGuest();
    }

    public function test_complete_creates_account_and_claims_record(): void
    {
        $this->post('/' . $this->school->slug . '/register/student/verify', [
            'student_id' => $this->student->student_id,
            'full_name'  => 'John Doe',
        ]);

        $this->post('/' . $this->school->slug . '/register/student/complete', [
            'email'                 => 'john.doe@example.com',
            'password'              => 'password123',
            'password_confirmation' => 'password123',
        ])->assertRedirect();

        $user = User::where('email', 'john.doe@example.com')->firstOrFail();
        $this->assertAuthenticatedAs($user);
        $this->assertTrue($user->hasRole('student'));

        $student = $this->student->fresh();
        $this->assertSame($user->id, $student->user_id);
        $this->assertSame($user->id, $student->claimed_by);
        $this->assertSame('registered', $student->registration_status);
    }

    public function test_complete_rejects_duplicate_email(): void
    {
        $this->post('/' . $this->school->slug . '/register/student/verify', [
            'student_id' => $this->student->student_id,
            'full_name'  => 'John Doe',
        ]);

        $this->post('/' . $this->school->slug . '/register/student/complete', [
            'email'                 => $this->admin->email,
            'password'              => 'password123',
            'password_confirmation' => 'password123',
        ])->assertSessionHasErrors('email');
    }

    public function test_complete_rejects_short_password(): void
    {
        $this->post('/' . $this->school->slug . '/register/student/verify', [
            'student_id' => $this->student->student_id,
            'full_name'  => 'John Doe',
        ]);

        $this->post('/' . $this->school->slug . '/register/student/complete', [
            'email'                 => 'short.pass@example.com',
            'password'              => 'short',
            'password_confirmation' => 'short',
        ])->assertSessionHasErrors('password');
    }

    public function test_existing_temp_account_can_log_in(): void
    {
        $user = $this->createUser([
            'school_id'            => $this->school->id,
            'is_temporary_password' => true,
            'must_change_password'  => true,
        ], 'student');

        $this->post('/login', [
            'email'    => $user->email,
            'password' => 'password',
        ])->assertRedirect('/dashboard');
    }
}