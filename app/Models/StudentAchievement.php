<?php

namespace App\Models;

use App\Traits\BelongsToSchool;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StudentAchievement extends Model
{
    use BelongsToSchool;

    protected $fillable = [
        'school_id', 'student_id', 'academic_year_id', 'term_id', 'badge',
        'title', 'description', 'category', 'awarded_by', 'awarded_at',
    ];

    protected $casts = [
        'awarded_at' => 'date',
    ];

    public function student(): BelongsTo { return $this->belongsTo(Student::class); }
    public function awarder(): BelongsTo { return $this->belongsTo(Staff::class, 'awarded_by'); }
    public function academicYear(): BelongsTo { return $this->belongsTo(AcademicYear::class); }
    public function term(): BelongsTo { return $this->belongsTo(AcademicTerm::class, 'term_id'); }
}
