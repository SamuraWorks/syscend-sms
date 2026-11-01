<?php

namespace App\Services;

use App\Models\Guardian;
use App\Models\Student;
use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

/**
 * Resolves the students that belong to a parent user.
 *
 * A parent can be stored as several `guardian` rows — one per child — because
 * students are admitted individually (each admission creates its own guardian
 * row). One parent account must still see every one of their children, so this
 * resolver groups the guardian rows that represent the same person and unions
 * their children across both link sources (the guardian_student pivot and the
 * legacy students.guardian_id column).
 */
class FamilyResolver
{
    /**
     * All guardian rows linked to this user within their school.
     *
     * @return \Illuminate\Support\Collection<int, Guardian>
     */
    public function guardiansForUser(User $user): \Illuminate\Support\Collection
    {
        if ($user->school_id === null) {
            return collect();
        }

        return Guardian::where('school_id', $user->school_id)
            ->where('user_id', $user->id)
            ->get();
    }

    /**
     * Every guardian row in the school that belongs to the same parent identity
     * as the given guardian. Rows count as the same parent when their emails
     * match, or — when either email is missing — when their phone numbers match.
     * This is what lets one account cover every child of a parent.
     *
     * @return \Illuminate\Support\Collection<int, Guardian>
     */
    public function guardianGroup(Guardian $guardian): \Illuminate\Support\Collection
    {
        if ($guardian->school_id === null) {
            return collect([$guardian]);
        }

        return Guardian::where('school_id', $guardian->school_id)
            ->get()
            ->filter(fn (Guardian $g) => $this->sameParent($guardian, $g))
            ->values();
    }

    public function sameParent(Guardian $a, Guardian $b): bool
    {
        if ($a->id === $b->id) {
            return true;
        }

        $emailA = trim((string) $a->email);
        $emailB = trim((string) $b->email);

        if ($emailA !== '' && $emailB !== '') {
            return RegistryVerificationService::emailsMatch($emailA, $emailB);
        }

        return RegistryVerificationService::phonesMatch($a->phone, $b->phone);
    }

    /**
     * Union of all active children across the given guardian rows, covering
     * both link sources and deduplicated by student id.
     *
     * @param  \Illuminate\Support\Collection<int, Guardian>  $guardians
     * @return \Illuminate\Support\Collection<int, \App\Models\Student>
     */
    public function childrenForGuardians(\Illuminate\Support\Collection $guardians): \Illuminate\Support\Collection
    {
        $ids = $guardians->pluck('id')->filter()->all();

        if (empty($ids)) {
            return collect();
        }

        $viaPivot = Student::where('status', 'active')
            ->whereIn('id', DB::table('guardian_student')->whereIn('guardian_id', $ids)->select('student_id'))
            ->with('schoolClass:id,name', 'section:id,name')
            ->get();

        $viaLegacy = Student::where('status', 'active')
            ->whereIn('guardian_id', $ids)
            ->with('schoolClass:id,name', 'section:id,name')
            ->get();

        return $viaPivot->merge($viaLegacy)->unique('id')->values();
    }

    /**
     * Union of all active children for a user, across every guardian row linked
     * to their account.
     *
     * @return \Illuminate\Support\Collection<int, \App\Models\Student>
     */
    public function childrenForUser(User $user): \Illuminate\Support\Collection
    {
        return $this->childrenForGuardians($this->guardiansForUser($user));
    }
}
