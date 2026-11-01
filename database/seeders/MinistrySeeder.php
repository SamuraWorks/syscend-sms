<?php

namespace Database\Seeders;

use App\Models\District;
use Illuminate\Database\Seeder;

class MinistrySeeder extends Seeder
{
    public function run(): void
    {
        $districts = [
            ['name' => 'Western Area Urban',    'code' => 'WAU', 'province' => 'Western Area'],
            ['name' => 'Western Area Rural',    'code' => 'WAR', 'province' => 'Western Area'],
            ['name' => 'Bombali',               'code' => 'BOM', 'province' => 'Northern Province'],
            ['name' => 'Port Loko',             'code' => 'PLK', 'province' => 'Northern Province'],
            ['name' => 'Kambia',                'code' => 'KAM', 'province' => 'Northern Province'],
            ['name' => 'Tonkolili',             'code' => 'TON', 'province' => 'Northern Province'],
            ['name' => 'Koinadugu',             'code' => 'KOI', 'province' => 'Northern Province'],
            ['name' => 'Karene',                'code' => 'KAR', 'province' => 'Northern Province'],
            ['name' => 'Bo',                    'code' => 'BO',  'province' => 'Southern Province'],
            ['name' => 'Bonthe',                'code' => 'BON', 'province' => 'Southern Province'],
            ['name' => 'Moyamba',               'code' => 'MOY', 'province' => 'Southern Province'],
            ['name' => 'Pujehun',               'code' => 'PUJ', 'province' => 'Southern Province'],
            ['name' => 'Kenema',                'code' => 'KEN', 'province' => 'Eastern Province'],
            ['name' => 'Kono',                  'code' => 'KON', 'province' => 'Eastern Province'],
            ['name' => 'Kailahun',              'code' => 'KAI', 'province' => 'Eastern Province'],
        ];

        foreach ($districts as $data) {
            District::firstOrCreate(['code' => $data['code']], $data);
        }

        $this->command->info('15 districts of Sierra Leone seeded.');
    }
}
