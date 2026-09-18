<?php

namespace App\Models;

use App\Traits\BelongsToSchool;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StudentAlert extends Model
{
    use BelongsToSchool;

    protected $fillable = [
        'school_id', 'student_id', 'type', 'severity', 'title', 'message',
        'data', 'is_read', 'assigned_to', 'resolved_by', 'resolution', 'resolved_at',
    ];

    protected $casts = [
        'data'        => 'array',
        'is_read'     => 'boolean',
        'resolved_at' => 'datetime',
    ];

    public function student(): BelongsTo { return $this->belongsTo(Student::class); }
    public function assignee(): BelongsTo { return $this->belongsTo(Staff::class, 'assigned_to'); }
    public function resolver(): BelongsTo { return $this->belongsTo(Staff::class, 'resolved_by'); }
}
