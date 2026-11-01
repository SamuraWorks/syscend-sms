<?php

namespace App\Services\AI\Prompts;

/**
 * Designs a scheme-of-work-aligned lesson plan for the Sierra Leone national
 * curriculum (Basic Education / JSS / SSS). Content is grounded in the exact
 * topic, grade level and subject supplied by the teacher.
 */
class LessonPlanPrompt extends Prompt
{
    public function system(): string
    {
        return <<<'EOT'
You are an experienced Sierra Leone curriculum support teacher. You design one
classroom-ready lesson plan using ONLY the subject, class, term and topic given.
Rules:
- Align objectives to the Sierra Leone National Curriculum for Basic Education
  where the subject matches; otherwise state curriculum alignment generically.
- Keep objectives measurable; class duration is respected exactly.
- Always include an assessment idea that works without extra materials.
- Never invent student numbers, resources the school lacks, or examination data.
- Output strictly valid JSON matching the requested schema. No preamble.
EOT;
    }

    public function build(array $c): string
    {
        $lines = [
            'Subject: ' . ($c['subject'] ?? '[subject]'),
            'Class / grade level: ' . ($c['class_level'] ?? '[class]'),
            'Academic term: ' . ($c['term'] ?? '[term]'),
            'Lesson duration (minutes): ' . ($c['duration_minutes'] ?? '40'),
            'Topic: ' . ($c['topic'] ?? '[topic]'),
            'Prior knowledge expected: ' . ($c['prior_knowledge'] ?? null),
            'Available materials: ' . ($this->list($c['materials'] ?? []) ?: 'none specified'),
            'Class size: ' . ($c['class_size'] ?? null),
            'Teacher notes: ' . ($c['notes'] ?? null),
        ];

        return trim(implode("\n", array_filter($lines, fn ($l) => ! str_ends_with((string) $l, ':'))));
    }

    public function schema(): array
    {
        return [
            'type' => 'object',
            'additionalProperties' => false,
            'properties' => [
                'title'             => ['type' => 'string'],
                'subject'           => ['type' => 'string'],
                'class_level'       => ['type' => 'string'],
                'duration_minutes'  => ['type' => 'integer'],
                'objectives'        => ['type' => 'array', 'items' => ['type' => 'string']],
                'materials'         => ['type' => 'array', 'items' => ['type' => 'string']],
                'introduction'      => ['type' => 'string'],
                'main_activities'   => [
                    'type' => 'array',
                    'items' => [
                        'type' => 'object',
                        'additionalProperties' => false,
                        'properties' => [
                            'step'        => ['type' => 'integer'],
                            'minutes'     => ['type' => 'integer'],
                            'detail'      => ['type' => 'string'],
                        ],
                    ],
                ],
                'assessment'        => ['type' => 'array', 'items' => ['type' => 'string']],
                'homework'          => ['type' => 'string'],
                'differentiation'   => ['type' => 'array', 'items' => ['type' => 'string']],
                'curriculum_alignment' => ['type' => 'string'],
            ],
        ];
    }

    public function schemaName(): string
    {
        return 'lesson_plan';
    }

    private function list(array $items): string
    {
        return implode('; ', array_slice(array_filter((array) $items), 0, 30));
    }
}