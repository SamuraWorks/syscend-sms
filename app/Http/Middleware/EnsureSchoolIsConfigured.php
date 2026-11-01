<?php

namespace App\Http\Middleware;

use App\Models\School;
use Closure;
use Illuminate\Http\Request;

class EnsureSchoolIsConfigured
{
    private array $allowedPaths = [
        'school-setup',
        'school/school-setup',
        'school-setup/*',
        'school/school-setup/*',
        'school/setup/*',
        'logout',
        'super-admin/*',
        'ministry/*',
    ];

    public function handle(Request $request, Closure $next)
    {
        $user = $request->user();

        if ($user && $user->school_id) {
            $school = School::withoutGlobalScopes()->find($user->school_id);

            if ($school && ! $school->is_configured) {
                if ($request->is(...$this->allowedPaths)) {
                    return $next($request);
                }

                if ($request->expectsJson()) {
                    return response()->json(['message' => 'School setup is not complete.'], 403);
                }

                return redirect()->route('school.school-setup')
                    ->with('warning', 'Please complete your school setup before accessing other modules.');
            }
        }

        return $next($request);
    }
}
