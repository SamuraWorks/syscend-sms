<?php

namespace App\Models;

use App\Traits\BelongsToSchool;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StudentGoal extends Model
{
    use BelongsToSchool;

    protected $fillable = [
        'school_id', 'student_id', 'academic_year_id', 'term_id', 'category',
        'title', 'description', 'target_value', 'start_date', 'target_date',
        'status', 'progress', 'notes',
    ];

    protected $casts = [
        'start_date'  => 'date',
        'target_date' => 'date',
        'progress'    => 'decimal:2',
    ];

    public function student(): BelongsTo { return $this->belongsTo(Student::class); }
    public function academicYear(): BelongsTo { return $this->belongsTo(AcademicYear::class); }
    public function term(): BelongsTo { return $this->belongsTo(AcademicTerm::class, 'term_id'); }
}
