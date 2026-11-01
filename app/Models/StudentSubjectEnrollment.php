<?php

namespace App\Models;

use App\Traits\BelongsToSchool;
use Illuminate\Database\Eloquent\{Model, SoftDeletes};
use Illuminate\Database\Eloquent\Relations\{BelongsTo};

class StudentSubjectEnrollment extends Model
{
    use BelongsToSchool, SoftDeletes;

    protected $fillable = [
        'school_id', 'academic_year_id', 'student_id', 'subject_offering_id',
        'enrolled_by', 'status', 'enrolled_at',
    ];

    protected function casts(): array
    {
        return ['enrolled_at' => 'datetime'];
    }

    public function student(): BelongsTo { return $this->belongsTo(Student::class); }
    public function subjectOffering(): BelongsTo { return $this->belongsTo(SubjectOffering::class); }
    public function academicYear(): BelongsTo { return $this->belongsTo(AcademicYear::class); }
    public function enrolledBy(): BelongsTo { return $this->belongsTo(User::class, 'enrolled_by'); }

    public function marks()
    {
        return Mark::where('student_id', $this->student_id)
            ->where('subject_offering_id', $this->subject_offering_id);
    }

    public function getSubjectAttribute()
    {
        return $this->subjectOffering?->subject;
    }

    public function getSubjectNameAttribute(): ?string
    {
        return $this->subjectOffering?->subject_name ?? $this->subjectOffering?->subject?->name;
    }

    public function scopeForStudent($query, int $studentId) { return $query->where('student_id', $studentId); }
    public function scopeForYear($query, int $yearId) { return $query->where('academic_year_id', $yearId); }
    public function scopeEnrolled($query) { return $query->where('status', 'enrolled'); }
}
