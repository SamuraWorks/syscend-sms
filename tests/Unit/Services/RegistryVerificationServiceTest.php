<?php

namespace Tests\Unit\Services;

use App\Models\{School, Staff, Student, User};
use App\Services\RegistryVerificationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RegistryVerificationServiceTest extends TestCase
{
    use RefreshDatabase;

    private function makeSchool(): School
    {
        return School::create([
            'name'           => 'Test School',
            'slug'           => 'test-school-' . uniqid(),
            'email'          => 'admin@test.com',
            'phone'          => '+1234567890',
            'address'        => '123 Test St',
            'city'           => 'Test City',
            'country'        => 'US',
            'plan'           => 'standard',
            'max_students'   => 500,
            'max_teachers'   => 50,
            'timezone'       => 'UTC',
            'date_format'    => 'Y-m-d',
            'currency'       => 'USD',
            'currency_symbol'=> '$',
            'working_days'   => 'monday,tuesday,wednesday,thursday,friday',
            'school_opening_time' => '08:00',
            'school_closing_time' => '15:00',
            'clock_format'   => '24h',
            'is_configured'  => false,
        ]);
    }

    public function test_normalize_name_lowercases_and_trims(): void
    {
        $service = new RegistryVerificationService(1);
        $reflection = new \ReflectionMethod($service, 'normalizeName');
        $this->assertEquals('john kamara', $reflection->invoke($service, '  John Kamara  '));
        $this->assertEquals('', $reflection->invoke($service, ''));
        $this->assertEquals('', $reflection->invoke($service, '   '));
    }

    public function test_emails_match_with_identical_emails(): void
    {
        $service = new RegistryVerificationService(1);
        $reflection = new \ReflectionMethod($service, 'emailsMatch');
        $this->assertTrue($reflection->invoke($service, 'test@school.com', 'test@school.com'));
        $this->assertTrue($reflection->invoke($service, 'TEST@School.COM', 'test@school.com'));
        $this->assertFalse($reflection->invoke($service, 'test@school.com', 'other@school.com'));
        $this->assertFalse($reflection->invoke($service, '', 'test@school.com'));
        $this->assertFalse($reflection->invoke($service, '', ''));
    }

    public function test_names_match_with_similar_names(): void
    {
        $service = new RegistryVerificationService(1);
        $reflection = new \ReflectionMethod($service, 'namesMatch');
        $this->assertTrue($reflection->invoke($service, 'John Kamara', 'John Kamara'));
        $this->assertTrue($reflection->invoke($service, '  john  kamara  ', 'John Kamara'));
        $this->assertTrue($reflection->invoke($service, 'JOHN KAMARA', 'John Kamara'));
        $this->assertFalse($reflection->invoke($service, 'John Smith', 'John Kamara'));
    }
}
