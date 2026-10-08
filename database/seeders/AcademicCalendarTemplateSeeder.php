<?php

namespace Database\Seeders;

use App\Models\AcademicCalendarTemplate;
use Illuminate\Database\Seeder;

class AcademicCalendarTemplateSeeder extends Seeder
{
    public function run(): void
    {
        $template = AcademicCalendarTemplate::firstOrCreate(
            ['name' => 'Sierra Leone National Calendar', 'zone' => 'national'],
            [
                'country'          => 'SL',
                'year_start_month' => 9,
                'year_start_day'   => 1,
                'year_end_month'   => 7,
                'year_end_day'     => 31,
                'is_active'        => true,
                'sort_order'       => 1,
            ]
        );

        $terms = [
            ['name' => 'First Term',  'term_number' => 1, 'start_month' => 9,  'start_day' => 8,  'end_month' => 12, 'end_day' => 15, 'sort_order' => 1],
            ['name' => 'Second Term', 'term_number' => 2, 'start_month' => 1,  'start_day' => 6,  'end_month' => 3,  'end_day' => 31, 'sort_order' => 2],
            ['name' => 'Third Term',  'term_number' => 3, 'start_month' => 4,  'start_day' => 14, 'end_month' => 7,  'end_day' => 10, 'sort_order' => 3],
        ];

        foreach ($terms as $term) {
            $template->terms()->updateOrCreate(
                ['term_number' => $term['term_number']],
                collect($term)->except('term_number')->toArray()
            );
        }
    }
}