<?php

/*
| Diagnostic endpoint (temporary) - reports runtime facts without booting
| Laravel, so a failing bootstrap cannot hide the environment.
*/

header('Content-Type: application/json; charset=utf-8');

$keys = [
    'APP_KEY', 'APP_ENV', 'APP_URL', 'APP_DEBUG', 'APP_TIMEZONE',
    'DB_HOST', 'DB_PORT', 'DB_DATABASE', 'DB_USERNAME', 'DB_PASSWORD', 'DB_SSLMODE',
    'CRON_SECRET', 'STORAGE_DRIVER', 'AWS_ACCESS_KEY_ID', 'AWS_BUCKET',
    'AWS_PUBLIC_BUCKET', 'AWS_ENDPOINT', 'AWS_PUBLIC_URL',
    'LOG_CHANNEL', 'SESSION_DRIVER', 'CACHE_STORE', 'QUEUE_CONNECTION', 'MAIL_MAILER',
];

$env = [];
foreach ($keys as $key) {
    $value = getenv($key);
    if ($value === false) {
        $value = $_ENV[$key] ?? $_SERVER[$key] ?? null;
    }
    $env[$key] = ($value === null || $value === '') ? '(unset)' : 'set';
}

$out = [
    'php' => PHP_VERSION,
    'sapi' => php_sapi_name(),
    'time' => date('c'),
    'request_uri' => $_SERVER['REQUEST_URI'] ?? '(none)',
    'cwd' => getcwd(),
    'script' => realpath($_SERVER['SCRIPT_FILENAME'] ?? __FILE__),
    'vendor_autoload' => file_exists(__DIR__.'/../vendor/autoload.php'),
    'public_index' => file_exists(__DIR__.'/../public/index.php'),
    'env' => $env,
];

if ($out['vendor_autoload']) {
    require __DIR__.'/../vendor/autoload.php';
    $out['laravel'] = class_exists('Illuminate\Foundation\Application')
        ? Illuminate\Foundation\Application::VERSION
        : 'not loaded';
}

if (class_exists('PDO')) {
    $host = getenv('DB_HOST');
    $dbname = getenv('DB_DATABASE');
    $username = getenv('DB_USERNAME');
    $password = getenv('DB_PASSWORD');
    $port = getenv('DB_PORT') ?: '5432';

    if (! $host || ! $username) {
        $out['db_test'] = 'skipped (DB_HOST/USERNAME unset)';
    } else {
        try {
            $pdo = new PDO(
                "pgsql:host={$host};port={$port};dbname={$dbname};sslmode=require",
                $username,
                $password,
                [PDO::ATTR_TIMEOUT => 8, PDO::ATTR_CONNECT_TIMEOUT => 8]
            );
            $pdo->query('select 1');
            $out['db_test'] = 'connected';
            unset($pdo);
        } catch (Throwable $e) {
            $out['db_test'] = 'FAIL: '.substr($e->getMessage(), 0, 240);
        }
    }
} else {
    $out['db_test'] = 'PDO unavailable';
}

echo json_encode($out, JSON_PRETTY_PRINT);