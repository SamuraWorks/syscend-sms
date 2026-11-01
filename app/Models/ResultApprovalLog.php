<?php

namespace App\Models;

use App\Traits\BelongsToSchool;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\MorphTo;

class ResultApprovalLog extends Model
{
    use BelongsToSchool;

    protected $fillable = [
        'school_id', 'approvable_type', 'approvable_id', 'user_id',
        'action', 'notes', 'previous_state', 'new_state',
    ];

    protected $casts = [
        'previous_state' => 'array',
        'new_state'      => 'array',
    ];

    public function approvable(): MorphTo
    {
        return $this->morphTo();
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Log an approval action.
     */
    public static function log(
        int $schoolId,
        Model $approvable,
        int $userId,
        string $action,
        ?string $notes = null,
        ?array $previousState = null,
        ?array $newState = null
    ): self {
        return static::create([
            'school_id'       => $schoolId,
            'approvable_type' => get_class($approvable),
            'approvable_id'   => $approvable->id,
            'user_id'         => $userId,
            'action'          => $action,
            'notes'           => $notes,
            'previous_state'  => $previousState,
            'new_state'       => $newState,
        ]);
    }
}
