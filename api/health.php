<?php

/*
| Diagnostic endpoint (temporary) - reports runtime facts without booting
| Laravel, then boots the HTTP kernel against "/" to surface the real
| bootstrap error the deployed app is throwing.
*/

header('Content-Type: application/json; charset=utf-8');

$out = [
    'php' => PHP_VERSION,
    'sapi' => php_sapi_name(),
    'time' => date('c'),
    'request_uri' => $_SERVER['REQUEST_URI'] ?? '(none)',
    'cwd' => getcwd(),
];

$out['vendor_autoload'] = file_exists(__DIR__.'/../vendor/autoload.php');

if ($out['vendor_autoload']) {
    require __DIR__.'/../vendor/autoload.php';
    $out['laravel'] = Illuminate\Foundation\Application::VERSION;
}

$out['views_path'] = getenv('VIEW_COMPILED_PATH') ?: '(unset)';
$out['storage_framework_views_exists'] = is_dir(__DIR__.'/../storage/framework/views');
$out['tmp_writable'] = is_writable(sys_get_temp_dir());

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
                [PDO::ATTR_TIMEOUT => 8]
            );
            $out['db_test'] = $pdo->query('select 1')->fetchColumn() !== false ? 'connected' : 'connected(empty)';
            unset($pdo);
        } catch (Throwable $e) {
            $out['db_test'] = 'FAIL: '.substr($e->getMessage(), 0, 240);
        }
    }
} else {
    $out['db_test'] = 'PDO unavailable';
}

$compiledViews = getenv('VIEW_COMPILED_PATH') ?: rtrim(sys_get_temp_dir(), DIRECTORY_SEPARATOR).DIRECTORY_SEPARATOR.'syscend-views';
if (! is_dir($compiledViews)) {
    @mkdir($compiledViews, 0777, true);
}
$_ENV['VIEW_COMPILED_PATH'] = $compiledViews;
$_SERVER['VIEW_COMPILED_PATH'] = $compiledViews;
putenv('VIEW_COMPILED_PATH='.$compiledViews);

require __DIR__.'/../vendor/autoload.php';

$app = null;
$out['boot'] = null;
try {
    $app = require __DIR__.'/../bootstrap/app.php';
    $kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);
    $request = Illuminate\Http\Request::create('https://example.test/', 'GET');
    $response = $kernel->handle($request);
    $out['boot'] = 'kernel returned status '.$response->getStatusCode();
} catch (Throwable $e) {
    $out['boot'] = 'TIMEOUT/ERROR: '.get_class($e).': '.substr($e->getMessage(), 0, 500)
        .' @ '.$e->getFile().':'.$e->getLine()
        .(method_exists($e, 'getStatusCode') ? ' (http '.$e->getStatusCode().')' : '');
}

// probe v5 - deployed tree introspection
$out['app_env'] = getenv('APP_ENV') ?: '(unset)';
$out['config_app_md5'] = md5_file(__DIR__.'/../config/app.php');
$out['app_php_lines'] = count(file(__DIR__.'/../config/app.php'));
$out['cached_config_exists'] = is_file(__DIR__.'/../bootstrap/cache/config.php');
$out['cached_services_exists'] = is_file(__DIR__.'/../bootstrap/cache/services.php');

if ($app !== null) {
    try {
        $out['configuration_cached'] = $app->configurationIsCached();
        $out['bootstrap_providers_file'] = is_file(__DIR__.'/../bootstrap/providers.php');

        $cfg = $app->make('config');
        $providers = (array) $cfg->get('app.providers');
        $out['provider_count'] = count($providers);
        $out['view_provider_in_config'] = in_array('Illuminate\View\ViewServiceProvider', $providers, true);
        $out['config_source_provider_index'] = array_values(array_filter(
            $providers,
            static fn ($p) => is_string($p) && (str_contains($p, 'ViewServiceProvider') || str_contains($p, '\\View\\'))
        ));

        $loaded = $app->getLoadedProviders();
        $out['loaded_provider_view'] = array_key_exists('Illuminate\View\ViewServiceProvider', $loaded)
            ? ($loaded['Illuminate\View\ViewServiceProvider'] ? 'loaded' : 'registered-but-not-loaded')
            : 'absent';
        $out['bound_view'] = $app->bound('view');

        $out['view_compiled_config'] = $cfg->get('view.compiled');
        $out['view_paths_config'] = $cfg->get('view.paths');
    } catch (Throwable $e) {
        $out['introspection_error'] = get_class($e).': '.$e->getMessage().' @ '.$e->getFile().':'.$e->getLine();
    }

    try {
        $app->make('view');
        $out['view_resolve'] = 'ok';
    } catch (Throwable $e) {
        $out['view_resolve'] = get_class($e).': '.substr($e->getMessage(), 0, 300);
    }
} else {
    $out['app'] = 'bootstrap/app.php produced nothing';
}

echo json_encode($out, JSON_PRETTY_PRINT);// probe v4
