<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SchoolSetupProgress extends Model
{
    protected $fillable = ['school_id', 'step', 'completed', 'data'];
    protected $casts = [
        'completed' => 'boolean',
        'data' => 'array',
    ];

    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class);
    }

    public static function markComplete(int $schoolId, string $step, ?array $data = null): void
    {
        static::updateOrCreate(
            ['school_id' => $schoolId, 'step' => $step],
            ['completed' => true, 'data' => $data]
        );
    }

    public static function getCompletedSteps(int $schoolId): array
    {
        return static::where('school_id', $schoolId)
            ->where('completed', true)
            ->pluck('step')
            ->toArray();
    }

    public static function allRequiredDone(int $schoolId): bool
    {
        $required = ['profile', 'academic_structure', 'academic_year', 'assessment', 'grading'];
        $completed = static::getCompletedSteps($schoolId);
        return empty(array_diff($required, $completed));
    }
}
