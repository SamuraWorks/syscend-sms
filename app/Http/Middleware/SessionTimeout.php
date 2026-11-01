<?php
namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Session;

class SessionTimeout
{
    public function handle(Request $request, Closure $next, int $timeoutMinutes = 120)
    {
        if (!Session::has('last_activity')) {
            Session::put('last_activity', now()->timestamp);
            return $next($request);
        }

        $lastActivity = Session::get('last_activity');
        $elapsed = now()->timestamp - $lastActivity;

        if ($elapsed > ($timeoutMinutes * 60)) {
            Session::flush();
            auth()->logout();
            
            if ($request->expectsJson()) {
                return response()->json(['message' => 'Session expired'], 419);
            }
            
            return redirect()->route('login')->with('error', 'Session expired due to inactivity. Please log in again.');
        }

        Session::put('last_activity', now()->timestamp);
        return $next($request);
    }
}
