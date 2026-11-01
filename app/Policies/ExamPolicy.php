<?php

namespace App\Policies;

use App\Models\Exam;
use App\Models\User;
use App\Services\RoleRegistry;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;

class ExamPolicy
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

    public function view(User $user, Exam $exam): bool
    {
        return true;
    }

    public function create(User $user): bool
    {
        return $user->hasRole([RoleRegistry::SCHOOL_ADMIN, RoleRegistry::PRINCIPAL]);
    }

    public function update(User $user, Exam $exam): bool
    {
        return $user->hasRole([RoleRegistry::SCHOOL_ADMIN, RoleRegistry::PRINCIPAL]);
    }

    public function delete(User $user, Exam $exam): bool
    {
        return $user->hasRole([RoleRegistry::SCHOOL_ADMIN, RoleRegistry::PRINCIPAL]);
    }
}
