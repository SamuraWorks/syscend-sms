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

        try {
            $aiStatus = app(\App\Services\AI\AIService::class)->status('intelligence');
        } catch (Throwable $exception) {
            report($exception);
            $aiStatus = ['allowed' => false, 'has_credentials' => false];
        }

        $aiAvailable = (bool) ($aiStatus['allowed'] ?? false) && (bool) ($aiStatus['has_credentials'] ?? false);
        $payload['ai'] = [
            'available' => $aiAvailable,
            'message' => $aiAvailable
                ? 'AI explanations use the verified records above and are labeled with their supporting facts.'
                : 'AI explanations are unavailable until an authorized provider is configured; this view remains deterministic and evidence-based.',
        ];

        return Inertia::render('Intelligence/Index', ['intelligence' => $payload]);
    }

    public function parent(Request $request, SyscendIntelligenceService $intelligence)
    {
        $user = $request->user();
        try {
            $children = (new \App\Services\FamilyResolver())->childrenForUser($user);
            $profiles = $children->map(fn ($child) => (new \App\Services\StudentPerformanceEngine(
                (int) $child->school_id,
                $request->input('academic_year_id'),
                $request->input('term_id'),
            ))->getStudentProfile($child))->values();
            $payload = [
                'role' => 'parent', 'title' => 'Family learning intelligence',
                'description' => 'Private academic and attendance insights for your linked children.',
                'source_status' => $profiles->isEmpty() ? 'limited' : 'connected',
                'profiles' => $profiles, 'metrics' => [['label' => 'Linked children', 'value' => $profiles->count(), 'tone' => 'indigo']],
                'trends' => [], 'alerts' => [], 'data_quality' => [],
                'insights' => $profiles->map(function ($profile) {
                    $score = $profile['current_score'] ?? null;
                    $value = is_object($score) ? ($score->total_score ?? null) : ($score['total_score'] ?? null);
                    return ['type' => 'family', 'title' => 'Child progress available', 'message' => $value === null ? 'No current score is available for this child.' : "The latest recorded progress score is {$value}%.", 'priority' => 'normal'];
                })->values()->all(),
                'voice_report' => 'Good morning. Here is your family learning report. ' . $profiles->map(function ($profile) {
                    $score = $profile['current_score'] ?? null;
                    $value = is_object($score) ? ($score->total_score ?? null) : ($score['total_score'] ?? null);
                    return $value === null ? 'A child has no current score available.' : "A child has a latest recorded score of {$value} percent.";
                })->implode(' '),
                'recommendations' => ['Review each child profile and discuss any declining subject or attendance signal with the school.'],
                'ai' => ['available' => false, 'message' => 'AI explanations are unavailable; this view uses verified records for your linked children only.'],
            ];
        } catch (Throwable $exception) {
            report($exception);
            $payload = $intelligence->unavailable('parent');
        }
        return Inertia::render('Intelligence/Index', ['intelligence' => $payload]);
    }
}
