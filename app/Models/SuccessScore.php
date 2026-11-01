<?php

namespace App\Models;

use App\Traits\BelongsToSchool;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SuccessScore extends Model
{
    use BelongsToSchool;

    protected $fillable = [
        'school_id', 'student_id', 'academic_year_id', 'term_id', 'class_id',
        'academic_score', 'attendance_score', 'homework_score', 'behavior_score',
        'participation_score', 'total_score', 'classification', 'class_rank',
        'school_rank', 'total_students_in_class', 'total_students_in_school',
        'subject_scores', 'metadata',
    ];

    protected $casts = [
        'academic_score'   => 'decimal:2',
        'attendance_score' => 'decimal:2',
        'homework_score'   => 'decimal:2',
        'behavior_score'   => 'decimal:2',
        'participation_score' => 'decimal:2',
        'total_score'      => 'decimal:2',
        'subject_scores'   => 'array',
        'metadata'         => 'array',
    ];

    public function student(): BelongsTo { return $this->belongsTo(Student::class); }
    public function academicYear(): BelongsTo { return $this->belongsTo(AcademicYear::class); }
    public function term(): BelongsTo { return $this->belongsTo(AcademicTerm::class, 'term_id'); }
    public function schoolClass(): BelongsTo { return $this->belongsTo(SchoolClass::class, 'class_id'); }

    public function getClassificationColorAttribute(): string
    {
        return match ($this->classification) {
            'excellent'        => 'green',
            'good'             => 'blue',
            'needs_monitoring' => 'yellow',
            'needs_support'    => 'orange',
            'critical'         => 'red',
            default            => 'gray',
        };
    }

    public function getClassificationLabelAttribute(): string
    {
        return match ($this->classification) {
            'excellent'        => 'Excellent',
            'good'             => 'Good',
            'needs_monitoring' => 'Needs Monitoring',
            'needs_support'    => 'Needs Support',
            'critical'         => 'Critical',
            default            => 'Unclassified',
        };
    }
}
