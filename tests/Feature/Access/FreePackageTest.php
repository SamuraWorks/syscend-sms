<?php

namespace Tests\Feature\Access;

use App\Models\Package;
use App\Models\School;
use App\Models\SchoolSubscription;
use App\Services\SchoolAdminOnboardingService;
use Database\Seeders\PackageSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\InteractsWithDomain;
use Tests\TestCase;

class FreePackageTest extends TestCase
{
    use RefreshDatabase, InteractsWithDomain;

    private const ALL_MODULES = [
        'academics', 'alumni', 'assets', 'attendance', 'communication',
        'examinations', 'fees', 'hr', 'inventory', 'library', 'proposals', 'transport',
    ];

    public function test_seeder_creates_a_free_package_granting_every_module(): void
    {
        $this->seed(PackageSeeder::class);

        $package = Package::where('slug', 'free')->first();

        $this->assertNotNull($package);
        $this->assertTrue($package->is_active);
        $this->assertEquals(0, (float) $package->price_monthly);
        $this->assertEquals(0, (float) $package->price_yearly);
        $this->assertEquals(0, (float) $package->price_per_term);

        $granted = $package->moduleSlugs();
        sort($granted);
        $expected = self::ALL_MODULES;
        sort($expected);

        $this->assertSame($expected, $granted);
    }

    public function test_seeder_is_idempotent(): void
    {
        $this->seed(PackageSeeder::class);
        $this->seed(PackageSeeder::class);
        $this->seed(PackageSeeder::class);

        $this->assertSame(1, Package::where('slug', 'free')->count());
        $this->assertSame(
            count(self::ALL_MODULES),
            Package::where('slug', 'free')->first()->modules()->count()
        );
    }

    public function test_seeder_is_wired_into_the_default_database_seeder(): void
    {
        $this->seed(\Database\Seeders\DatabaseSeeder::class);

        $this->assertNotNull(
            Package::where('slug', 'free')->first(),
            'DatabaseSeeder must produce a usable package or school trials fail'
        );
    }

    public function test_new_school_gets_an_active_free_subscription_that_never_expires(): void
    {
        $this->seed(PackageSeeder::class);

        $school = School::create([
            'name'    => 'Free Trial School',
            'slug'    => 'free-trial-school',
            'email'   => 'free@school.test',
            'status'  => 'active',
        ]);

        $subscription = SchoolSubscription::startTrialForSchool($school);

        $this->assertNotNull($subscription, 'a free package must provision a subscription');
        $this->assertSame('active', $subscription->status);
        $this->assertFalse($subscription->is_trial);
        $this->assertNull($subscription->trial_ends_at);
        $this->assertTrue($subscription->end_date->isFuture());
        $this->assertTrue($subscription->is_fully_paid);
        $this->assertSame($subscription->id, $school->fresh()->current_subscription_id);
    }

    public function test_free_subscription_enables_every_module(): void
    {
        $this->seedAllRolesAndPermissions();
        $this->seed(PackageSeeder::class);

        $result = app(SchoolAdminOnboardingService::class)->createSchoolWithAdmin(
            ['name' => 'Onboarded School', 'slug' => 'onboarded-school', 'email' => 'admin@onboarded.test'],
            ['name' => 'Admin Person', 'email' => 'admin@onboarded.test', 'phone' => '+232770000009'],
            null,
            'Str0ngPassw0rd!'
        );

        $school = $result['school']->fresh();

        foreach (self::ALL_MODULES as $slug) {
            $this->assertTrue(
                $school->hasModule($slug),
                "module '{$slug}' must be enabled by the free package"
            );
        }
    }

    public function test_paid_package_still_gets_a_time_limited_trial(): void
    {
        // Guard the paid path so the free-package shortcut does not regress it.
        Package::create([
            'name'           => 'Paid',
            'slug'           => 'paid-plan',
            'price_monthly'  => 200,
            'price_yearly'   => 1500,
            'price_per_term' => 500,
            'is_active'      => true,
            'features'       => [],
        ]);

        $school = School::create([
            'name'   => 'Paid School',
            'slug'   => 'paid-school',
            'email'  => 'paid@school.test',
            'status' => 'active',
        ]);

        $subscription = SchoolSubscription::startTrialForSchool($school, 14);

        $this->assertSame('trial', $subscription->status);
        $this->assertTrue($subscription->is_trial);
        $this->assertNotNull($subscription->trial_ends_at);
    }

    /**
     * A cheaper paid package must not shadow the free tier: new signups get the
     * free plan, which is what makes "everything is free" actually work.
     */
    public function test_free_package_wins_over_cheaper_by_id_paid_packages(): void
    {
        Package::create(['name' => 'Starter', 'slug' => 'starter', 'price_per_term' => 350000, 'price_monthly' => 100000, 'is_active' => true, 'features' => []]);
        Package::create(['name' => 'Standard', 'slug' => 'standard', 'price_per_term' => 900000, 'price_monthly' => 250000, 'is_active' => true, 'features' => []]);
        $this->seed(PackageSeeder::class);

        $school = School::create([
            'name'   => 'Shadow Test School',
            'slug'   => 'shadow-test-school',
            'email'  => 'shadow@school.test',
            'status' => 'active',
        ]);

        $subscription = SchoolSubscription::startTrialForSchool($school);

        $this->assertSame('free', $subscription->package->slug);
        $this->assertSame('active', $subscription->status);

        foreach (self::ALL_MODULES as $slug) {
            $this->assertTrue($school->fresh()->hasModule($slug));
        }
    }

    // ── Public self-service route ──────────────────────────────────────

    public function test_start_trial_creates_a_school_with_full_module_access(): void
    {
        $this->seedAllRolesAndPermissions();
        $this->seed(PackageSeeder::class);

        $this->post(route('start-trial.store'), [
            'name'         => 'Greenfield Academy',
            'email'        => 'office@greenfield.test',
            'phone'        => '+232770000123',
            'city'         => 'Freetown',
            'admin_name'   => 'Grace Admin',
            'admin_email'  => 'grace@greenfield.test',
            'admin_phone'  => '+232770000124',
            'password'     => 'Str0ngPassw0rd!',
            'password_confirmation' => 'Str0ngPassw0rd!',
        ])->assertRedirect(route('school.school-setup'));

        $school = School::where('slug', 'greenfield-academy')->first();
        $this->assertNotNull($school);

        // The admin is logged in and gets a free, fully-enabled subscription.
        $this->assertAuthenticated();
        $this->assertSame($school->id, auth()->user()->school_id);

        $subscription = $school->fresh()->currentSubscription;
        $this->assertNotNull($subscription);
        $this->assertSame('free', $subscription->package->slug);
        $this->assertSame('active', $subscription->status);
        $this->assertEquals(0, (float) $subscription->price_per_term);
        $this->assertTrue($subscription->is_fully_paid);

        foreach (self::ALL_MODULES as $slug) {
            $this->assertTrue(
                $school->hasModule($slug),
                "module '{$slug}' must be available to a new free-trial school"
            );
        }
    }

    public function test_start_trial_requires_the_admin_account_fields(): void
    {
        $this->post(route('start-trial.store'), ['name' => 'No Admin School'])
            ->assertSessionHasErrors(['admin_name', 'admin_email', 'password']);
    }
}