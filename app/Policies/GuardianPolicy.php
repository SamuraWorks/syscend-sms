<?php

namespace App\Policies;

use App\Models\Guardian;
use App\Models\User;
use App\Services\RoleRegistry;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;

class GuardianPolicy
{
    use AuthorizesRequests;

    public function before(User $user, string $ability): ?bool
    {
        if ($user->hasRole(RoleRegistry::SUPER_ADMIN)) {
            return true;
        }

        return null;
    }

    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Guardian $guardian): bool
    {
        if ($user->hasRole([RoleRegistry::SCHOOL_ADMIN, RoleRegistry::PRINCIPAL])) {
            return true;
        }

        if ($user->hasRole(RoleRegistry::PARENT)) {
            return $user->id === $guardian->user_id;
        }

        return false;
    }

    public function create(User $user): bool
    {
        return $user->hasRole([RoleRegistry::SCHOOL_ADMIN, RoleRegistry::PRINCIPAL]);
    }

    public function update(User $user, Guardian $guardian): bool
    {
        return $user->hasRole([RoleRegistry::SCHOOL_ADMIN, RoleRegistry::PRINCIPAL]);
    }

    public function delete(User $user, Guardian $guardian): bool
    {
        return $user->hasRole([RoleRegistry::SCHOOL_ADMIN, RoleRegistry::PRINCIPAL]);
    }
}
