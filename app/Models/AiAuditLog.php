<?php

namespace App\Models;

use App\Traits\BelongsToSchool;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AiAuditLog extends Model
{
    use BelongsToSchool;

    protected $table = 'ai_audit_logs';

    public $timestamps = false;

    protected $fillable = [
        'school_id', 'user_id', 'feature', 'action',
        'subject_type', 'subject_id', 'input_summary',
        'result_status', 'published_applied', 'metadata', 'performed_at',
    ];

    protected $casts = [
        'subject_id'        => 'integer',
        'published_applied' => 'boolean',
        'metadata'          => 'array',
        'performed_at'      => 'datetime',
    ];

    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class);
    }

    public function user()
    {
        return $this->belongsTo(\App\Models\User::class, 'user_id');
    }
}