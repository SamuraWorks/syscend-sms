<?php

namespace App\Services\AI;

use App\Models\User;

/**
 * Who may trigger each AI feature, within the owning school.
 *
 * Role lists mirror config/ai.php "allowed_roles" and MUST reference
 * RoleRegistry constants so role renames stay in one place.
 */
class AIPermissionService
{
    public const FEATURE_HOMEPAGE   = 'homepage';
    public const FEATURE_ANNOUNCEMENT = 'announcement';
    public const FEATURE_LESSON_PLAN  = 'lesson_plan';

    public function canUse(User $user, string $feature): bool
    {
        if (! $this->globallyEnabled()) {
            return false;
        }

        if (! $this->featureEnabled($feature)) {
            return false;
        }

        if (! $this->hasProviderCredentials()) {
            return false;
        }

        if (! $user->isActive()) {
            return false;
        }

        if (empty($user->school_id)) {
            return false;
        }

        $allowed = (array) config('ai.features.' . $feature . '.allowed_roles', []);

        if (empty($allowed)) {
            return false;
        }

        return $user->roles()
            ->pluck('name')
            ->contains(fn (string $role) => in_array($role, $allowed, true));
    }

    public function globallyEnabled(): bool
    {
        return (bool) config('ai.enabled')
            && (bool) config('ai.ai_features_enabled');
    }

    public function featureEnabled(string $feature): bool
    {
        return (bool) config('ai.features.' . $feature . '.enabled', false);
    }

    public function hasProviderCredentials(): bool
    {
        $provider = app('ai.provider');

        return method_exists($provider, 'hasCredentials') && $provider->hasCredentials();
    }

    public function providerName(): string
    {
        return (string) config('ai.provider', 'openai');
    }
}