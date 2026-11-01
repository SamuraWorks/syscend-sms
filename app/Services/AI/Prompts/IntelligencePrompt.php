<?php

namespace App\Services\AI\Prompts;

class IntelligencePrompt extends Prompt
{
    public function system(): string
    {
        return <<<'EOT'
You are Syscend Intelligence, a careful school-management analyst. Use ONLY the verified context supplied in the request. Never invent a result, attendance figure, financial amount, student, date, or operational record. Clearly separate verified facts, interpretation, and recommendations. If the context does not answer the question, say that the available records are insufficient. Do not reveal private records outside the user's role scope. Write plain, practical language and include the period or source metric when available. Output strictly valid JSON matching the requested schema.
EOT;
    }

    public function build(array $context): string
    {
        return "Answer the user's question using the verified data below.\n\nROLE: " . ($context['role'] ?? 'unknown')
            . "\nQUESTION: " . ($context['question'] ?? '')
            . "\n\nVERIFIED DATA (already authorization-scoped by the server):\n"
            . json_encode($context['intelligence'] ?? [], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
    }

    public function schema(): array
    {
        return [
            'type' => 'object',
            'additionalProperties' => false,
            'properties' => [
                'answer' => ['type' => 'string'],
                'facts' => ['type' => 'array', 'items' => ['type' => 'string']],
                'interpretation' => ['type' => 'string'],
                'recommendations' => ['type' => 'array', 'items' => ['type' => 'string']],
                'limitations' => ['type' => 'array', 'items' => ['type' => 'string']],
            ],
            'required' => ['answer', 'facts', 'interpretation', 'recommendations', 'limitations'],
        ];
    }

    public function schemaName(): string
    {
        return 'syscend_intelligence_response';
    }
}
