<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

/*
|--------------------------------------------------------------------------
| Serverless writable manifest cache
|--------------------------------------------------------------------------
|
| Vercel mounts the project directory as read-only, but Laravel recompiles
| the package and service provider manifests into bootstrap/cache on every
| cold start. When that directory is not writable, redirect the two
| manifests to the temporary directory so provider registration does not
| fail before the request is handled.
|
*/

if (! is_writable(dirname(__DIR__).'/bootstrap/cache')) {
    $tmpBootstrap = rtrim(sys_get_temp_dir(), DIRECTORY_SEPARATOR).DIRECTORY_SEPARATOR.'syscend-bootstrap-cache';

    if (! is_dir($tmpBootstrap)) {
        @mkdir($tmpBootstrap, 0777, true);
    }

    $setEnv = static function (string $key, string $value): void {
        putenv($key.'='.$value);
        $_ENV[$key] = $value;
        $_SERVER[$key] = $value;
    };

    $setEnv('APP_SERVICES_CACHE', $tmpBootstrap.DIRECTORY_SEPARATOR.'services.php');
    $setEnv('APP_PACKAGES_CACHE', $tmpBootstrap.DIRECTORY_SEPARATOR.'packages.php');
}

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->trustProxies(
            headers: \Illuminate\Http\Request::HEADER_X_FORWARDED_FOR |
                     \Illuminate\Http\Request::HEADER_X_FORWARDED_HOST |
                     \Illuminate\Http\Request::HEADER_X_FORWARDED_PORT |
                     \Illuminate\Http\Request::HEADER_X_FORWARDED_PROTO |
                     \Illuminate\Http\Request::HEADER_X_FORWARDED_AWS_ELB
        );

        $middleware->web(append: [
            \App\Http\Middleware\HandleInertiaRequests::class,
            \App\Http\Middleware\SessionTimeout::class,
            \App\Http\Middleware\ForcePasswordChange::class,
            \App\Http\Middleware\RestrictIpAccess::class,
            \App\Http\Middleware\EnforceSubscriptionModules::class,
        ]);

        $middleware->append(\App\Http\Middleware\RoleRateLimiter::class);

        $middleware->alias([
            'role'       => \Spatie\Permission\Middleware\RoleMiddleware::class,
            'permission' => \Spatie\Permission\Middleware\PermissionMiddleware::class,
            'role_or_permission' => \Spatie\Permission\Middleware\RoleOrPermissionMiddleware::class,
            '2fa'        => \App\Http\Middleware\Require2FA::class,
            'school.setup' => \App\Http\Middleware\EnsureSchoolIsConfigured::class,
            'verified'   => \Illuminate\Auth\Middleware\EnsureEmailIsVerified::class,
            'webhook.orange' => \App\Http\Middleware\VerifyOrangeMoneyWebhook::class,
            'webhook.monime' => \App\Http\Middleware\VerifyMonimeWebhook::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create();
