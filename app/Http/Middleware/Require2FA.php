<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class Require2FA
{
    public function handle(Request $request, Closure $next)
    {
        $user = $request->user();
        
        if ($user && $user->hasRole('super-admin') && $user->two_factor_enabled && !session('2fa_verified')) {
            if ($request->is('super-admin/2fa/*')) {
                return $next($request);
            }
            
            if ($request->expectsJson()) {
                return response()->json(['message' => '2FA verification required.'], 403);
            }
            
            return redirect()->route('super-admin.2fa.verify-form');
        }

        return $next($request);
    }
}
