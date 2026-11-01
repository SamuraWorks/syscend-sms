<?php

namespace App\Http\Controllers\SchoolAdmin;

use App\Http\Controllers\Controller;
use App\Models\School;
use App\Services\AI\AIContextBuilder;
use App\Services\AI\AIPermissionService;
use App\Services\AI\AIService;
use App\Services\AI\AIUnavailableException;
use Illuminate\Http\Request;

/**
 * AI feature surface. One endpoint per feature — there is deliberately no
 * catch-all "/ai" route. Every generate endpoint returns a DRAFT only; nothing
 * is persisted until an explicit human approval action in a later step.
 */
class AIController extends Controller
{
    public function status(Request $request, AIService $ai, AIPermissionService $permissions)
    {
        return response()->json([
            'globally_enabled' => $permissions->globallyEnabled(),
            'provider'         => $permissions->providerName(),
            'features'         => array_map(
                fn ($feature) => $ai->status($feature),
                array_keys(config('ai.features', []))
            ),
        ]);
    }

    public function generateIntelligence(Request $request, AIService $ai, \App\Services\SyscendIntelligenceService $intelligence)
    {
        $request->validate(['question' => ['required', 'string', 'max:2000']]);
        $user = $request->user();
        $role = $user->getRoleNames()->first() ?? 'unknown';
        $school = School::findOrFail($this->getSchoolId());

        try {
            $verified = match ($role) {
                \App\Services\RoleRegistry::STUDENT => $intelligence->student((int) $school->id, (int) $user->id),
                'parent' => ['profiles' => (new \App\Services\FamilyResolver())->childrenForUser($user)->map(fn ($child) => (new \App\Services\StudentPerformanceEngine((int) $child->school_id))->getStudentProfile($child))->values()],
                default => $intelligence->school((int) $school->id, $role),
            };
            $result = $ai->generate($school, $user, 'intelligence', [
                'role' => $role,
                'question' => $request->string('question')->toString(),
                'intelligence' => $verified,
            ]);
        } catch (AIUnavailableException $e) {
            return response()->json(['error' => $e->getMessage(), 'type' => $e->type], $e->toHttpStatus());
        }

        return response()->json(['success' => true, 'response' => $result['content'], 'meta' => $result['meta']]);
    }

    public function generateHomepage(Request $request, AIService $ai, AIContextBuilder $contexts)
    {
        $school = School::findOrFail($this->getSchoolId());

        try {
            $result = $ai->generate(
                $school,
                auth()->user(),
                AIPermissionService::FEATURE_HOMEPAGE,
                $contexts->homepage($school),
            );
        } catch (AIUnavailableException $e) {
            return response()->json([
                'error' => $e->getMessage(),
                'type'  => $e->type,
            ], $e->toHttpStatus());
        }

        return response()->json([
            'success' => true,
            'state'   => 'draft',
            'draft'   => $result['content'],
            'meta'    => $result['meta'],
        ]);
    }
}
