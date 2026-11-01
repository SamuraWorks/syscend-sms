<?php

namespace App\Models;

use App\Traits\BelongsToSchool;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StudentBehavior extends Model
{
    use BelongsToSchool;

    protected $fillable = [
        'school_id', 'student_id', 'academic_year_id', 'term_id', 'class_id',
        'reported_by', 'category', 'type', 'description', 'severity',
        'action_taken', 'occurred_at', 'parent_notified',
    ];

    protected $casts = [
        'occurred_at'     => 'date',
        'parent_notified' => 'boolean',
    ];

    public function student(): BelongsTo { return $this->belongsTo(Student::class); }
    public function reporter(): BelongsTo { return $this->belongsTo(Staff::class, 'reported_by'); }
    public function academicYear(): BelongsTo { return $this->belongsTo(AcademicYear::class); }
    public function term(): BelongsTo { return $this->belongsTo(AcademicTerm::class, 'term_id'); }
    public function schoolClass(): BelongsTo { return $this->belongsTo(SchoolClass::class, 'class_id'); }
}
