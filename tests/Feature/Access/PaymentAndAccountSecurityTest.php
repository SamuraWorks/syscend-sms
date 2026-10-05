<?php

namespace Tests\Feature\Access;

use App\Models\SubscriptionPayment;
use App\Services\SubscriptionPaymentService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Tests\Concerns\InteractsWithDomain;
use Tests\TestCase;

class PaymentAndAccountSecurityTest extends TestCase
{
    use RefreshDatabase, InteractsWithDomain;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seedAllRolesAndPermissions();
    }

    private function subscription(array $attributes = [])
    {
        $school = $this->createSchool();
        $package = $this->createPackage(['price_per_term' => 500]);
        $this->enableModulesFor($package);

        return $this->createSubscription($school, $package, array_merge([
            'status'         => 'active',
            'price_per_term' => 500,
            'amount_paid'    => 0,
        ], $attributes));
    }

    // ── Account status on login ────────────────────────────────────────

    public function test_suspended_user_cannot_log_in(): void
    {
        $school = $this->createSchool();
        $this->activateSchool($school);

        $user = $this->createUser([
            'school_id' => $school->id,
            'email'     => 'suspended@example.test',
            'password'  => Hash::make('correct-horse-battery'),
            'status'    => 'suspended',
        ]);

        $this->post('/login', [
            'email'    => $user->email,
            'password' => 'correct-horse-battery',
        ])->assertSessionHasErrors('email');

        $this->assertGuest();
    }

    public function test_inactive_user_cannot_log_in(): void
    {
        $school = $this->createSchool();
        $this->activateSchool($school);

        $user = $this->createUser([
            'school_id' => $school->id,
            'email'     => 'inactive@example.test',
            'password'  => Hash::make('correct-horse-battery'),
            'status'    => 'inactive',
        ]);

        $this->post('/login', [
            'email'    => $user->email,
            'password' => 'correct-horse-battery',
        ])->assertSessionHasErrors('email');

        $this->assertGuest();
    }

    public function test_active_user_can_still_log_in(): void
    {
        $school = $this->createSchool();
        $this->activateSchool($school);

        $user = $this->createUser([
            'school_id' => $school->id,
            'email'     => 'active@example.test',
            'password'  => Hash::make('correct-horse-battery'),
            'status'    => 'active',
        ]);

        $this->post('/login', [
            'email'    => $user->email,
            'password' => 'correct-horse-battery',
        ]);

        $this->assertAuthenticatedAs($user);
    }

    // ── Parent password reset ──────────────────────────────────────────

    public function test_parent_password_reset_stores_a_hash_not_plaintext(): void
    {
        $school = $this->createSchool();
        $this->activateSchool($school);

        $guardian = $this->createGuardian($school);
        $user = $this->createUser(['school_id' => $school->id]);
        $guardian->update(['user_id' => $user->id]);

        $this->actingAsSchoolAdmin($school);

        $this->post(route('school-admin.parents.reset-password', $guardian))
            ->assertSessionHas('temp_password');

        $temp = session('temp_password');
        $this->assertNotEmpty($temp);

        $fresh = $user->fresh();

        $this->assertNotSame($temp, $fresh->password, 'password must not be stored in cleartext');
        $this->assertTrue(Hash::check($temp, $fresh->password), 'the revealed password must still work');
        $this->assertTrue($fresh->force_password_change);
    }

    // ── Payment initiation ─────────────────────────────────────────────

    public function test_initiate_payment_honours_the_monime_method(): void
    {
        config([
            'services.monime.access_token' => 'test-token',
            'services.monime.space_id'     => 'test-space',
        ]);

        Http::fake([
            '*/checkout-sessions' => Http::response([
                'result' => [
                    'id'          => 'chk_123',
                    'redirectUrl' => 'https://pay.monime.test/checkout/chk_123',
                ],
            ], 200),
        ]);

        $subscription = $this->subscription();
        $result = app(SubscriptionPaymentService::class)->initiatePayment(
            $subscription, '+232770000001', 500.0, 'monime'
        );

        $this->assertTrue($result['success']);
        $this->assertSame('https://pay.monime.test/checkout/chk_123', $result['payment_url']);

        $payment = SubscriptionPayment::where('id', $result['payment_id'])->first();
        $this->assertSame('monime', $payment->method);
        $this->assertSame('chk_123', $payment->monime_session_id);
        $this->assertSame('pending', $payment->status);

        Http::assertSent(fn ($r) => str_contains($r->url(), '/checkout-sessions'));
    }

    public function test_initiate_payment_honours_the_orange_money_method(): void
    {
        config([
            'services.orange_money.platform_api_user'    => 'user',
            'services.orange_money.platform_api_key'     => 'key',
            'services.orange_money.platform_merchant_key' => 'merchant',
        ]);

        Http::fake([
            'api.orange.com/oauth/v3/token'                     => Http::response(['access_token' => 'tok'], 200),
            'api.orange.com/orange-money-webpay/*/v1/webpayment' => Http::response([
                'payment_url' => 'https://pay.orange.test/webpay/abc',
                'pay_token'   => 'paytok_1',
            ], 200),
        ]);

        $subscription = $this->subscription();
        $result = app(SubscriptionPaymentService::class)->initiatePayment(
            $subscription, '+232770000001', 500.0, 'orange_money'
        );

        $this->assertTrue($result['success']);
        $this->assertSame('paytok_1', $result['pay_token']);
        $this->assertSame('https://pay.orange.test/webpay/abc', $result['payment_url']);

        $payment = SubscriptionPayment::where('id', $result['payment_id'])->first();
        $this->assertSame('orange_money', $payment->method);

        Http::assertSent(fn ($r) => ! str_contains($r->url(), '/checkout-sessions'));
    }

    public function test_initiate_payment_marks_the_row_failed_when_the_gateway_rejects(): void
    {
        config(['services.monime.access_token' => 't', 'services.monime.space_id' => 's']);

        Http::fake(['*/checkout-sessions' => Http::response(['error' => 'nope'], 422)]);

        $subscription = $this->subscription();
        $result = app(SubscriptionPaymentService::class)->initiatePayment(
            $subscription, '+232770000001', 500.0, 'monime'
        );

        $this->assertFalse($result['success']);
        $this->assertSame('failed', SubscriptionPayment::sole()->status);
    }

    // ── Payment confirmation ───────────────────────────────────────────

    public function test_confirm_payment_accepts_a_matching_amount(): void
    {
        $subscription = $this->subscription();

        $payment = SubscriptionPayment::create([
            'school_id'       => $subscription->school_id,
            'subscription_id' => $subscription->id,
            'amount'          => 500,
            'method'          => 'monime',
            'transaction_ref' => 'SUB-TEST-1',
            'status'          => 'pending',
        ]);

        $service = app(SubscriptionPaymentService::class);

        $this->assertTrue($service->confirmPayment($payment, 500.0));
        $this->assertSame('confirmed', $payment->fresh()->status);
        $this->assertNotNull($payment->fresh()->confirmed_at);
    }

    public function test_confirm_payment_accepts_minor_unit_amounts(): void
    {
        $subscription = $this->subscription();

        $payment = SubscriptionPayment::create([
            'school_id'       => $subscription->school_id,
            'subscription_id' => $subscription->id,
            'amount'          => 500,
            'method'          => 'monime',
            'transaction_ref' => 'SUB-TEST-2',
            'status'          => 'pending',
        ]);

        // Monime reports 50000 cents for a 500.00 amount.
        $this->assertTrue(app(SubscriptionPaymentService::class)->confirmPayment($payment, 50000.0));
        $this->assertSame('confirmed', $payment->fresh()->status);
    }

    public function test_confirm_payment_rejects_a_mismatched_amount(): void
    {
        $subscription = $this->subscription();

        $payment = SubscriptionPayment::create([
            'school_id'       => $subscription->school_id,
            'subscription_id' => $subscription->id,
            'amount'          => 500,
            'method'          => 'monime',
            'transaction_ref' => 'SUB-TEST-3',
            'status'          => 'pending',
        ]);

        $this->assertFalse(app(SubscriptionPaymentService::class)->confirmPayment($payment, 1.0));
        $this->assertSame('failed', $payment->fresh()->status);
    }

    public function test_confirm_payment_rejects_a_zero_amount(): void
    {
        $subscription = $this->subscription();

        $payment = SubscriptionPayment::create([
            'school_id'       => $subscription->school_id,
            'subscription_id' => $subscription->id,
            'amount'          => 500,
            'method'          => 'monime',
            'transaction_ref' => 'SUB-TEST-4',
            'status'          => 'pending',
        ]);

        $this->assertFalse(app(SubscriptionPaymentService::class)->confirmPayment($payment, 0.0));
        $this->assertSame('failed', $payment->fresh()->status);
    }

    public function test_confirm_payment_activates_the_subscription_when_fully_paid(): void
    {
        $subscription = $this->subscription();

        $payment = SubscriptionPayment::create([
            'school_id'       => $subscription->school_id,
            'subscription_id' => $subscription->id,
            'amount'          => 500,
            'method'          => 'monime',
            'transaction_ref' => 'SUB-TEST-5',
            'status'          => 'pending',
        ]);

        app(SubscriptionPaymentService::class)->confirmPayment($payment, 500.0);

        $this->assertSame('active', $subscription->fresh()->status);
    }

    public function test_confirm_payment_is_idempotent_for_gateway_retries(): void
    {
        $subscription = $this->subscription();

        $payment = SubscriptionPayment::create([
            'school_id'       => $subscription->school_id,
            'subscription_id' => $subscription->id,
            'amount'          => 500,
            'method'          => 'monime',
            'transaction_ref' => 'SUB-TEST-6',
            'status'          => 'pending',
        ]);

        $service = app(SubscriptionPaymentService::class);

        $this->assertTrue($service->confirmPayment($payment, 500.0));
        $this->assertTrue($service->confirmPayment($payment, 500.0), 'retry must still succeed');
        $this->assertSame('confirmed', $payment->fresh()->status);
    }

    public function test_confirm_payment_does_not_touch_an_already_failed_payment(): void
    {
        $subscription = $this->subscription();

        $payment = SubscriptionPayment::create([
            'school_id'       => $subscription->school_id,
            'subscription_id' => $subscription->id,
            'amount'          => 500,
            'method'          => 'monime',
            'transaction_ref' => 'SUB-TEST-7',
            'status'          => 'failed',
        ]);

        $this->assertFalse(app(SubscriptionPaymentService::class)->confirmPayment($payment, 500.0));
        $this->assertSame('failed', $payment->fresh()->status);
    }

    public function test_model_confirm_method_does_not_recurse(): void
    {
        $subscription = $this->subscription();

        $payment = SubscriptionPayment::create([
            'school_id'       => $subscription->school_id,
            'subscription_id' => $subscription->id,
            'amount'          => 500,
            'method'          => 'monime',
            'transaction_ref' => 'SUB-TEST-8',
            'status'          => 'pending',
        ]);

        // SubscriptionPayment::confirm() delegates to the service, which must
        // not call confirm() again.
        $this->assertTrue($payment->confirm());
        $this->assertSame('confirmed', $payment->fresh()->status);
    }
}