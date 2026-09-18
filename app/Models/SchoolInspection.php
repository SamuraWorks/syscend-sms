<?php

namespace App\Models;

use App\Traits\BelongsToSchool;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class SchoolInspection extends Model
{
    use BelongsToSchool, HasFactory, SoftDeletes;

    protected $fillable = [
        'school_id', 'inspector_id', 'district_id', 'inspection_type', 'status',
        'scheduled_date', 'completed_date', 'findings', 'score',
        'compliance_status', 'improvement_required', 'recommendations',
        'next_inspection_date', 'attachments',
    ];

    protected $casts = [
        'scheduled_date'      => 'date',
        'completed_date'      => 'date',
        'next_inspection_date' => 'date',
        'score'               => 'decimal:1',
        'improvement_required' => 'boolean',
        'attachments'         => 'array',
    ];

    public function inspector(): BelongsTo
    {
        return $this->belongsTo(User::class, 'inspector_id');
    }

    public function district(): BelongsTo
    {
        return $this->belongsTo(District::class);
    }

    public function scopeScheduled($query)
    {
        return $query->where('status', 'scheduled');
    }

    public function scopeCompleted($query)
    {
        return $query->where('status', 'completed');
    }
}
