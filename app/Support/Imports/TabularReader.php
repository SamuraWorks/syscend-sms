<?php

namespace App\Support\Imports;

use Illuminate\Support\Str;
use PhpOffice\PhpSpreadsheet\IOFactory;
use RuntimeException;

/**
 * Reads an uploaded import file (CSV or spreadsheet) into header-keyed rows.
 *
 * The official downloadable templates place a banner row above the column
 * headers and keep an Instructions sheet alongside the data, whereas plain CSV
 * exports put the headers on the first row. This reader detects the real header
 * row (and the most relevant sheet) so both layouts parse identically.
 */
class TabularReader
{
    private const HEADER_SCAN_LIMIT = 15;

    private const SKIP_SHEET_KEYWORDS = ['instruction'];

    /**
     * @param  array<int, string>  $expected  canonical header names, used to locate the header row
     * @param  array<string, string>  $aliases  slugged source header => canonical header name
     * @return array{headers: array<int, string>, rows: array<int, array<string, mixed>>, header_row: int, sheet: string}
     */
    public static function read(string $filePath, array $expected = [], array $aliases = []): array
    {
        if (! is_file($filePath)) {
            throw new RuntimeException('Import file not found.');
        }

        $expectedSet = array_flip($expected);
        [$matrices, $names] = self::matrices($filePath);

        $best = null;

        foreach ($matrices as $index => $matrix) {
            if (self::isInstructionSheet($names[$index] ?? '')) {
                continue;
            }

            if ($matrix === []) {
                continue;
            }

            $headerRow = self::detectHeaderRow($matrix, $expected, $aliases);
            [$match, $text] = self::rowScore($matrix[$headerRow] ?? [], $expectedSet, $aliases);
            $score = $expectedSet !== [] ? ($match * 100 + $text) : $text;

            if ($best === null || $score > $best['score']) {
                $best = [
                    'matrix'    => $matrix,
                    'headerRow' => $headerRow,
                    'sheet'     => $names[$index] ?? '',
                    'score'     => $score,
                ];
            }
        }

        if ($best === null) {
            throw new RuntimeException('Import file contains no readable rows.');
        }

        $headers = array_slice(self::mapHeaders($best['matrix'][$best['headerRow']] ?? [], $aliases), 0);

        while ($headers !== [] && end($headers) === '') {
            array_pop($headers);
        }

        if ($headers === []) {
            throw new RuntimeException('Import file contains no header row.');
        }

        $rows = self::dataRows($best['matrix'], $best['headerRow'], $headers, $best['sheet']);

        if ($rows === []) {
            throw new RuntimeException('Import file contains no data rows.');
        }

        return [
            'headers'    => $headers,
            'rows'       => $rows,
            'header_row' => $best['headerRow'] + 1,
            'sheet'      => $best['sheet'],
        ];
    }

    private static function isInstructionSheet(string $name): bool
    {
        $lower = Str::lower($name);

        foreach (self::SKIP_SHEET_KEYWORDS as $keyword) {
            if (str_contains($lower, $keyword)) {
                return true;
            }
        }

        return false;
    }

    /**
     * @param  array<int, array<int, mixed>>  $matrix
     * @param  array<int, string>  $expected
     * @param  array<string, string>  $aliases
     */
    private static function detectHeaderRow(array $matrix, array $expected, array $aliases): int
    {
        $expectedSet = array_flip($expected);

        $best = self::scanForHeader($matrix, $expectedSet, $aliases);

        if ($best === null && $expectedSet !== []) {
            $best = self::scanForHeader($matrix, [], $aliases);
        }

        return $best ?? 0;
    }

    private static function scanForHeader(array $matrix, array $expectedSet, array $aliases): ?int
    {
        $limit = min(count($matrix), self::HEADER_SCAN_LIMIT);
        $bestIndex = null;
        $bestScore = -1;

        for ($i = 0; $i < $limit; $i++) {
            [$match, $text] = self::rowScore($matrix[$i] ?? [], $expectedSet, $aliases);

            if ($text < 2) {
                continue;
            }

            if ($expectedSet !== [] && $match === 0) {
                continue;
            }

            $score = $expectedSet !== [] ? ($match * 100 + $text) : $text;

            if ($score > $bestScore) {
                $bestScore = $score;
                $best = $i;
            }
        }

        return $best ?? null;
    }

    /**
     * @param  array<int, mixed>  $cells
     * @param  array<string, int>  $expectedSet
     * @param  array<string, string>  $aliases
     * @return array{0: int, 1: int}  [matched headers, non-empty text cells]
     */
    private static function rowScore(array $cells, array $expectedSet, array $aliases): array
    {
        $match = 0;
        $text = 0;

        foreach ($cells as $cell) {
            $value = self::valueToString($cell);

            if ($value === '') {
                continue;
            }

            if (! is_numeric($value)) {
                $text++;
            }

            if ($expectedSet !== [] && isset($expectedSet[self::resolveHeader($value, $aliases)])) {
                $match++;
            }
        }

        return [$match, $text];
    }

    /**
     * @param  array<int, mixed>  $cells
     * @param  array<string, string>  $aliases
     * @return array<int, string>
     */
    private static function mapHeaders(array $cells, array $aliases): array
    {
        return array_map(
            fn ($cell) => self::resolveHeader(self::valueToString($cell), $aliases),
            array_values($cells)
        );
    }

    private static function resolveHeader(string $raw, array $aliases): string
    {
        $slug = Str::slug(trim($raw), '_');

        return $aliases[$slug] ?? $slug;
    }

    /**
     * @param  array<int, array<int, mixed>>  $matrix
     * @param  array<int, string>  $headers
     * @return array<int, array<string, mixed>>
     */
    private static function dataRows(array $matrix, int $headerRow, array $headers, string $sheet): array
    {
        $width = count($headers);
        $rows = [];

        for ($i = $headerRow + 1; $i < count($matrix); $i++) {
            $cells = $matrix[$i] ?? [];

            if (! is_array($cells)) {
                continue;
            }

            $values = array_slice(
                array_pad(array_map(fn ($cell) => self::valueToString($cell), array_values($cells)), $width, ''),
                0,
                $width
            );

            if (array_filter($values, fn ($value) => $value !== '') === []) {
                continue;
            }

            $row = array_combine($headers, $values);
            $row['__row_number'] = $i + 1;
            $row['__sheet'] = $sheet;
            $rows[] = $row;
        }

        return $rows;
    }

    /**
     * @return array{0: array<int, array<int, array<int, string>>>, 1: array<int, string>}
     */
    private static function matrices(string $filePath): array
    {
        $ext = Str::lower(pathinfo($filePath, PATHINFO_EXTENSION));

        if (in_array($ext, ['csv', 'txt'], true)) {
            return [[self::csvMatrix($filePath)], ['CSV']];
        }

        $spreadsheet = IOFactory::load($filePath);
        $matrices = [];
        $names = [];

        foreach ($spreadsheet->getAllSheets() as $sheet) {
            $grid = $sheet->toArray(null, true, true, false);
            $matrices[] = array_values(array_map(
                fn ($row) => array_map(fn ($cell) => self::valueToString($cell), (array) $row),
                $grid
            ));
            $names[] = $sheet->getTitle();
        }

        $spreadsheet->disconnectWorksheets();

        return [$matrices, $names];
    }

    /**
     * @return array<int, array<int, string>>
     */
    private static function csvMatrix(string $filePath): array
    {
        $rows = [];

        if (($handle = fopen($filePath, 'r')) !== false) {
            while (($row = fgetcsv($handle)) !== false) {
                $rows[] = array_map(fn ($value) => trim((string) $value), $row);
            }
            fclose($handle);
        }

        return $rows;
    }

    private static function valueToString(mixed $value): string
    {
        if ($value === null) {
            return '';
        }

        if ($value instanceof \DateTimeInterface) {
            return $value->format('Y-m-d H:i:s');
        }

        if (is_bool($value)) {
            return $value ? '1' : '0';
        }

        return trim((string) $value);
    }
}
