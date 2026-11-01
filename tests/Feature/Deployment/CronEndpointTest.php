<?php

namespace Tests\Feature\Deployment;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CronEndpointTest extends TestCase
{
    use RefreshDatabase;

    private const SECRET = 'unit-test-cron-secret';

    private function withSecret(): void
    {
        config(['services.cron.secret' => self::SECRET]);
    }

    private function hitCron(string $job, ?string $token = null): \Illuminate\Testing\TestResponse
    {
        $headers = $token === null ? [] : ['Authorization' => 'Bearer '.$token];

        return $this->getJson('/api/cron/'.$job, $headers);
    }

    public function test_cron_endpoint_rejects_requests_without_a_bearer_token(): void
    {
        $this->withSecret();

        $this->hitCron('migrate')->assertStatus(401);
    }

    public function test_cron_endpoint_rejects_a_wrong_bearer_token(): void
    {
        $this->withSecret();

        $this->hitCron('migrate', 'wrong-secret')->assertStatus(401);
    }

    public function test_cron_endpoint_fails_closed_when_no_secret_is_configured(): void
    {
        config(['services.cron.secret' => '']);

        $this->hitCron('migrate', self::SECRET)->assertStatus(401);
        $this->hitCron('expire-subscriptions')->assertStatus(401);
    }

    public function test_cron_endpoint_rejects_jobs_outside_the_allowlist(): void
    {
        $this->withSecret();

        $this->hitCron('rm-rf', self::SECRET)
            ->assertStatus(404)
            ->assertJsonPath('status', 'unknown_job');
    }

    public function test_cron_endpoint_runs_a_scheduled_command(): void
    {
        $this->withSecret();

        $this->hitCron('expire-subscriptions', self::SECRET)
            ->assertStatus(200)
            ->assertJsonPath('status', 'ok')
            ->assertJsonPath('exit_code', 0)
            ->assertJsonPath('command', 'subscriptions:expire');
    }
}
