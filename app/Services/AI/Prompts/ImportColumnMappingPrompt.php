<?php

namespace App\Services\AI\Prompts;

/**
 * Suggests how the columns of an uploaded spreadsheet map to the target fields
 * of a bulk-import type. The result is advisory only — an admin reviews and
 * confirms the mapping before anything is imported, so the model is never
 * trusted to invent fields or values.
 */
class ImportColumnMappingPrompt extends Prompt
{
    public function system(): string
    {
        return <<<'EOT'
You map spreadsheet columns to a fixed set of target fields for a school data
import. You are given the exact target fields (with descriptions and examples),
the uploaded column headers, and a few sample rows. Rules:
- Return EXACTLY one mapping entry per uploaded column, in the same order.
- `target_field` MUST be one of the provided target field names, spelled
  exactly. If a column does not clearly correspond to any target field, use an
  empty string "" — never invent or guess a field name.
- Never map two columns to the same target field unless they are genuinely
  duplicates; prefer the best single match and mark the other as "".
- Use the sample values to disambiguate (e.g. values like "male"/"female" are
  gender; "JSS 1" is class_name).
- `confidence` is a number from 0 to 1. `reason` is one short sentence.
- Output strictly valid JSON matching the requested schema. No commentary.
EOT;
    }

    public function build(array $c): string
    {
        $type    = (string) ($c['import_type'] ?? 'records');
        $fields  = (array) ($c['target_fields'] ?? []);
        $columns = (array) ($c['columns'] ?? []);
        $rows    = (array) ($c['sample_rows'] ?? []);

        $fieldLines = [];
        foreach ($fields as $field) {
            $fieldLines[] = sprintf(
                '- %s%s — %s (example: %s)',
                $field['name'] ?? '',
                ! empty($field['required']) ? ' [REQUIRED]' : '',
                $field['description'] ?? '',
                ($field['example'] ?? '') !== '' ? $field['example'] : 'n/a'
            );
        }

        $columnLines = [];
        foreach ($columns as $column) {
            $columnLines[] = '- ' . $column;
        }

        $sampleText = '';
        foreach (array_slice($rows, 0, 5) as $index => $row) {
            $pairs = [];
            foreach ((array) $row as $key => $value) {
                $value = trim((string) $value);
                if ($value !== '') {
                    $pairs[] = "{$key}=\"{$value}\"";
                }
            }
            $sampleText .= 'Row ' . ($index + 1) . ': ' . implode(', ', $pairs) . "\n";
        }

        return "Map the uploaded spreadsheet columns for a {$type} import.\n\n"
            . "TARGET FIELDS:\n" . (implode("\n", $fieldLines) ?: '(none)') . "\n\n"
            . "UPLOADED COLUMNS:\n" . (implode("\n", $columnLines) ?: '(none)') . "\n\n"
            . "SAMPLE DATA:\n" . ($sampleText !== '' ? $sampleText : "(no sample rows)\n") . "\n"
            . 'Return one mapping entry per uploaded column, in order. Use "" for target_field when a column matches no target field. Never invent target field names.';
    }

    public function schema(): array
    {
        return [
            'type' => 'object',
            'additionalProperties' => false,
            'properties' => [
                'mappings' => [
                    'type' => 'array',
                    'items' => [
                        'type' => 'object',
                        'additionalProperties' => false,
                        'properties' => [
                            'source_column' => ['type' => 'string'],
                            'target_field'   => ['type' => 'string'],
                            'confidence'     => ['type' => 'number'],
                            'reason'         => ['type' => 'string'],
                        ],
                        'required' => ['source_column', 'target_field', 'confidence', 'reason'],
                    ],
                ],
                'summary' => ['type' => 'string'],
            ],
            'required' => ['mappings', 'summary'],
        ];
    }

    public function schemaName(): string
    {
        return 'import_column_mapping';
    }
}
