<?php

namespace App\Models;

use App\Traits\{BelongsToSchool, HasAuditLog};
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class NationalExamination extends Model
{
    use BelongsToSchool, HasAuditLog, SoftDeletes;

    protected $fillable = [
        'school_id', 'student_id', 'academic_year_id', 'term_id',
        'exam_type', 'index_number', 'exam_year',
        'total_score', 'overall_grade', 'overall_result',
        'subject_scores', 'status', 'notes',
    ];

    protected $casts = [
        'total_score'     => 'decimal:2',
        'subject_scores'  => 'array',
        'exam_year'       => 'integer',
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

    public function scopeForType($query, string $type)
    {
        return $query->where('exam_type', $type);
    }

    public function getExamTypeLabelAttribute(): string
    {
        return match($this->exam_type) {
            'npse'  => 'National Primary School Examination',
            'bece'  => 'Basic Education Certificate Examination',
            'wassce' => 'West African Senior School Certificate Examination',
            default => strtoupper($this->exam_type),
        };
    }
}
