<?php

/**
 * PHP 8.3 / 8.4 compatibility polyfills for Laravel 13 + Symfony 8.x
 * Allows running on PHP 8.2.12 (XAMPP) without upgrading.
 */

// ============================================================
// json_validate() — PHP 8.3
// ============================================================
if (!function_exists('json_validate')) {
    function json_validate(string $json, int $depth = 512, int $flags = 0): bool
    {
        if ($json === '' || !is_string($json)) {
            return false;
        }
        json_decode($json, null, $depth, $flags);
        return json_last_error() === JSON_ERROR_NONE;
    }
}

// ============================================================
// mb_str_pad() — PHP 8.4
// ============================================================
if (!function_exists('mb_str_pad')) {
    function mb_str_pad(string $string, int $length, string $padString = ' ', int $padType = STR_PAD_RIGHT): string
    {
        $mbLength = mb_strlen($string, 'UTF-8');
        if ($mbLength >= $length) {
            return $string;
        }
        $padLength = $length - $mbLength;
        $padString = $padString ?: ' ';

        if ($padType === STR_PAD_BOTH) {
            $leftPad = str_repeat($padString, intdiv($padLength, 2));
            $rightPad = str_repeat($padString, intdiv($padLength, 2) + ($padLength % 2));
            return mb_substr($leftPad . $string . $rightPad, 0, $length, 'UTF-8');
        }

        $pad = str_repeat($padString, (int) ceil($padLength / mb_strlen($padString, 'UTF-8')));
        if ($padType === STR_PAD_LEFT) {
            return mb_substr($pad, 0, $padLength, 'UTF-8') . $string;
        }
        return $string . mb_substr($pad, 0, $padLength, 'UTF-8');
    }
}

// ============================================================
// array_any() — PHP 8.4
// ============================================================
if (!function_exists('array_any')) {
    function array_any(array $array, callable $callback): bool
    {
        foreach ($array as $key => $value) {
            if ($callback($value, $key)) {
                return true;
            }
        }
        return false;
    }
}

// ============================================================
// array_all() — PHP 8.4
// ============================================================
if (!function_exists('array_all')) {
    function array_all(array $array, callable $callback): bool
    {
        foreach ($array as $key => $value) {
            if (!$callback($value, $key)) {
                return false;
            }
        }
        return true;
    }
}

// ============================================================
// request_parse_body() — PHP 8.4 (Symfony HttpFoundation 8.x)
// ============================================================
if (!function_exists('request_parse_body')) {
    function request_parse_body(): array
    {
        $contentType = $_SERVER['CONTENT_TYPE'] ?? '';
        $method      = $_SERVER['REQUEST_METHOD'] ?? 'GET';

        if (!in_array($method, ['PUT', 'DELETE', 'PATCH', 'QUERY'], true)) {
            return [$_POST, $_FILES];
        }

        $rawBody = file_get_contents('php://input');
        if ($rawBody === '' || $rawBody === false) {
            return [$_POST, $_FILES];
        }

        $post  = $_POST;
        $files = $_FILES;

        if (str_starts_with($contentType, 'application/x-www-form-urlencoded')) {
            parse_str($rawBody, $post);
        } elseif (str_starts_with($contentType, 'application/json')) {
            $decoded = json_decode($rawBody, true);
            if (is_array($decoded)) {
                $post = $decoded;
            }
        } elseif (str_starts_with($contentType, 'multipart/form-data')) {
            $boundary = null;
            if (preg_match('/boundary=(.+?)$/i', $contentType, $m)) {
                $boundary = trim($m[1], '"');
            }
            if ($boundary) {
                $post  = [];
                $files = [];
                _parse_multipart_boundary($rawBody, $boundary, $post, $files);
            }
        }

        return [$post, $files];
    }
}

if (!function_exists('_parse_multipart_boundary')) {
    function _parse_multipart_boundary(string $body, string $boundary, array &$post, array &$files): void
    {
        $parts = explode('--' . $boundary, $body);
        foreach ($parts as $part) {
            $part = trim($part);
            if ($part === '' || $part === '--') {
                continue;
            }
            $headerEnd = strpos($part, "\r\n\r\n");
            if ($headerEnd === false) {
                continue;
            }
            $headers = substr($part, 0, $headerEnd);
            $content = substr($part, $headerEnd + 4);
            if (str_ends_with($content, "\r\n")) {
                $content = substr($content, 0, -2);
            }
            $name = null;
            $filename = null;
            if (preg_match('/name="([^"]+)"/i', $headers, $nameMatch)) {
                $name = $nameMatch[1];
            }
            if (preg_match('/filename="([^"]+)"/i', $headers, $fileMatch)) {
                $filename = $fileMatch[1];
            }
            if ($name === null) {
                continue;
            }
            if ($filename !== null) {
                $tmpFile = tempnam(sys_get_temp_dir(), 'upload_');
                file_put_contents($tmpFile, $content);
                $files[$name] = [
                    'name'     => $filename,
                    'type'     => '',
                    'tmp_name' => $tmpFile,
                    'error'    => UPLOAD_ERR_OK,
                    'size'     => strlen($content),
                ];
            } else {
                $post[$name] = $content;
            }
        }
    }
}
