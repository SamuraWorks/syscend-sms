<?php

namespace Database\Seeders;

use App\Models\CurriculumSubject;
use App\Support\SierraLeoneEducation;
use Illuminate\Database\Seeder;

class CurriculumSeeder extends Seeder
{
    /**
     * Seed the national curriculum catalogue used by the onboarding wizard's
     * Subjects step. Data mirrors the Sierra Leone education reference in
     * App\Support\SierraLeoneEducation and the existing demo/setup seeders —
     * nothing is invented here.
     */
    public function run(): void
    {
        $map = [
            'nursery'            => $this->asCatalogue('nursery', null, SierraLeoneEducation::CORE_SUBJECTS['early_childhood']),
            'primary'            => $this->asCatalogue('primary', null, SierraLeoneEducation::CORE_SUBJECTS['primary']),
            'junior_secondary'   => $this->asCatalogue('junior_secondary', null, SierraLeoneEducation::CORE_SUBJECTS['junior_secondary']),
            'senior_secondary'   => $this->asCatalogue('senior_secondary', 'core', SierraLeoneEducation::CORE_SUBJECTS['senior_secondary']),
            'senior_secondary_science'    => $this->asCatalogue('senior_secondary', 'science', ['Physics', 'Chemistry', 'Biology', 'Agric Science']),
            'senior_secondary_arts'       => $this->asCatalogue('senior_secondary', 'arts', ['Literature in English', 'Government', 'History', 'Geography']),
            'senior_secondary_commercial' => $this->asCatalogue('senior_secondary', 'commercial', ['Principles of Accounting', 'Business Studies', 'Economics', 'Commerce']),
        ];

        foreach ($map as $rows) {
            foreach ($rows as $row) {
                CurriculumSubject::firstOrCreate(
                    ['school_level' => $row['school_level'], 'section_group' => $row['section_group'], 'name' => $row['name']],
                    ['code' => $row['code'], 'is_core' => $row['is_core'], 'sort_order' => $row['sort_order']]
                );
            }
        }
    }

    private function asCatalogue(string $level, ?string $group, array $names): array
    {
        $rows = [];
        foreach (array_values($names) as $i => $name) {
            $rows[] = [
                'school_level'  => $level,
                'section_group' => $group,
                'name'          => $name,
                'code'          => $this->codeFor($level, $name),
                'is_core'       => $this->isCore($level, $group, $name),
                'sort_order'    => $i + 1,
            ];
        }

        return $rows;
    }

    private function isCore(string $level, ?string $group, string $name): bool
    {
        if ($level === 'senior_secondary') {
            return $group === 'core';
        }

        return in_array($name, SierraLeoneEducation::CORE_SUBJECTS[$level] ?? [], true);
    }

    private function codeFor(string $level, string $name): string
    {
        $codes = [
            'English Language'      => 'ENG',
            'Mathematics'           => 'MATH',
            'Science'               => 'SCI',
            'Social Studies'        => 'SST',
            'Agric Science'         => 'AGRI',
            'Religious Studies'     => 'RS',
            'Home Economics'        => 'HE',
            'Physical Education'    => 'PE',
            'Creative Activities'   => 'CA',
            'Literacy'              => 'LIT',
            'Numeracy'              => 'NUM',
            'French'                => 'FRE',
            'Computer Studies'      => 'ICT',
            'Physics'               => 'PHY',
            'Chemistry'             => 'CHEM',
            'Biology'               => 'BIO',
            'Literature in English' => 'LIT',
            'Government'            => 'GOV',
            'History'               => 'HIS',
            'Geography'             => 'GEO',
            'Principles of Accounting' => 'ACC',
            'Business Studies'      => 'BUS',
            'Economics'             => 'ECO',
            'Commerce'              => 'COM',
        ];

        return $codes[$name] ?? strtoupper(substr(preg_replace('/[^A-Za-z0-9]+/', '', $name), 0, 5));
    }
}