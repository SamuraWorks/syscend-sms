<?php

namespace Database\Seeders;

use App\Models\School;
use App\Models\Student;
use App\Models\TransportRoute;
use App\Models\Vehicle;
use Illuminate\Database\Seeder;

class TransportSeeder extends Seeder
{
    public function run(): void
    {
        $school = School::first();
        if (! $school) return;

        $sid = $school->id;

        $vehiclesData = [
            ['registration_no' => 'SL-FRE-GA-1234', 'name' => 'Bus 01', 'type' => 'bus',     'capacity' => 45, 'driver_name' => 'Ibrahim Kamara',  'driver_phone' => '077-1111111'],
            ['registration_no' => 'SL-FRE-GA-5678', 'name' => 'Bus 02', 'type' => 'bus',     'capacity' => 45, 'driver_name' => 'Abdul Conteh',    'driver_phone' => '077-2222222'],
            ['registration_no' => 'SL-FRE-GA-9012', 'name' => 'Mini 01','type' => 'minibus', 'capacity' => 20, 'driver_name' => 'Musa Bangura',    'driver_phone' => '077-3333333'],
        ];

        $vehicles = [];
        foreach ($vehiclesData as $vd) {
            $vehicles[] = Vehicle::firstOrCreate(
                ['school_id' => $sid, 'registration_no' => $vd['registration_no']],
                array_merge($vd, ['school_id' => $sid])
            );
        }

        $routesData = [
            [
                'name'        => 'Congo Cross Route',
                'start_point' => 'School Gate',
                'end_point'   => 'Congo Cross',
                'monthly_fee' => 50000,
                'vehicle_idx' => 0,
                'stops'       => [
                    ['name' => 'Congo Cross Junction', 'pickup_time' => '07:15'],
                    ['name' => 'Clock Tower',          'pickup_time' => '07:25'],
                    ['name' => 'Brookfields',          'pickup_time' => '07:35'],
                ],
            ],
            [
                'name'        => 'Hill Station Route',
                'start_point' => 'School Gate',
                'end_point'   => 'Hill Station',
                'monthly_fee' => 45000,
                'vehicle_idx' => 1,
                'stops'       => [
                    ['name' => 'Kingtom',          'pickup_time' => '07:20'],
                    ['name' => 'Malama Wharf',     'pickup_time' => '07:30'],
                    ['name' => 'Hill Station',     'pickup_time' => '07:40'],
                ],
            ],
            [
                'name'        => 'Wilberforce Route',
                'start_point' => 'School Gate',
                'end_point'   => 'Wilberforce',
                'monthly_fee' => 60000,
                'vehicle_idx' => 2,
                'stops'       => [
                    ['name' => 'Fifth Street',        'pickup_time' => '06:50'],
                    ['name' => 'Lumley Beach Road',   'pickup_time' => '07:00'],
                    ['name' => 'Aberdeen',            'pickup_time' => '07:10'],
                ],
            ],
        ];

        foreach ($routesData as $rd) {
            $vehicleId = $vehicles[$rd['vehicle_idx']]->id ?? null;
            $route = TransportRoute::firstOrCreate(
                ['school_id' => $sid, 'name' => $rd['name']],
                [
                    'school_id'   => $sid,
                    'vehicle_id'  => $vehicleId,
                    'start_point' => $rd['start_point'],
                    'end_point'   => $rd['end_point'],
                    'monthly_fee' => $rd['monthly_fee'],
                    'stops'       => $rd['stops'],
                ]
            );

            $students = Student::where('school_id', $sid)->inRandomOrder()->limit(5)->get();
            foreach ($students as $student) {
                try {
                    $route->students()->syncWithoutDetaching([
                        $student->id => ['stop' => $rd['stops'][0]['name'], 'fee_linked' => true],
                    ]);
                } catch (\Exception $e) {
                    // skip duplicates
                }
            }
        }
    }
}
