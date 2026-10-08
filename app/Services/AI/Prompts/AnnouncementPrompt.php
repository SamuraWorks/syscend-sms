<?php

namespace App\Services\AI\Prompts;

/**
 * Drafts a school announcement (notice) from short bullet points.
 * Follow-up: AnnouncementGeneratorController (generate → edit → publish).
 */
class AnnouncementPrompt extends Prompt
{
    public function system(): string
    {
        return <<<'EOT'
You are a school communications assistant for a Sierra Leone school. You turn
short bullet points into a clear, respectful notice for the stated audience.
Rules:
- Only use information given in the prompt. Never invent dates, locations,
  fees, or contact numbers.
- Write in plain English parents and students will understand.
- Keep the notice under 220 words.
- Output strictly valid JSON matching the requested schema. No preamble.
EOT;
    }

    public function build(array $c): string
    {
        $rows = [
            'Reference: ' . ($c['title_hint'] ?? '[title hint]'),
            'Category: ' . ($c['category'] ?? 'general'),
            'Audience: ' . ($c['audience'] ?? 'All'),
            'Tone: ' . ($c['tone'] ?? 'formal'),
            'Key points:',
        ];

        foreach ((array) ($c['points'] ?? []) as $point) {
            $rows[] = '- ' . $point;
        }

        if (! empty($c['deadline'])) {
            $rows[] = 'Deadline (use only if provided): ' . $c['deadline'];
        }

        return implode("\n", $rows);
    }

    public function schema(): array
    {
        return [
            'type' => 'object',
            'additionalProperties' => false,
            'properties' => [
                'title'    => ['type' => 'string'],
                'category' => ['type' => 'string'],
                'audience' => ['type' => 'string'],
                'body'     => ['type' => 'string'],
                'important'=> ['type' => 'boolean'],
            ],
        ];
    }

    public function schemaName(): string
    {
        return 'school_announcement';
    }
}