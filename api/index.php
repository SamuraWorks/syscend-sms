<?php

/*
|--------------------------------------------------------------------------
| Vercel PHP entrypoint
|--------------------------------------------------------------------------
|
| Vercel invokes every PHP file in this directory as a serverless function
| and vercel.json rewrites all application requests here. The real front
| controller stays in public/index.php so local, Apache and nginx
| deployments keep working completely unchanged.
|
| The three defaults below only apply while the value is NOT already set -
| they exist because the serverless filesystem is read only except for the
| temporary directory, so the stock "write a log file" and "compile views
| into storage" behaviours would fail on the first request. Set them in the
| Vercel dashboard to override.
|
*/

$set = static function (string $key, string $value): void {
    if (getenv($key) !== false || isset($_ENV[$key]) || isset($_SERVER[$key])) {
        return;
    }

    putenv($key.'='.$value);
    $_ENV[$key] = $value;
    $_SERVER[$key] = $value;
};

// Vercel's filesystem is read-only and the fresh database may not yet contain
// Laravel's optional session/cache tables. Use writable ephemeral fallbacks at
// the serverless boundary; application data remains in PostgreSQL.
$runtimeDir = rtrim(sys_get_temp_dir(), DIRECTORY_SEPARATOR).DIRECTORY_SEPARATOR.'syscend-runtime';
$sessionDir = $runtimeDir.DIRECTORY_SEPARATOR.'sessions';
$cacheDir = $runtimeDir.DIRECTORY_SEPARATOR.'cache';

foreach ([$sessionDir, $cacheDir] as $directory) {
    if (! is_dir($directory)) {
        @mkdir($directory, 0777, true);
    }
}

$force = static function (string $key, string $value): void {
    putenv($key.'='.$value);
    $_ENV[$key] = $value;
    $_SERVER[$key] = $value;
};

$force('LOG_CHANNEL', 'stderr');
$force('QUEUE_CONNECTION', 'sync');
$force('SESSION_DRIVER', 'file');
$force('SESSION_FILES', $sessionDir);
$force('CACHE_STORE', 'array');

// Vercel stores the production Supabase configuration under the *_2 names.
// Map those values at the serverless boundary so Laravel keeps its standard
// configuration contract without duplicating or exposing secrets in source.
$productionAliases = [
    'APP_KEY' => 'APP_KEY_2',
    'APP_URL' => 'APP_URL_2',
    'DB_CONNECTION' => 'DB_CONNECTION_2',
    'DB_HOST' => 'DB_HOST_2',
    'DB_PORT' => 'DB_PORT_2',
    'DB_DATABASE' => 'DB_DATABASE_2',
    'DB_USERNAME' => 'DB_USERNAME_2',
    'DB_PASSWORD' => 'DB_PASSWORD_2',
    'DB_SSLMODE' => 'DB_SSLMODE_2',
];

foreach ($productionAliases as $target => $source) {
    $sourceValue = getenv($source);

    if ($sourceValue !== false && $sourceValue !== '') {
        putenv($target.'='.$sourceValue);
        $_ENV[$target] = $sourceValue;
        $_SERVER[$target] = $sourceValue;
    }
}

$compiledViews = rtrim(sys_get_temp_dir(), DIRECTORY_SEPARATOR).DIRECTORY_SEPARATOR.'syscend-views';
$set('VIEW_COMPILED_PATH', $compiledViews);

if (! is_dir($compiledViews)) {
    @mkdir($compiledViews, 0777, true);
}

require __DIR__.'/../public/index.php';
