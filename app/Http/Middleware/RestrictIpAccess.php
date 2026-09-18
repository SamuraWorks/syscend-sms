<?php
namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class RestrictIpAccess
{
    public function handle(Request $request, Closure $next)
    {
        $school = $request->user()?->school;
        
        if (!$school) {
            return $next($request);
        }

        $allowedIps = json_decode($school->settings->allowed_ips ?? '[]', true);
        
        // If no IPs configured, allow all (opt-in model)
        if (empty($allowedIps)) {
            return $next($request);
        }

        $clientIp = $request->ip();
        
        if (!in_array($clientIp, $allowedIps)) {
            if ($request->expectsJson()) {
                return response()->json(['message' => 'Access denied from this IP address.'], 403);
            }
            abort(403, 'Access denied from this IP address.');
        }

        return $next($request);
    }
}
