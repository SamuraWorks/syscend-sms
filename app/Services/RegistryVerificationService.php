<?php

namespace App\Services;

use App\Models\{Student, Guardian, Staff};
use Illuminate\Support\Facades\{DB, Log};

class RegistryVerificationService
{
    private const GENERIC_FAILURE = 'We could not verify your details. Please check your information or contact your school administrator.';

    /**
     * Normalize a name for comparison: trim, lowercase, collapse whitespace, Unicode normalize.
     */
    public static function normalizeName(string $name): string
    {
        $normalized = trim(mb_strtolower($name, 'UTF-8'));
        $normalized = preg_replace('/\s+/u', ' ', $normalized);
        $normalized = preg_replace('/[^\p{L}\p{M}\s]/u', '', $normalized);

        if (function_exists('normalizer_normalize')) {
            $normalized = normalizer_normalize($normalized, \Normalizer::FORM_C) ?? $normalized;
        }

        return $normalized;
    }

    /**
     * Check if two names match after normalization.
     * Returns true only if both are non-empty and normalized forms match.
     */
    private static function namesMatch(string $a, string $b): bool
    {
        $a = self::normalizeName($a);
        $b = self::normalizeName($b);

        if ($a === '' || $b === '') {
            return false;
        }

        return $a === $b;
    }

    /**
     * Check if an email matches (case-insensitive).
     */
    private static function emailsMatch(?string $registryEmail, ?string $providedEmail): bool
    {
        if (empty($registryEmail) || empty($providedEmail)) {
            return false;
        }

        return mb_strtolower(trim($registryEmail)) === mb_strtolower(trim($providedEmail));
    }

    /**
     * Verify a student by student_id and name within a specific school.
     * Accepts a single full name or multiple candidate orderings (e.g.
     * "Other Names Surname" and "Surname Other Names"); matches if any matches.
     * Email is used as an additional matching factor if provided.
     *
     * @param int       $schoolId
     * @param string    $studentId   The school's student_id or admission_no field
     * @param string|array $fullName Full name for verification (string or candidate list)
     * @param string|null $email     Optional email for additional verification
     * @return array{success: bool, student?: Student, message: string}
     */
    public function verifyStudent(int $schoolId, string $studentId, string|array $fullName, ?string $email = null): array
    {
        $student = Student::where('school_id', $schoolId)
            ->where('status', 'active')
            ->where(function ($q) use ($studentId) {
                $q->where('student_id', $studentId)
                  ->orWhere('admission_no', $studentId);
            })
            ->first();

        if (!$student) {
            Log::info('Student verification failed: no record', ['school_id' => $schoolId, 'student_id' => $studentId]);
            return ['success' => false, 'message' => self::GENERIC_FAILURE];
        }

        $candidates = is_array($fullName) ? $fullName : [$fullName];
        $matched = false;
        foreach ($candidates as $candidate) {
            if (is_string($candidate) && self::namesMatch($candidate, $student->full_name)) {
                $matched = true;
                break;
            }
        }

        if (!$matched) {
            Log::info('Student verification failed: name mismatch', ['school_id' => $schoolId, 'student_id' => $studentId]);
            return ['success' => false, 'message' => self::GENERIC_FAILURE];
        }

        // If the registry has an email and the user provided one, verify they match
        if (!empty($student->email) && !empty($email)) {
            if (!self::emailsMatch($student->email, $email)) {
                Log::info('Student verification failed: email mismatch', ['school_id' => $schoolId, 'student_id' => $studentId]);
                return ['success' => false, 'message' => self::GENERIC_FAILURE];
            }
        }

        // If registry has an email but user didn't provide one, require it
        if (!empty($student->email) && empty($email)) {
            return [
                'success' => false,
                'message' => 'Your school record has an email on file. Please provide it to verify your identity.',
                'requires_email' => true,
            ];
        }

        if ($student->claimed_by !== null || $student->user_id !== null) {
            return ['success' => false, 'message' => 'This student record has already been registered. Please contact your school administrator if you need assistance.'];
        }

        return [
            'success' => true,
            'student' => $student,
            'message' => 'Your school record has been found. Please create your account password.',
        ];
    }

    /**
     * Check if a phone number matches after digit normalization.
     * Tolerates local vs international formatting (e.g. 076123456 vs +23276123456)
     * by also accepting a suffix match of at least 7 digits.
     */
    private static function phonesMatch(?string $registryPhone, ?string $providedPhone): bool
    {
        if (empty($registryPhone) || empty($providedPhone)) {
            return false;
        }

        $a = preg_replace('/\D/', '', $registryPhone) ?? '';
        $b = preg_replace('/\D/', '', $providedPhone) ?? '';

        if ($a === '' || $b === '') {
            return false;
        }

        if ($a === $b) {
            return true;
        }

        $variants = static function (string $n): array {
            $trimmed = ltrim($n, '0');
            return array_values(array_unique([$n, $trimmed !== '' ? $trimmed : $n]));
        };

        foreach ($variants($a) as $va) {
            foreach ($variants($b) as $vb) {
                if ($va === $vb) {
                    return true;
                }
                $shorter = strlen($va) <= strlen($vb) ? $va : $vb;
                $longer = strlen($va) <= strlen($vb) ? $vb : $va;
                if (strlen($shorter) >= 7 && str_ends_with($longer, $shorter)) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * Verify a parent/guardian using their child's identity, per the school registry:
     * the parent must supply their email, their phone, the child's Student ID
     * (or admission number), and the child's registered surname.
     * All supplied details must match an existing parent-student relationship.
     * No Parent ID exists anywhere in this flow.
     *
     * @return array{success: bool, guardian?: Guardian, message: string, children?: array, already_registered?: bool}
     */
    public function verifyParent(int $schoolId, string $studentId, string $surname, string $email, ?string $phone = null): array
    {
        if (empty($email)) {
            return ['success' => false, 'message' => self::GENERIC_FAILURE];
        }

        // Step 1: locate the child inside this school only.
        $student = Student::where('school_id', $schoolId)
            ->where('status', 'active')
            ->where(function ($q) use ($studentId) {
                $q->where('student_id', $studentId)
                  ->orWhere('admission_no', $studentId);
            })
            ->first();

        if (!$student) {
            Log::info('Parent verification failed: child not found', ['school_id' => $schoolId]);
            return ['success' => false, 'message' => self::GENERIC_FAILURE];
        }

        // Step 2: the child's surname must match.
        if (!self::namesMatch($surname, $student->last_name)) {
            Log::info('Parent verification failed: surname mismatch', ['school_id' => $schoolId, 'student_id' => $studentId]);
            return ['success' => false, 'message' => self::GENERIC_FAILURE];
        }

        // Step 3: gather every guardian linked to this child (pivot first, legacy column as fallback).
        $linkedGuardians = Guardian::where('school_id', $schoolId)
            ->where(function ($q) use ($student) {
                $q->whereIn('id', DB::table('guardian_student')->where('student_id', $student->id)->select('guardian_id'))
                  ->orWhere('id', $student->guardian_id);
            })
            ->get();

        if ($linkedGuardians->isEmpty()) {
            Log::info('Parent verification failed: no guardian linked to child', ['school_id' => $schoolId, 'student_id' => $studentId]);
            return ['success' => false, 'message' => self::GENERIC_FAILURE];
        }


        // Step 4: among the child's guardians, exactly one must match the supplied
        // contact details. Require both email and phone to be provided by the
        // registrant and to match an existing guardian record for this school.
        if (empty($email) || empty($phone)) {
            Log::info('Parent verification failed: missing contact details', ['school_id' => $schoolId]);
            return ['success' => false, 'message' => self::GENERIC_FAILURE];
        }

        $guardian = $linkedGuardians->first(function (Guardian $g) use ($email, $phone) {
            $emailOk = !empty($g->email) && self::emailsMatch($g->email, $email);
            $phoneOk = !empty($g->phone) && self::phonesMatch($g->phone, $phone);

            return $emailOk && $phoneOk;
        });

        if (!$guardian) {
            Log::info('Parent verification failed: contact details do not match any linked guardian', ['school_id' => $schoolId, 'student_id' => $studentId]);
            return ['success' => false, 'message' => self::GENERIC_FAILURE];
        }

        $children = $this->discoverChildren($guardian);

        if ($guardian->claimed_by !== null || $guardian->user_id !== null) {
            return [
                'success'            => true,
                'guardian'           => $guardian,
                'children'           => $children,
                'already_registered' => true,
                'message'            => 'This parent record already has an account. Please sign in instead.',
            ];
        }

        return [
            'success'  => true,
            'guardian' => $guardian,
            'children' => $children,
            'message'  => 'Your family records have been found. Please create your account password.',
        ];
    }

    /**
     * Discover all active children belonging to a guardian across both the
     * many-to-many pivot and the legacy guardian_id column, deduplicated.
     */
    public function discoverChildren(Guardian $guardian): array
    {
        $fromPivot = $guardian->children()->where('students.status', 'active')->get();
        $fromLegacy = $guardian->students()->where('status', 'active')->get();

        return $fromPivot->merge($fromLegacy)
            ->unique('id')
            ->map(fn ($s) => [
                'name'   => $s->full_name,
                'class'  => $s->schoolClass->name ?? '',
                'stream' => $s->section->name ?? '',
            ])
            ->values()
            ->all();
    }

    /**
     * Verify a staff/teacher by emp_id and full name within a specific school.
     *
     * @param int       $schoolId
     * @param string    $empId       The staff's emp_id field
     * @param string    $fullName    Full name for verification
     * @param string|null $email     Optional email for additional verification
     * @return array{success: bool, staff?: Staff, message: string}
     */
    public function verifyStaff(int $schoolId, string $empId, string $fullName, ?string $email = null): array
    {
        $staff = Staff::where('school_id', $schoolId)
            ->where('emp_id', $empId)
            ->where('status', 'active')
            ->first();

        if (!$staff) {
            Log::info('Staff verification failed: no record', ['school_id' => $schoolId, 'emp_id' => $empId]);
            return ['success' => false, 'message' => self::GENERIC_FAILURE];
        }

        if (!self::namesMatch($fullName, $staff->full_name)) {
            Log::info('Staff verification failed: name mismatch', ['school_id' => $schoolId, 'emp_id' => $empId]);
            return ['success' => false, 'message' => self::GENERIC_FAILURE];
        }

        // Email matching if both present
        if (!empty($staff->email) && !empty($email)) {
            if (!self::emailsMatch($staff->email, $email)) {
                Log::info('Staff verification failed: email mismatch', ['school_id' => $schoolId, 'emp_id' => $empId]);
                return ['success' => false, 'message' => self::GENERIC_FAILURE];
            }
        }

        if (!empty($staff->email) && empty($email)) {
            return [
                'success' => false,
                'message' => 'Your school record has an email on file. Please provide it to verify your identity.',
                'requires_email' => true,
            ];
        }

        if ($staff->claimed_by !== null || $staff->user_id !== null) {
            return ['success' => false, 'message' => 'This staff record has already been registered. Please contact your school administrator if you need assistance.'];
        }

        return [
            'success' => true,
            'staff'   => $staff,
            'message' => 'Your school record has been found. Please create your account password.',
        ];
    }

    /**
     * Claim a registry record for a user within a transaction with row-level locking.
     * Prevents race conditions where two people try to claim the same record simultaneously.
     *
     * @return array{success: bool, message: string}
     */
    public function claimRecordWithLock(object $record, int $userId, string $modelClass): array
    {
        return DB::transaction(function () use ($record, $userId, $modelClass) {
            $fresh = $modelClass::where('id', $record->id)
                ->lockForUpdate()
                ->first();

            if (!$fresh) {
                return ['success' => false, 'message' => 'Record not found.'];
            }

            if ($fresh->claimed_by !== null || $fresh->user_id !== null) {
                return ['success' => false, 'message' => 'This record has already been registered by another user.'];
            }

            $fresh->update([
                'claimed_by'          => $userId,
                'claimed_at'          => now(),
                'registration_status' => 'registered',
            ]);

            return ['success' => true, 'message' => 'Record claimed successfully.'];
        });
    }

    /**
     * Claim a registry record for a user. Must be called within a transaction.
     */
    public function claimRecord(object $record, int $userId): void
    {
        $record->update([
            'claimed_by'          => $userId,
            'claimed_at'          => now(),
            'registration_status' => 'registered',
        ]);
    }
}
