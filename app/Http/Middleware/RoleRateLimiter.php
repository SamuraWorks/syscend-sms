<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;

class RoleRateLimiter
{
    protected array $limits = [
        'super-admin'      => 200,
        'ministry-admin'   => 150,
        'district-officer' => 120,
        'school-admin'     => 150,
        'principal'        => 120,
        'teacher'          => 100,
        'student'          => 60,
        'parent'           => 60,
        'accountant'       => 100,
        'librarian'        => 60,
        'driver'           => 30,
        'warden'           => 60,
        'store-manager'    => 60,
        'receptionist'     => 60,
        'proprietor'       => 80,
    ];

    public function handle(Request $request, Closure $next)
    {
        $user = $request->user();
        
        if (!$user) {
            return $next($request);
        }

        $role = $user->getRoleNames()->first() ?? 'guest';
        $maxAttempts = $this->limits[$role] ?? 60;
        
        $key = 'rate_limit:' . $role . ':' . ($user->id ?? $request->ip());
        
        if (RateLimiter::tooManyAttempts($key, $maxAttempts)) {
            $seconds = RateLimiter::availableIn($key);
            
            if ($request->expectsJson()) {
                return response()->json([
                    'message' => 'Too many requests. Please try again in ' . $seconds . ' seconds.',
                ], 429)->withHeaders([
                    'Retry-After' => $seconds,
                    'X-RateLimit-Limit' => $maxAttempts,
                    'X-RateLimit-Remaining' => 0,
                ]);
            }
            
            return response()->view('errors.429', [], 429)->withHeaders([
                'Retry-After' => $seconds,
            ]);
        }

        RateLimiter::hit($key, 60); // 1-minute window

        $response = $next($request);
        
        if (method_exists($response, 'withHeaders')) {
            return $response->withHeaders([
                'X-RateLimit-Limit' => $maxAttempts,
                'X-RateLimit-Remaining' => RateLimiter::remaining($key, $maxAttempts),
            ]);
        }

        $response->headers->set('X-RateLimit-Limit', $maxAttempts);
        $response->headers->set('X-RateLimit-Remaining', RateLimiter::remaining($key, $maxAttempts));
        return $response;
    }
}
