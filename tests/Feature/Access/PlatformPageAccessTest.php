<?php

namespace Tests\Feature\Access;

use App\Models\School;
use App\Models\SchoolSubscription;
use App\Services\RoleRegistry;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\InteractsWithDomain;
use Tests\TestCase;

class PlatformPageAccessTest extends TestCase
{
    use RefreshDatabase, InteractsWithDomain;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seedAllRolesAndPermissions();
    }

    /**
     * The pages that were broken for platform roles: either a 404 because
     * getSchoolId() failed closed with no school context, or a 500 because
     * PerformanceController read Auth::user()->school_id directly.
     */
    private const PLATFORM_PAGES = [
        'school.performance.overview',
        'support',
        'school.communication.announcements',
        'school.communication.messages',
        'school.communication.notifications',
        'school.communication.email-templates',
        'school.communication.blast',
        'school.reports.dashboard',
        'school.reports.audit-log',
    ];

    public function test_super_admin_can_reach_every_platform_page(): void
    {
        $school = $this->createSchool();
        $this->activateSchool($school);
        $this->actingAsSuperAdmin();

        foreach (self::PLATFORM_PAGES as $routeName) {
            $this->get(route($routeName))
                ->assertOk();
        }
    }

    public function test_super_admin_can_reach_performance_overview_without_school_id(): void
    {
        // Regression guard: PerformanceController::schoolId() used to return
        // Auth::user()->school_id (null for platform roles) => TypeError 500.
        $school = $this->createSchool();
        $this->activateSchool($school);
        $this->actingAsSuperAdmin();

        $this->get(route('school.performance.overview'))
            ->assertOk();
    }

    public function test_platform_role_still_fails_closed_when_no_school_exists(): void
    {
        $this->actingAsSuperAdmin();

        $this->assertSame(0, School::count(), 'precondition: database has no schools');

        $this->get(route('school.reports.dashboard'))
            ->assertNotFound();
    }

    public function test_platform_role_falls_back_to_the_first_school_when_several_exist(): void
    {
        $first = $this->createSchool();
        $this->activateSchool($first);
        $this->createSchool(); // second school makes the context ambiguous

        $this->actingAsSuperAdmin();

        $this->get(route('school.reports.dashboard'))
            ->assertOk();
    }

    public function test_non_platform_user_without_school_context_fails_closed_when_ambiguous(): void
    {
        $this->activateSchool($this->createSchool());
        $this->createSchool(); // two schools => no unambiguous context

        // A teacher with no school_id must not inherit the platform fallback.
        $this->actingAs($this->createUser([], RoleRegistry::TEACHER));

        $this->get(route('school.reports.dashboard'))
            ->assertNotFound();
    }

    public function test_ministry_admin_is_kept_off_school_scoped_pages(): void
    {
        // Deliberate separation: ministry/district roles have their own
        // ministry/* routes and must not read a single school's data.
        $school = $this->createSchool();
        $this->activateSchool($school);
        $this->actingAs($this->createUser([], RoleRegistry::MINISTRY_ADMIN));

        foreach (self::PLATFORM_PAGES as $routeName) {
            if ($routeName === 'support') {
                continue; // public marketing page
            }
            $this->get(route($routeName))->assertForbidden();
        }

        $this->get(route('ministry.communication.announcements'))->assertOk();
    }

    // ── Module gating ──────────────────────────────────────────────────

    public function test_communication_routes_are_blocked_when_module_not_enabled(): void
    {
        $school = $this->createSchool();
        $package = $this->createPackage();
        // Deliberately excludes 'communication' so the gate must engage.
        $this->enableModulesFor($package, ['attendance', 'fees', 'library']);
        $this->createSubscription($school, $package);

        $this->actingAsSchoolAdmin($school);

        $this->get(route('school.communication.announcements'))
            ->assertRedirect('/dashboard')
            ->assertSessionHas('error');
    }

    public function test_communication_routes_are_allowed_when_module_enabled(): void
    {
        $school = $this->createSchool();
        $this->activateSchool($school);

        $this->actingAsSchoolAdmin($school);

        $this->get(route('school.communication.announcements'))
            ->assertOk();
    }

    /**
     * The gate must actually match on path segments. Before the fix it compared
     * "school/communication/announcements" against the key "/communication",
     * so it never matched and every module passed regardless of the package.
     */
    public function test_expired_subscription_blocks_every_gated_module(): void
    {
        foreach ([
            'school.communication.announcements',
            'school.reports.dashboard',
        ] as $routeName) {
            $school = $this->createSchool();
            $package = $this->createPackage();
            $this->enableModulesFor($package);
            $subscription = $this->createSubscription($school, $package);
            $subscription->update(['status' => 'expired']);

            $this->actingAsSchoolAdmin($school);

            $this->get(route($routeName))
                ->assertRedirect('/dashboard')
                ->assertSessionHas('error');
        }
    }

    public function test_trial_subscription_is_allowed_to_use_modules(): void
    {
        $school = $this->createSchool();
        $package = $this->createPackage();
        $this->enableModulesFor($package);

        SchoolSubscription::create([
            'school_id'      => $school->id,
            'package_id'     => $package->id,
            'start_date'     => now()->subDay(),
            'end_date'       => now()->addDays(14),
            'status'         => 'trial',
            'price_per_term' => 500,
            'amount_paid'    => 0,
        ]);
        $school->update(['current_subscription_id' => SchoolSubscription::where('school_id', $school->id)->value('id')]);

        $this->actingAsSchoolAdmin($school);

        $this->get(route('school.communication.announcements'))
            ->assertOk();
    }

    // ── Super-admin platform performance ───────────────────────────────

    public function test_platform_performance_renders_when_no_schools_exist(): void
    {
        $this->actingAsSuperAdmin();

        $this->get('/super-admin/performance')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('SuperAdmin/PlatformPerformance')
                ->where('hasSchools', false));
    }

    /**
     * Regression guard: the controller used School::withCount('students') but
     * School has no students() relation, which threw BadMethodCallException and
     * returned a 500 on the Platform Analytics page.
     */
    public function test_platform_performance_renders_with_schools_and_enrolment(): void
    {
        $school = $this->createSchool(['name' => 'Alpha Academy']);
        $this->activateSchool($school);
        $class = $this->createClass($school);

        $this->createStudent($school, $class, ['status' => 'active']);
        $this->createStudent($school, $class, ['status' => 'active']);
        $this->createStudent($school, $class, ['status' => 'inactive']);

        $this->actingAsSuperAdmin();

        $this->get('/super-admin/performance')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('SuperAdmin/PlatformPerformance')
                ->where('hasSchools', true)
                ->where('totalSchools', 1)
                // only the two active students are counted
                ->where('totalStudents', 2)
                ->has('schoolStats', 1)
                ->where('schoolStats.0.school_name', 'Alpha Academy')
                ->where('schoolStats.0.student_count', 2));
    }
}