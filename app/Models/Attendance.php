<?php

namespace App\Models;

use App\Traits\{BelongsToSchool, HasAuditLog};
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Attendance extends Model
{
    use BelongsToSchool, HasAuditLog;

    protected $fillable = [
        'school_id', 'academic_year_id', 'date',
        'attendable_type', 'attendable_id', 'subject_id',
        'status', 'remarks',
        'approved_at', 'approved_by',
        'session_id', 'status_draft', 'submitted_by', 'submitted_at',
    ];

    protected $casts = [
        'date'         => 'date',
        'submitted_at' => 'datetime',
        'approved_at'  => 'datetime',
    ];

    public function attendable(): MorphTo
    {
        return $this->morphTo();
    }

    public function subject(): BelongsTo
    {
        return $this->belongsTo(Subject::class);
    }

    public function academicYear(): BelongsTo
    {
        return $this->belongsTo(AcademicYear::class);
    }

    public function session(): BelongsTo
    {
        return $this->belongsTo(AttendanceSession::class, 'session_id');
    }

    public function submittedByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'submitted_by');
    }

    public function approvedByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function corrections(): HasMany
    {
        return $this->hasMany(AttendanceCorrection::class, 'attendance_id');
    }

    public function isSubmitted(): bool
    {
        return in_array($this->status_draft, ['submitted', 'approved'], true);
    }

    public function isApproved(): bool
    {
        return $this->status_draft === 'approved' || $this->approved_at !== null;
    }

    public function isEditable(): bool
    {
        return !$this->isSubmitted();
    }

    public function isSubjectLevel(): bool
    {
        return $this->subject_id !== null;
    }

    public function isClassLevel(): bool
    {
        return $this->subject_id === null;
    }

    public function scopeForSubject($query, int $subjectId)
    {
        return $query->where('subject_id', $subjectId);
    }

    public function scopeClassLevel($query)
    {
        return $query->whereNull('subject_id');
    }

    public function scopeSubjectLevel($query)
    {
        return $query->whereNotNull('subject_id');
    }
}
