<?php

namespace App\Support\Imports;

/**
 * Normalises human-entered names (class, section, department, designation…)
 * so values typed into a spreadsheet match what the school has stored, despite
 * differences in case, surrounding/collapsed whitespace, and the non-breaking
 * spaces that Excel and copy-paste frequently introduce.
 */
class NameNormalizer
{
    public static function normalize(?string $value): string
    {
        if ($value === null) {
            return '';
        }

        // Excel and web copy-paste love non-breaking / narrow spaces.
        $value = str_replace(["\xC2\xA0", "\xE2\x80\x87", "\xE2\x80\xAF"], ' ', $value);
        $value = preg_replace('/\s+/u', ' ', $value) ?? $value;

        return mb_strtolower(trim($value));
    }

    /**
     * Build a map of normalised name => value.
     *
     * @template T
     * @param  iterable<T>           $items
     * @param  callable(T): ?string  $name
     * @return array<string, T>
     */
    public static function keyBy(iterable $items, callable $name): array
    {
        $map = [];

        foreach ($items as $item) {
            $key = self::normalize($name($item));

            if ($key !== '' && ! array_key_exists($key, $map)) {
                $map[$key] = $item;
            }
        }

        return $map;
    }
}
