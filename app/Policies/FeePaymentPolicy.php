<?php

namespace App\Policies;

use App\Models\FeePayment;
use App\Models\Guardian;
use App\Models\User;
use App\Services\RoleRegistry;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;

class FeePaymentPolicy
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

    public function view(User $user, FeePayment $feePayment): bool
    {
        if ($user->hasRole([RoleRegistry::SCHOOL_ADMIN, RoleRegistry::PRINCIPAL, RoleRegistry::ACCOUNTANT])) {
            return true;
        }

        if ($user->hasRole(RoleRegistry::STUDENT)) {
            return $user->id === $feePayment->student->user_id;
        }

        if ($user->hasRole(RoleRegistry::PARENT)) {
            return Guardian::where('user_id', $user->id)
                ->first()?->students()
                ->where('id', $feePayment->student_id)
                ->exists() ?? false;
        }

        return false;
    }

    public function create(User $user): bool
    {
        return $user->hasRole([RoleRegistry::SCHOOL_ADMIN, RoleRegistry::ACCOUNTANT]);
    }

    public function update(User $user, FeePayment $feePayment): bool
    {
        return $user->hasRole([RoleRegistry::SCHOOL_ADMIN, RoleRegistry::ACCOUNTANT]);
    }

    public function delete(User $user, FeePayment $feePayment): bool
    {
        return $user->hasRole([RoleRegistry::SCHOOL_ADMIN]);
    }
}
