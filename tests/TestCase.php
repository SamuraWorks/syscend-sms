<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    use CreatesApplication;

    protected function setUp(): void
    {
        parent::setUp();

        // Web Push must never reach a real push service during tests.
        config()->set('services.webpush.vapid', [
            'subject'     => 'mailto:tests@example.com',
            'public_key'  => null,
            'private_key' => null,
        ]);
    }
}
