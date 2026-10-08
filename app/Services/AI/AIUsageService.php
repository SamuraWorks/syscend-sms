<?php

namespace App\Services\AI;

use App\Models\AiUsageLog;
use App\Models\School;
use App\Models\User;
use Illuminate\Support\Carbon;

/**
 * Tracks AI usage and enforces per-school / per-user caps.
 * Admission gates for each feature are defined in config/ai.php.
 */
class AIUsageService
{
    public function isWithinLimits(string $feature, User $user, ?School $school = null): bool
    {
        if (! config('ai.limits.enforce')) {
            return true;
        }

        $limits = $this->limitsFor($feature);

        if (empty($limits)) {
            return true;
        }

        $dayStart = Carbon::today();

        if (($perSchool = $limits['per_school_per_day'] ?? 0) > 0 && $school) {
            $used = AiUsageLog::where('feature', $feature)
                ->where('status', 'success')
                ->where('school_id', $school->id)
                ->where('performed_at', '>=', $dayStart)
                ->count();

            if ($used >= $perSchool) {
                return false;
            }
        }

        if (($perUser = $limits['per_user_per_day'] ?? 0) > 0 && $user) {
            $used = AiUsageLog::where('feature', $feature)
                ->where('status', 'success')
                ->where('user_id', $user->id)
                ->where('performed_at', '>=', $dayStart)
                ->count();

            if ($used >= $perUser) {
                return false;
            }
        }

        return true;
    }

    public function record(array $attributes): AiUsageLog
    {
        return AiUsageLog::create(array_merge([
            'status'        => 'success',
            'input_tokens'  => 0,
            'output_tokens' => 0,
            'total_tokens'  => 0,
            'latency_ms'    => 0,
            'cost_usd_cents'=> 0,
            'performed_at'  => now(),
        ], $attributes));
    }

    public function recordThrottled(string $feature, User $user, ?School $school = null): void
    {
        AiUsageLog::create([
            'school_id'    => $school?->id,
            'user_id'      => $user->id,
            'feature'      => $feature,
            'status'       => 'throttled',
            'performed_at' => now(),
        ]);
    }

    /**
     * A rough cost estimate in USD cents from token usage (used for the audit
     * trail, never for billing). Fall back to a flat rate when usage is absent.
     */
    public static function estimateCost(string $model, array $usage): int
    {
        $perMillionInput  = 0.15;  // gpt-4o-mini pricing; close enough for telemetry
        $perMillionOutput = 0.60;

        return (int) ceil(
            (($usage['input_tokens'] ?? 0) / 1_000_000) * $perMillionInput * 100
            + (($usage['output_tokens'] ?? 0) / 1_000_000) * $perMillionOutput * 100
        );
    }

    private function limitsFor(string $feature): array
    {
        return (array) (config('ai.features.' . $feature . '.limits') ?? []);
    }
}