<?php

namespace App\Http\Middleware;

use App\Models\School;
use Closure;
use Illuminate\Http\Request;

class EnsureSchoolApproved
{
    private array $allowedPaths = [
        'approval/pending',
        'approval/rejected',
        'logout',
        'super-admin/*',
        'ministry/*',
    ];

    public function handle(Request $request, Closure $next)
    {
        $user = $request->user();

        if ($user && $user->school_id) {
            $school = School::withoutGlobalScopes()->find($user->school_id);

            if ($school && ! $school->isRegistrationApproved()) {
                if ($request->is(...$this->allowedPaths)) {
                    return $next($request);
                }

                if ($request->expectsJson()) {
                    $message = $school->isRegistrationRejected()
                        ? 'Your school registration was not approved.'
                        : 'Your school is still awaiting approval.';

                    return response()->json(['message' => $message], 403);
                }

                return redirect()->route(
                    $school->isRegistrationRejected() ? 'approval.rejected' : 'approval.pending'
                );
            }
        }

        return $next($request);
    }
}