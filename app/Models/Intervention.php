<?php

namespace App\Models;

use App\Traits\BelongsToSchool;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Intervention extends Model
{
    use BelongsToSchool;

    protected $fillable = [
        'school_id', 'student_id', 'academic_year_id', 'term_id', 'type',
        'priority', 'status', 'title', 'description', 'assigned_to',
        'counsellor_id', 'recommended_action', 'start_date', 'target_date',
        'completed_at', 'outcome', 'created_by',
    ];

    protected $casts = [
        'start_date'   => 'date',
        'target_date'  => 'date',
        'completed_at' => 'date',
    ];

    public function student(): BelongsTo { return $this->belongsTo(Student::class); }
    public function assignee(): BelongsTo { return $this->belongsTo(Staff::class, 'assigned_to'); }
    public function counsellor(): BelongsTo { return $this->belongsTo(Staff::class, 'counsellor_id'); }
    public function creator(): BelongsTo { return $this->belongsTo(User::class, 'created_by'); }
    public function notes(): HasMany { return $this->hasMany(InterventionNote::class); }
    public function academicYear(): BelongsTo { return $this->belongsTo(AcademicYear::class); }
    public function term(): BelongsTo { return $this->belongsTo(AcademicTerm::class, 'term_id'); }
}
