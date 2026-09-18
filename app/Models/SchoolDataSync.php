<?php

namespace App\Models;

use App\Traits\BelongsToSchool;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SchoolDataSync extends Model
{
    use BelongsToSchool, HasFactory;

    protected $table = 'school_data_syncs';

    protected $fillable = [
        'school_id', 'sync_type', 'data_payload', 'status',
        'synced_at', 'synced_by', 'error_message', 'retry_count',
    ];

    protected $casts = [
        'data_payload' => 'array',
        'synced_at'    => 'datetime',
        'retry_count'  => 'integer',
    ];

    public function syncedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'synced_by');
    }

    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopeFailed($query)
    {
        return $query->where('status', 'failed');
    }
}
