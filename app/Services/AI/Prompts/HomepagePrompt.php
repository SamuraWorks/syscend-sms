<?php

namespace App\Services\AI\Prompts;

/**
 * Drafts the marketing content for a school's public homepage.
 * Phase 2 consumer: SchoolHomepageGeneratorController (generate → preview →
 * edit → approve → publish). Nothing is persisted automatically.
 */
class HomepagePrompt extends Prompt
{
    public function system(): string
    {
        return <<<'EOT'
You are a professional copywriter for Sierra Leone schools. You write warm,
plain-English website copy using ONLY the school facts provided. Rules:
- Never invent facts (class sizes, fees, accreditation, results, staff count).
  If a fact is missing, write a short placeholder wrapped in [square brackets]
  e.g. "[State passing rate here]".
- Keep tone respectful and motivating; suitable for parents and guardians.
- Sierra Leone education terms are fine (Basic Education, JSS, SSS, BECE,
  WASSCE, pre-primary). Do not reference generalist international systems.
- Output strictly valid JSON matching the requested schema. No commentary.
EOT;
    }

    public function build(array $c): string
    {
        $school = $c['school'] ?? null;
        $levels = [];

        if (is_object($school) && method_exists($school, 'levelLabels')) {
            $levels = $school->levelLabels();
        } elseif (! empty($c['level_labels'])) {
            $levels = $c['level_labels'];
        }

        $levels = implode(', ', array_values(array_filter($levels)));

        $rows = [
            'School name: ' . ($c['school']['name'] ?? '[school name]'),
            'Short name / initials: ' . ($c['school']['short_name'] ?? 'N/A'),
            'Motto: ' . ($c['school']['motto'] ?? '[motto]'),
            'Tagline: ' . ($c['school']['tagline'] ?? '[tagline]'),
            'Established: ' . ($c['school']['year_established'] ?? '[year established]'),
            'Levels offered: ' . ($levels ?: ($c['school']['school_level'] ?? '[levels]')),
            'About statement: ' . ($c['school']['about_school'] ?? '[about statement]'),
            'Mission: ' . ($c['school']['mission'] ?? '[mission]'),
            'Vision: ' . ($c['school']['vision'] ?? '[vision]'),
            'Location: ' . trim(implode(', ', array_filter([
                $c['school']['city'] ?? '', $c['school']['state'] ?? '', $c['school']['country'] ?? '',
            ])) ?: '[location]'),
            'Phone: ' . ($c['school']['phone'] ?? '[phone]'),
            'Email: ' . ($c['school']['email'] ?? '[email]'),
            'Address: ' . ($c['school']['address'] ?? '[address]'),
            'Website: ' . ($c['school']['website'] ?? '[website]'),
            'Departments / programmes: ' . ($this->list($c['departments'] ?? []) ?: '[departments]'),
            'Subjects offered: ' . ($this->list($c['subjects'] ?? []) ?: '[subjects]'),
        ];

        return "Write a complete school homepage in the required JSON schema.\n\nSCHOOL FACTS:\n- " . implode("\n- ", $rows);
    }

    public function schema(): array
    {
        return [
            'type' => 'object',
            'additionalProperties' => false,
            'properties' => [
                'hero' => [
                    'type' => 'object',
                    'additionalProperties' => false,
                    'properties' => [
                        'headline' => ['type' => 'string'],
                        'tagline'  => ['type' => 'string'],
                        'cta_label'=> ['type' => 'string'],
                        'cta_url'  => ['type' => 'string'],
                    ],
                ],
                'about' => [
                    'type' => 'object',
                    'additionalProperties' => false,
                    'properties' => [
                        'heading'    => ['type' => 'string'],
                        'summary'    => ['type' => 'string'],
                        'highlights' => ['type' => 'array', 'items' => ['type' => 'string']],
                    ],
                ],
                'academics' => [
                    'type' => 'object',
                    'additionalProperties' => false,
                    'properties' => [
                        'heading'     => ['type' => 'string'],
                        'description' => ['type' => 'string'],
                        'levels'      => ['type' => 'array', 'items' => ['type' => 'string']],
                        'programs'    => ['type' => 'array', 'items' => ['type' => 'string']],
                    ],
                ],
                'why_choose_us' => [
                    'type' => 'object',
                    'additionalProperties' => false,
                    'properties' => [
                        'heading' => ['type' => 'string'],
                        'points'  => ['type' => 'array', 'items' => ['type' => 'string']],
                    ],
                ],
                'school_life' => [
                    'type' => 'object',
                    'additionalProperties' => false,
                    'properties' => [
                        'heading'     => ['type' => 'string'],
                        'description' => ['type' => 'string'],
                        'activities'  => ['type' => 'array', 'items' => ['type' => 'string']],
                    ],
                ],
                'contact' => [
                    'type' => 'object',
                    'additionalProperties' => false,
                    'properties' => [
                        'heading' => ['type' => 'string'],
                        'phone'   => ['type' => 'string'],
                        'email'   => ['type' => 'string'],
                        'address' => ['type' => 'string'],
                        'hours'   => ['type' => 'string'],
                    ],
                ],
                'seo' => [
                    'type' => 'object',
                    'additionalProperties' => false,
                    'properties' => [
                        'meta_title'       => ['type' => 'string'],
                        'meta_description' => ['type' => 'string'],
                    ],
                ],
            ],
        ];
    }

    public function schemaName(): string
    {
        return 'school_homepage';
    }

    private function list(array $items): string
    {
        return implode('; ', array_slice(array_filter((array) $items), 0, 40));
    }
}