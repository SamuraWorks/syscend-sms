<?php

namespace App\Models;

use App\Traits\BelongsToSchool;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ResultChangeRequest extends Model
{
    use BelongsToSchool;

    protected $fillable = [
        'school_id', 'mark_id', 'requested_by', 'original_marks',
        'requested_marks', 'reason', 'status', 'reviewed_by',
        'reviewer_notes', 'reviewed_at',
    ];

    protected $casts = [
        'original_marks' => 'decimal:2',
        'requested_marks' => 'decimal:2',
        'reviewed_at' => 'datetime',
    ];

    public function mark(): BelongsTo { return $this->belongsTo(Mark::class); }
    public function requester(): BelongsTo { return $this->belongsTo(User::class, 'requested_by'); }
    public function reviewer(): BelongsTo { return $this->belongsTo(User::class, 'reviewed_by'); }
}
