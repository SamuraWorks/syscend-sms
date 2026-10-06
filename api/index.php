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

$set('LOG_CHANNEL', 'stderr');
$set('QUEUE_CONNECTION', 'sync');

$compiledViews = rtrim(sys_get_temp_dir(), DIRECTORY_SEPARATOR).DIRECTORY_SEPARATOR.'syscend-views';
$set('VIEW_COMPILED_PATH', $compiledViews);

if (! is_dir($compiledViews)) {
    @mkdir($compiledViews, 0777, true);
}

require __DIR__.'/../public/index.php';
