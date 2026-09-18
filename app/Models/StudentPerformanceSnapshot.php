<?php

namespace App\Models;

use App\Traits\BelongsToSchool;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StudentPerformanceSnapshot extends Model
{
    use BelongsToSchool;

    protected $fillable = [
        'school_id', 'student_id', 'academic_year_id', 'term_id',
        'average_percentage', 'attendance_percentage', 'homework_completed',
        'homework_total', 'behavior_positive_count', 'behavior_negative_count',
        'success_score', 'classification', 'class_rank', 'snapshot_data',
    ];

    protected $casts = [
        'average_percentage'    => 'decimal:2',
        'attendance_percentage' => 'decimal:2',
        'success_score'         => 'decimal:2',
        'snapshot_data'         => 'array',
    ];

    public function student(): BelongsTo { return $this->belongsTo(Student::class); }
    public function academicYear(): BelongsTo { return $this->belongsTo(AcademicYear::class); }
    public function term(): BelongsTo { return $this->belongsTo(AcademicTerm::class, 'term_id'); }
}
