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

        // Map routes to module slugs
        $moduleMap = [
            '/academics'      => 'academics',
            '/fees'           => 'fees',
            '/examinations'   => 'examinations',
            '/attendance'     => 'attendance',
            '/library'        => 'library',
            '/transport'      => 'transport',
            '/communication'  => 'communication',
            '/hr'             => 'hr',
            '/alumni'         => 'alumni',
            '/assets'         => 'assets',
            '/proposals'      => 'proposals',
            '/inventory'      => 'inventory',
        ];

        $path = $request->path();
        foreach ($moduleMap as $prefix => $moduleSlug) {
            if (str_starts_with($path, $prefix)) {
                if (! $school->hasModule($moduleSlug)) {
                    if ($this->isAjaxOrInertia($request)) {
                        return response()->json(['error' => "Module '{$moduleSlug}' is not enabled in your current subscription plan."], 403);
                    }
                    return redirect('/dashboard')->with('error', "Module '{$moduleSlug}' is not enabled in your current subscription plan.");
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
