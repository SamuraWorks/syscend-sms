<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

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
