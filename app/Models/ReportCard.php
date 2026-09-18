<?php

namespace App\Models;

use App\Traits\{BelongsToSchool, HasAuditLog};
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class ReportCard extends Model
{
    use BelongsToSchool, HasAuditLog, SoftDeletes;

    protected $fillable = [
        'school_id', 'student_id', 'academic_year_id', 'term_id',
        'class_id', 'section_id',
        'total_marks', 'obtained_marks', 'percentage', 'grade', 'gpa', 'rank',
        'total_school_days', 'days_present', 'days_absent', 'days_late',
        'promotion_status',
        'teacher_comment', 'form_master_comment', 'principal_comment',
        'subject_data', 'extra_data',
        'pdf_path', 'status',
        'submitted_by', 'submitted_at', 'approved_by', 'approved_at',
        'published_at', 'assessment_config_id',
    ];

    protected $casts = [
        'total_marks'      => 'decimal:2',
        'obtained_marks'   => 'decimal:2',
        'percentage'       => 'decimal:2',
        'gpa'              => 'decimal:2',
        'subject_data'     => 'array',
        'extra_data'       => 'array',
        'total_school_days' => 'integer',
        'days_present'     => 'integer',
        'days_absent'      => 'integer',
        'days_late'        => 'integer',
        'submitted_at'     => 'datetime',
        'approved_at'      => 'datetime',
        'published_at'     => 'datetime',
    ];

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    public function academicYear(): BelongsTo
    {
        return $this->belongsTo(AcademicYear::class);
    }

    public function term(): BelongsTo
    {
        return $this->belongsTo(AcademicTerm::class, 'term_id');
    }

    public function schoolClass(): BelongsTo
    {
        return $this->belongsTo(SchoolClass::class, 'class_id');
    }

    public function section(): BelongsTo
    {
        return $this->belongsTo(Section::class);
    }

    public function assessmentConfig(): BelongsTo
    {
        return $this->belongsTo(SchoolAssessmentConfig::class, 'assessment_config_id');
    }

    public function approvalLogs(): HasMany
    {
        return $this->hasMany(ResultApprovalLog::class, 'approvable_id')
            ->where('approvable_type', self::class);
    }

    public function getAttendancePercentageAttribute(): float
    {
        if ($this->total_school_days === 0) return 0;
        return round(($this->days_present / $this->total_school_days) * 100, 1);
    }

    public function isDraft(): bool { return $this->status === 'draft'; }
    public function isSubmitted(): bool { return $this->status === 'submitted'; }
    public function isApproved(): bool { return $this->status === 'approved'; }
    public function isPublished(): bool { return $this->status === 'published'; }
}
