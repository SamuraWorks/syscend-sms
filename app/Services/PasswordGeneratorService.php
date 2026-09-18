<?php

namespace App\Services;

class PasswordGeneratorService
{
    private const LOWERCASE = 'abcdefghijkmnopqrstuvwxyz';
    private const UPPERCASE = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    private const NUMBERS   = '23456789';
    private const SYMBOLS   = '@#$%&*!?';

    /**
     * Generate a secure random password.
     */
    public static function generate(int $length = 12, bool $includeSymbols = true): string
    {
        $chars = self::LOWERCASE . self::UPPERCASE . self::NUMBERS;
        if ($includeSymbols) {
            $chars .= self::SYMBOLS;
        }

        // Ensure at least one of each required type
        $password = '';
        $password .= self::LOWERCASE[random_int(0, strlen(self::LOWERCASE) - 1)];
        $password .= self::UPPERCASE[random_int(0, strlen(self::UPPERCASE) - 1)];
        $password .= self::NUMBERS[random_int(0, strlen(self::NUMBERS) - 1)];
        if ($includeSymbols) {
            $password .= self::SYMBOLS[random_int(0, strlen(self::SYMBOLS) - 1)];
        }

        // Fill the rest randomly
        for ($i = strlen($password); $i < $length; $i++) {
            $password .= $chars[random_int(0, strlen($chars) - 1)];
        }

        // Shuffle to avoid predictable positions
        return str_shuffle($password);
    }

    /**
     * Calculate password strength (0-100).
     */
    public static function strength(string $password): int
    {
        $score = 0;

        if (strlen($password) >= 8)  $score += 25;
        if (strlen($password) >= 12) $score += 15;
        if (preg_match('/[a-z]/', $password)) $score += 10;
        if (preg_match('/[A-Z]/', $password)) $score += 15;
        if (preg_match('/[0-9]/', $password)) $score += 15;
        if (preg_match('/[^a-zA-Z0-9]/', $password)) $score += 20;

        return min(100, $score);
    }

    /**
     * Get strength label and color.
     */
    public static function strengthInfo(string $password): array
    {
        $score = self::strength($password);

        if ($score >= 80) return ['label' => 'Strong',     'color' => 'text-green-600', 'bg' => 'bg-green-100', 'percent' => $score];
        if ($score >= 60) return ['label' => 'Good',       'color' => 'text-blue-600',  'bg' => 'bg-blue-100',  'percent' => $score];
        if ($score >= 40) return ['label' => 'Fair',       'color' => 'text-amber-600', 'bg' => 'bg-amber-100', 'percent' => $score];
        return ['label' => 'Weak', 'color' => 'text-red-600', 'bg' => 'bg-red-100', 'percent' => $score];
    }
}
