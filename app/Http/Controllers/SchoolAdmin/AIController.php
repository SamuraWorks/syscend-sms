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