<?php

namespace App\Models;

use App\Traits\{BelongsToSchool, HasAuditLog};
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Mark extends Model
{
    use BelongsToSchool, HasAuditLog;

    protected $fillable = [
        'school_id', 'exam_id', 'student_id', 'subject_id', 'subject_offering_id',
        'marks_obtained', 'grade', 'gpa', 'is_absent', 'remarks',
        'raw_score', 'weighted_score', 'assessment_type',
        'assessment_type_slug', 'component_marks', 'component_max',
        'status', 'submitted_by', 'submitted_at',
    ];

    protected $casts = [
        'marks_obtained'  => 'decimal:2',
        'gpa'             => 'decimal:2',
        'is_absent'       => 'boolean',
        'raw_score'       => 'decimal:2',
        'weighted_score'  => 'decimal:2',
        'component_marks' => 'decimal:2',
        'component_max'   => 'decimal:2',
        'submitted_at'    => 'datetime',
    ];

    public function exam(): BelongsTo             { return $this->belongsTo(Exam::class); }
    public function student(): BelongsTo          { return $this->belongsTo(Student::class); }
    public function subject(): BelongsTo          { return $this->belongsTo(Subject::class); }
    public function subjectOffering(): BelongsTo  { return $this->belongsTo(SubjectOffering::class); }

    public function scopeForSubject($query, int $subjectId)
    {
        return $query->where('subject_id', $subjectId);
    }

    public function scopeForOffering($query, int $offeringId)
    {
        return $query->where('subject_offering_id', $offeringId);
    }

    public function scopeForExam($query, int $examId)
    {
        return $query->where('exam_id', $examId);
    }
}
