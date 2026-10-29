<?php

namespace App\Http\Controllers;

use App\Services\RoleRegistry;
use App\Services\SyscendIntelligenceService;
use Illuminate\Http\Request;
use Inertia\Inertia;

final class SyscendIntelligenceController extends Controller
{
    public function __invoke(Request $request, SyscendIntelligenceService $intelligence)
    {
        $user = $request->user();
        $role = $user->getRoleNames()->first() ?? '';

        if ($role === RoleRegistry::STUDENT) {
            $payload = $intelligence->student((int) $user->school_id, (int) $user->id);
        } else {
            abort_unless($user->school_id && RoleRegistry::isSchoolRole($role), 403);
            $payload = $intelligence->school((int) $user->school_id, $role);
        }

        return Inertia::render('Intelligence/Index', ['intelligence' => $payload]);
    }
}
