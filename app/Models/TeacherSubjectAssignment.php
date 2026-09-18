<?php

namespace App\Models;

use App\Traits\BelongsToSchool;
use Illuminate\Database\Eloquent\{Model, SoftDeletes};
use Illuminate\Database\Eloquent\Relations\{BelongsTo};

class TeacherSubjectAssignment extends Model
{
    use BelongsToSchool, SoftDeletes;

    protected $fillable = [
        'school_id', 'academic_year_id', 'staff_id', 'subject_offering_id',
        'assigned_by', 'is_active',
    ];

    protected function casts(): array
    {
        return ['is_active' => 'boolean'];
    }

    public function staff(): BelongsTo { return $this->belongsTo(Staff::class); }
    public function subjectOffering(): BelongsTo { return $this->belongsTo(SubjectOffering::class); }
    public function academicYear(): BelongsTo { return $this->belongsTo(AcademicYear::class); }
    public function assignedBy(): BelongsTo { return $this->belongsTo(User::class, 'assigned_by'); }

    public function scopeForStaff($query, int $staffId) { return $query->where('staff_id', $staffId); }
    public function scopeForYear($query, int $yearId) { return $query->where('academic_year_id', $yearId); }
    public function scopeActive($query) { return $query->where('is_active', true); }
}
