<?php

namespace App\Scopes;

use App\Services\RoleRegistry;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Scope;

class SchoolScope implements Scope
{
    public function apply(Builder $builder, Model $model): void
    {
        if (!auth()->check()) {
            return;
        }

        $user = auth()->user();

        // Platform-level roles see everything — skip the scope
        if ($user->hasAnyRole(RoleRegistry::PORTAL_ROLES)) {
            return;
        }

        // School-scoped users: filter by their school_id
        if ($user->school_id) {
            $builder->where($model->getTable() . '.school_id', $user->school_id);
        }
    }
}
