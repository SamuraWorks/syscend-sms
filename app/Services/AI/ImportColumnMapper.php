<?php

namespace App\Services\AI;

use App\Models\ImportJob;
use App\Models\School;
use App\Models\User;
use App\Support\Imports\ImportTemplateRegistry;
use App\Support\StoredFile;
use PhpOffice\PhpSpreadsheet\IOFactory;
use RuntimeException;

/**
 * Reads an uploaded import spreadsheet and asks the AI to suggest how its
 * columns map onto the target fields for that import type.
 *
 * The suggestion is persisted on the job (import_options.column_mapping) for an
 * admin to review; this service never imports rows and never trusts a
 * hallucinated target field — anything not in the registry is dropped.
 */
class ImportColumnMapper
{
    private const SAMPLE_ROW_LIMIT = 5;
    private const HEADER_SCAN_LIMIT = 10;

    public function __construct(
        protected AIService $ai,
    ) {
    }

    /**
     * @return array<string, mixed>
     *
     * @throws AIUnavailableException
     */
    public function analyze(ImportJob $job, User $user, School $school): array
    {
        $type = (string) $job->import_type;

        if (! ImportTemplateRegistry::supports($type)) {
            throw new AIUnavailableException("Unknown import type [{$type}].", 'misconfigured');
        }

        $fields = ImportTemplateRegistry::fields($type);
        $sheet  = $this->readSheet($job);

        $context = [
            'school'        => ['name' => $school->name],
            'import_type'   => $type,
            'target_fields' => $fields,
            'columns'       => $sheet['columns'],
            'sample_rows'   => $sheet['sample_rows'],
        ];

        $result = $this->ai->generate(
            $school,
            $user,
            AIPermissionService::FEATURE_IMPORT_COLUMN_MAPPING,
            $context
        );

        $payload = $this->normalize(
            is_array($result['content'] ?? null) ? $result['content'] : [],
            $type,
            $fields,
            $sheet['columns']
        );

        $payload['meta'] = [
            'model'               => $result['meta']['model'] ?? null,
            'generated_at'        => $result['generated_at'] ?? null,
            'truncated'           => (bool) ($result['truncated'] ?? false),
            'detected_header_row' => $sheet['header_row'],
        ];

        $job->update([
            'import_options' => array_merge((array) $job->import_options, [
                'column_mapping' => $payload,
            ]),
        ]);

        return $payload;
    }

    /**
     * Extract the header row + a few sample rows from the stored spreadsheet.
     *
     * @return array{columns: array<int, string>, sample_rows: array<int, array<string, string>>, header_row: int}
     */
    private function readSheet(ImportJob $job): array
    {
        $filePath = StoredFile::localPath($job->file_path, 'private');

        if (! file_exists($filePath)) {
            throw new RuntimeException("Import file not found: {$job->file_name}");
        }

        $grid = IOFactory::load($filePath)
            ->getActiveSheet()
            ->toArray(null, true, true, false);

        $grid = array_values(array_filter($grid, fn ($row) => is_array($row)));

        if ($grid === []) {
            throw new RuntimeException('Import file contains no readable rows.');
        }

        $headerRow = $this->detectHeaderRow($grid);
        $header    = $this->normalizeHeader(array_values($grid[$headerRow] ?? []));

        if (count($header) < 1) {
            throw new RuntimeException('Import file contains no header row.');
        }

        $columns = $this->nameColumns($header);

        $samples = [];
        $width   = count($columns);

        for ($i = $headerRow + 1; $i < count($grid) && count($samples) < self::SAMPLE_ROW_LIMIT; $i++) {
            $cells = array_slice(array_pad(array_values($grid[$i]), $width, ''), 0, $width);

            if (array_filter($cells, fn ($value) => trim((string) $value) !== '') === []) {
                continue;
            }

            $samples[] = array_combine($columns, array_map(fn ($value) => trim((string) $value), $cells));
        }

        return [
            'columns'     => $columns,
            'sample_rows' => $samples,
            'header_row'  => $headerRow,
        ];
    }

    /**
     * Pick the most likely header row from the first few rows. Header rows are
     * mostly non-numeric text; title/note rows (e.g. the template banner) tend
     * to have one populated cell and are ignored.
     */
    private function detectHeaderRow(array $grid): int
    {
        $limit = min(count($grid), self::HEADER_SCAN_LIMIT);
        $best  = 0;
        $bestScore = -1;

        for ($i = 0; $i < $limit; $i++) {
            $nonEmpty = 0;
            $text     = 0;

            foreach (array_values($grid[$i]) as $cell) {
                $value = trim((string) $cell);
                if ($value === '') {
                    continue;
                }
                $nonEmpty++;
                if (! is_numeric($value)) {
                    $text++;
                }
            }

            if ($nonEmpty < 2 || $text < $nonEmpty) {
                continue;
            }

            if ($text > $bestScore) {
                $bestScore = $text;
                $best      = $i;
            }
        }

        return $best;
    }

    /**
     * @param array<int, mixed> $cells
     * @return array<int, string>
     */
    private function normalizeHeader(array $cells): array
    {
        while ($cells !== [] && trim((string) end($cells)) === '') {
            array_pop($cells);
        }

        return array_map(fn ($cell) => trim((string) $cell), $cells);
    }

    /**
     * Give every column a stable, unique, human-readable name.
     *
     * @param array<int, string> $header
     * @return array<int, string>
     */
    private function nameColumns(array $header): array
    {
        $columns = [];
        $seen    = [];

        foreach ($header as $index => $name) {
            $name = $name !== '' ? $name : 'Column ' . ($index + 1);

            $base = $name;
            $suffix = 2;
            while (in_array(mb_strtolower($name), $seen, true)) {
                $name = $base . ' (' . $suffix++ . ')';
            }

            $seen[]    = mb_strtolower($name);
            $columns[] = $name;
        }

        return $columns;
    }

    /**
     * Validate the model output against the registry: drop hallucinated fields,
     * clamp confidences, and account for every column exactly once.
     *
     * @param array<string, mixed> $content
     * @param array<int, array<string, mixed>> $fields
     * @param array<int, string> $columns
     * @return array<string, mixed>
     */
    private function normalize(array $content, string $type, array $fields, array $columns): array
    {
        $allowed = [];
        $required = [];

        foreach ($fields as $field) {
            $name = (string) ($field['name'] ?? '');
            if ($name === '') {
                continue;
            }
            $allowed[mb_strtolower($name)] = $name;
            if (! empty($field['required'])) {
                $required[] = $name;
            }
        }

        $columnLookup = [];
        foreach ($columns as $column) {
            $columnLookup[mb_strtolower($column)] = $column;
        }

        $mappings = [];
        $claimed  = [];

        foreach ((array) ($content['mappings'] ?? []) as $entry) {
            if (! is_array($entry)) {
                continue;
            }

            $source = trim((string) ($entry['source_column'] ?? ''));
            $key    = mb_strtolower($source);

            if ($source === '' || ! isset($columnLookup[$key]) || isset($claimed[$key])) {
                continue;
            }

            $claimed[$key] = true;
            $source = $columnLookup[$key];

            $targetRaw = trim((string) ($entry['target_field'] ?? ''));
            $target    = $targetRaw !== '' ? ($allowed[mb_strtolower($targetRaw)] ?? null) : null;

            $confidence = is_numeric($entry['confidence'] ?? null) ? (float) $entry['confidence'] : 0.5;
            $confidence = max(0.0, min(1.0, $confidence));

            $mappings[] = [
                'source_column' => $source,
                'target_field'  => $target,
                'confidence'    => round($confidence, 2),
                'reason'        => trim((string) ($entry['reason'] ?? '')),
            ];
        }

        foreach ($columns as $column) {
            if (isset($claimed[mb_strtolower($column)])) {
                continue;
            }

            $mappings[] = [
                'source_column' => $column,
                'target_field'  => null,
                'confidence'    => 0.0,
                'reason'        => 'Not matched automatically.',
            ];
        }

        $mappedTargets = array_filter(array_column($mappings, 'target_field'));
        $missing = array_values(array_filter(
            $required,
            fn (string $field) => ! in_array($field, $mappedTargets, true)
        ));

        $unmatched = array_values(array_map(
            fn (array $mapping) => $mapping['source_column'],
            array_filter($mappings, fn (array $mapping) => $mapping['target_field'] === null)
        ));

        $summary = trim((string) ($content['summary'] ?? ''));

        if ($summary === '') {
            $summary = 'AI suggested a mapping for ' . count($mappings) . ' column(s). '
                . count($unmatched) . ' column(s) could not be matched automatically.';
        }

        return [
            'import_type'           => $type,
            'columns'               => $columns,
            'mappings'              => $mappings,
            'unmatched_columns'     => $unmatched,
            'missing_required_fields' => $missing,
            'summary'               => $summary,
        ];
    }
}
