<?php
namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class ForcePasswordChange
{
    private array $allowedPaths = [
        'profile',
        'profile/*',
        'profile/password',
        'profile/password/*',
        'password/change',
        'password/change/*',
        // The parent portal is gated behind the 'verified' middleware, so a user
        // holding a temporary password must still be able to reach email
        // verification before they are forced to change it.
        'email/verify',
        'email/verify/*',
        'school-setup',
        'school-setup/*',
        'school/school-setup',
        'school/school-setup/*',
        'school/setup/*',
        'logout',
    ];

    public function handle(Request $request, Closure $next)
    {
        $user = $request->user();

        if ($user && ($user->force_password_change || $user->needsPasswordChange())) {
            if ($request->is(...$this->allowedPaths)) {
                return $next($request);
            }

            if ($request->expectsJson()) {
                return response()->json(['message' => 'You must change your password.'], 403);
            }

            return redirect()->route('password.change')->with('warning', 'You must change your temporary password before continuing.');
        }

        return $next($request);
    }
}
