<?php

namespace App\Http\Controllers;

use App\Services\RoleRegistry;
use App\Services\SyscendIntelligenceService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Throwable;

final class SyscendIntelligenceController extends Controller
{
    public function __invoke(Request $request, SyscendIntelligenceService $intelligence)
    {
        $user = $request->user();
        $role = $user->getRoleNames()->first() ?? '';

        abort_unless($user->school_id && ($role === RoleRegistry::STUDENT || RoleRegistry::isSchoolRole($role)), 403);

        try {
            $payload = $role === RoleRegistry::STUDENT
                ? $intelligence->student((int) $user->school_id, (int) $user->id)
                : $intelligence->school((int) $user->school_id, $role);
        } catch (Throwable $exception) {
            report($exception);
            $payload = $intelligence->unavailable($role);
        }

        return Inertia::render('Intelligence/Index', ['intelligence' => $payload]);
    }
}
