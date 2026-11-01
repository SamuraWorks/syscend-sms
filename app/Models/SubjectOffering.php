<?php

namespace App\Models;

use App\Traits\BelongsToSchool;
use Illuminate\Database\Eloquent\{Model, SoftDeletes};
use Illuminate\Database\Eloquent\Relations\{BelongsTo, HasMany};
use Illuminate\Database\Eloquent\Builder;

class SubjectOffering extends Model
{
    use BelongsToSchool, SoftDeletes;

    protected $fillable = [
        'school_id', 'academic_year_id', 'class_id', 'section_id', 'department_id',
        'subject_id', 'subject_name', 'subject_code', 'subject_type', 'selection_group',
        'is_required', 'min_selection', 'max_selection', 'sort_order', 'is_active',
    ];

    protected function casts(): array
    {
        return [
            'is_required' => 'boolean',
            'min_selection' => 'integer',
            'max_selection' => 'integer',
            'sort_order' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    public function schoolClass(): BelongsTo { return $this->belongsTo(SchoolClass::class, 'class_id'); }
    public function section(): BelongsTo { return $this->belongsTo(Section::class); }
    public function academicYear(): BelongsTo { return $this->belongsTo(AcademicYear::class); }
    public function department(): BelongsTo { return $this->belongsTo(Department::class); }
    public function subject(): BelongsTo { return $this->belongsTo(Subject::class); }
    public function enrollments(): HasMany { return $this->hasMany(StudentSubjectEnrollment::class, 'subject_offering_id'); }
    public function teacherAssignments(): HasMany { return $this->hasMany(TeacherSubjectAssignment::class, 'subject_offering_id'); }
    public function marks(): HasMany { return $this->hasMany(Mark::class, 'subject_offering_id'); }

    public function activeTeachers()
    {
        return $this->hasMany(TeacherSubjectAssignment::class, 'subject_offering_id')
            ->where('is_active', true);
    }

    public function enrolledStudents()
    {
        return Student::query()
            ->whereHas('subjectEnrollments', fn ($q) => $q
                ->where('subject_offering_id', $this->id)
                ->where('status', 'enrolled'))
            ->where('status', 'active');
    }

    public function getEnrolledCountAttribute(): int
    {
        return $this->enrollments()->enrolled()->count();
    }

    public function getSubjectIdForMarkingAttribute(): int
    {
        return $this->subject_id;
    }

    public function scopeForSubject($query, int $subjectId)
    {
        return $query->where('subject_id', $subjectId);
    }

    public function scopeForSection($query, int $sectionId)
    {
        return $query->where('section_id', $sectionId);
    }

    public function scopeForClass($query, int $classId) { return $query->where('class_id', $classId); }
    public function scopeForYear($query, int $yearId) { return $query->where('academic_year_id', $yearId); }
    public function scopeActive($query) { return $query->where('is_active', true); }
    public function scopeCompulsory($query) { return $query->where('subject_type', 'compulsory'); }
    public function scopeElective($query) { return $query->where('subject_type', 'elective'); }
    public function scopeSelective($query) { return $query->where('subject_type', 'selective'); }
}
