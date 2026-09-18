<?php

namespace App\Models;

use App\Traits\BelongsToSchool;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserAuditLog extends Model
{
    use BelongsToSchool;

    protected $table = 'user_audit_logs';

    protected $fillable = [
        'school_id', 'user_id', 'performed_by', 'action', 'subject_type',
        'subject_id', 'description', 'metadata', 'ip_address', 'user_agent',
    ];

    protected $casts = [
        'metadata' => 'array',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function performer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'performed_by');
    }

    public static function log(
        int $schoolId,
        ?int $userId,
        ?int $performedBy,
        string $action,
        ?string $description = null,
        ?array $metadata = null
    ): static {
        return static::create([
            'school_id'    => $schoolId,
            'user_id'      => $userId,
            'performed_by' => $performedBy,
            'action'       => $action,
            'description'  => $description,
            'metadata'     => $metadata,
            'ip_address'   => request()->ip(),
            'user_agent'   => request()->userAgent(),
        ]);
    }
}
