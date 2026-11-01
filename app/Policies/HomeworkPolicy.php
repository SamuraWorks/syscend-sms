<?php

namespace App\Policies;

use App\Models\Homework;
use App\Models\User;
use App\Services\RoleRegistry;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;

class HomeworkPolicy
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

    public function view(User $user, Homework $homework): bool
    {
        return true;
    }

    public function create(User $user): bool
    {
        if ($user->hasRole([RoleRegistry::SCHOOL_ADMIN])) {
            return true;
        }

        if ($user->hasRole(RoleRegistry::TEACHER)) {
            return true;
        }

        return false;
    }

    public function update(User $user, Homework $homework): bool
    {
        if ($user->hasRole([RoleRegistry::SCHOOL_ADMIN])) {
            return true;
        }

        if ($user->hasRole(RoleRegistry::TEACHER)) {
            return $user->id === $homework->teacher->user_id;
        }

        return false;
    }

    public function delete(User $user, Homework $homework): bool
    {
        if ($user->hasRole([RoleRegistry::SCHOOL_ADMIN])) {
            return true;
        }

        if ($user->hasRole(RoleRegistry::TEACHER)) {
            return $user->id === $homework->teacher->user_id;
        }

        return false;
    }
}
