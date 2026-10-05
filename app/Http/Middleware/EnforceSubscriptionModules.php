<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnforceSubscriptionModules
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user || $user->hasRole('super-admin')) {
            return $next($request);
        }

        $school = $user->school;
        if (! $school) {
            return $next($request);
        }

        // Check if school has active subscription
        $sub = $school->currentSubscription;
        if (! $sub || $sub->status === 'expired' || $sub->status === 'suspended') {
            if ($this->isAjaxOrInertia($request)) {
                return response()->json(['error' => 'School subscription is inactive. Please contact the platform administrator.'], 403);
            }
            return redirect('/dashboard')->with('error', 'Your school subscription is inactive. Please contact the platform administrator.');
        }

        // Map module slugs to the routes they gate. These are matched against
        // path segments rather than a raw prefix because real paths look like
        // "school/communication/blast" or "ministry/reports" - they never start
        // with the bare module name.
        $moduleSlugs = [
            'academics',
            'fees',
            'examinations',
            'attendance',
            'library',
            'transport',
            'communication',
            'hr',
            'alumni',
            'assets',
            'proposals',
            'inventory',
        ];

        // Only the first matching module is enforced, mirroring the old
        // prefix-scan behaviour.
        $segments = explode('/', trim($request->path(), '/'));

        foreach ($moduleSlugs as $slug) {
            if (in_array($slug, $segments, true)) {
                if (! $school->hasModule($slug)) {
                    if ($this->isAjaxOrInertia($request)) {
                        return response()->json(['error' => "Module '{$slug}' is not enabled in your current subscription plan."], 403);
                    }
                    return redirect('/dashboard')->with('error', "Module '{$slug}' is not enabled in your current subscription plan.");
                }
                break;
            }
        }

        return $next($request);
    }

    private function isAjaxOrInertia(Request $request): bool
    {
        return $request->ajax() || $request->header('X-Inertia');
    }
}
