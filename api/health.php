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
$bootTrace = null;
try {
    $app = require __DIR__.'/../bootstrap/app.php';
    $out['has_been_bootstrapped'] = $app->hasBeenBootstrapped();
    $kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);
    $request = Illuminate\Http\Request::create('https://example.test/', 'GET');
    $response = $kernel->handle($request);
    $out['boot'] = 'kernel returned status '.$response->getStatusCode();
} catch (Throwable $e) {
    $out['boot'] = 'TIMEOUT/ERROR: '.get_class($e).': '.substr($e->getMessage(), 0, 500)
        .' @ '.$e->getFile().':'.$e->getLine()
        .(method_exists($e, 'getStatusCode') ? ' (http '.$e->getStatusCode().')' : '');
    $frames = [];
    foreach (array_slice($e->getTrace(), 0, 10) as $f) {
        $frames[] = ($f['class'] ?? '').($f['type'] ?? '::').($f['function'] ?? '')
            .' @ '.($f['file'] ?? '?').':'.($f['line'] ?? '?');
    }
    $out['boot_stack'] = $frames;
}

// probe v6 - deployed tree introspection
$out['app_env'] = getenv('APP_ENV') ?: '(unset)';
$out['config_app_md5'] = md5_file(__DIR__.'/../config/app.php');
$out['cached_config_exists'] = is_file(__DIR__.'/../bootstrap/cache/config.php');
$out['cached_services_exists'] = is_file(__DIR__.'/../bootstrap/cache/services.php');
$out['bootstrap_cache_writable'] = is_writable(__DIR__.'/../bootstrap/cache');
$out['base_path'] = isset($app) && $app !== null ? $app->basePath() : '(no app)';

if ($app !== null) {
    try {
        $cfg = $app->make('config');
        $providers = (array) $cfg->get('app.providers');
        $out['provider_count'] = count($providers);
        $out['view_provider_in_config'] = in_array('Illuminate\View\ViewServiceProvider', $providers, true);
        $loaded = $app->getLoadedProviders();
        $out['loaded_provider_view'] = array_key_exists('Illuminate\View\ViewServiceProvider', $loaded)
            ? ($loaded['Illuminate\View\ViewServiceProvider'] ? 'loaded' : 'registered-but-not-loaded')
            : 'absent';
        $out['loaded_provider_count'] = count($loaded);
        $out['bound_view'] = $app->bound('view');
    } catch (Throwable $e) {
        $out['introspection_error'] = get_class($e).': '.$e->getMessage().' @ '.$e->getFile().':'.$e->getLine();
    }

    try {
        $app->make('view');
        $out['view_resolve'] = 'ok';
    } catch (Throwable $e) {
        $out['view_resolve'] = get_class($e).': '.substr($e->getMessage(), 0, 300);
    }

    try {
        $cfg2 = $app->make('config');
        $out['services_cache_path'] = $app->getCachedServicesPath();
        $out['packages_cache_path'] = $app->getCachedPackagesPath();
        $out['drivers'] = [
            'session' => $cfg2->get('session.driver'),
            'cache' => $cfg2->get('cache.default'),
            'filesystem' => $cfg2->get('filesystems.default'),
            'log' => $cfg2->get('logging.default'),
            'queue' => $cfg2->get('queue.default'),
            'view_compiled' => $cfg2->get('view.compiled'),
            'app_key_set' => $cfg2->get('app.key') !== null,
            'db_default' => $cfg2->get('database.default'),
            'session_connection' => $cfg2->get('session.connection'),
            'cache_connection' => $cfg2->get('cache.stores.database.connection'),
        ];
    } catch (Throwable $e) {
        $out['drivers_error'] = get_class($e).': '.$e->getMessage();
    }
}

// stage: fresh application, manually register providers, no kernel
try {
    $app2 = require __DIR__.'/../bootstrap/app.php';
    $out['staged_has_been_bootstrapped'] = $app2->hasBeenBootstrapped();
    $app2->registerConfiguredProviders();
    $loaded2 = $app2->getLoadedProviders();
    $out['staged_loaded_provider_view'] = array_key_exists('Illuminate\View\ViewServiceProvider', $loaded2)
        ? 'loaded' : 'absent';
    $out['staged_loaded_provider_count'] = count($loaded2);
    $out['staged_bound_view'] = $app2->bound('view');
    if ($app2->bound('view')) {
        $out['staged_view_class'] = get_class($app2->make('view'));
    }
} catch (Throwable $e) {
    $out['staged_error'] = get_class($e).': '.substr($e->getMessage(), 0, 400).' @ '.$e->getFile().':'.$e->getLine();
}

// probe v7 - real inbound request scheme (trusted proxy state)
try {
    $real = Illuminate\Http\Request::capture();
    $out['real_request'] = [
        'scheme' => $real->getScheme(),
        'secure' => $real->secure(),
        'root' => $real->root(),
        'forwarded_proto' => $real->headers->get('x-forwarded-proto'),
        'forwarded_for' => $real->headers->get('x-forwarded-for'),
        'host' => $real->getHost(),
    ];
} catch (Throwable $e) {
    $out['real_request_error'] = get_class($e).': '.$e->getMessage();
}

echo json_encode($out, JSON_PRETTY_PRINT);// probe v7
