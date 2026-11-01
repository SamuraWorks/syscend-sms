<?php

namespace App\Services;

use App\Models\Guardian;

/**
 * Resolves a parent's stable identity from email + phone within one school,
 * so repeated rows (in-file or across imports) never duplicate a guardian.
 */
class ParentIdentityResolver
{
    /** @var array<int, Guardian> */
    private array $byEmail = [];

    /** @var array<int, Guardian> */
    private array $byPhone = [];

    public function __construct(private int $schoolId)
    {
        $guardians = Guardian::where('school_id', $this->schoolId)->get();

        foreach ($guardians as $guardian) {
            $this->index($guardian);
        }
    }

    /**
     * Returns the matching guardian id, or null when this is a brand-new parent.
     * Match priority: exact email+phone pair, then email alone, then phone alone.
     */
    public function resolve(string $email, string $normalizedPhone): ?int
    {
        if ($email !== '' && isset($this->byEmail[$email])) {
            return $this->byEmail[$email]->id;
        }

        if ($normalizedPhone !== '' && isset($this->byPhone[$normalizedPhone])) {
            return $this->byPhone[$normalizedPhone]->id;
        }

        return null;
    }

    public function remember(Guardian $guardian): void
    {
        $this->index($guardian);
    }

    private function index(Guardian $guardian): void
    {
        if (!empty($guardian->email)) {
            $this->byEmail[strtolower(trim($guardian->email))] = $guardian;
        }
        if (!empty($guardian->phone)) {
            $digits = preg_replace('/\D/', '', $guardian->phone) ?? '';
            if ($digits !== '') {
                $this->byPhone[$digits] = $guardian;
            }
        }
    }
}
