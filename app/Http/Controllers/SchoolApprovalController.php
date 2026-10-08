<?php

namespace App\Http\Controllers;

use App\Models\School;
use Inertia\Inertia;
use Inertia\Response;

class SchoolApprovalController extends Controller
{
    public function pending(): Response
    {
        $school = $this->currentSchool();

        if ($school && $school->isRegistrationApproved()) {
            return Inertia::location(route('dashboard'));
        }

        return Inertia::render('Approval/AwaitingApproval', [
            'school' => $school ? $this->schoolPayload($school) : null,
        ]);
    }

    public function rejected(): Response
    {
        $school = $this->currentSchool();

        if ($school && $school->isRegistrationApproved()) {
            return Inertia::location(route('dashboard'));
        }

        return Inertia::render('Approval/Rejected', [
            'school' => $school ? $this->schoolPayload($school) : null,
        ]);
    }

    private function currentSchool(): ?School
    {
        $user = auth()->user();
        if (! $user || ! $user->school_id) {
            return null;
        }

        return School::withoutGlobalScopes()->find($user->school_id);
    }

    private function schoolPayload(School $school): array
    {
        return [
            'id'                            => $school->id,
            'name'                          => $school->name,
            'short_name'                    => $school->short_name,
            'slug'                          => $school->slug,
            'registration_status'           => $school->registration_status,
            'registration_rejection_reason' => $school->registration_rejection_reason,
            'submitted_at'                  => $school->created_at?->toIso8601String(),
        ];
    }
}