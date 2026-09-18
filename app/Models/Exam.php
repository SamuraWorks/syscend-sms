<?php

namespace App\Models;

use App\Traits\{BelongsToSchool, HasAuditLog};
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Exam extends Model
{
    use BelongsToSchool, HasAuditLog, SoftDeletes;

    protected $fillable = [
        'school_id', 'class_id', 'name', 'type', 'start_date', 'end_date', 'status', 'description',
        'academic_year_id', 'term_id', 'assessment_category', 'ca_weight', 'exam_weight',
        'max_score', 'submitted_by', 'submitted_at', 'approved_by', 'approved_at', 'assessment_model',
        'publication_date',
    ];

    protected $casts = [
        'start_date'       => 'date',
        'end_date'         => 'date',
        'ca_weight'        => 'decimal:2',
        'exam_weight'      => 'decimal:2',
        'max_score'        => 'decimal:2',
        'submitted_at'     => 'datetime',
        'approved_at'      => 'datetime',
        'publication_date' => 'datetime',
    ];

    public function schoolClass(): BelongsTo
    {
        return $this->belongsTo(SchoolClass::class, 'class_id');
    }

    public function academicYear(): BelongsTo
    {
        return $this->belongsTo(AcademicYear::class);
    }

    public function term(): BelongsTo
    {
        return $this->belongsTo(AcademicTerm::class, 'term_id');
    }

    public function marks(): HasMany
    {
        return $this->hasMany(Mark::class);
    }

    public function assessmentLinks(): HasMany
    {
        return $this->hasMany(ExamAssessmentLink::class, 'exam_id');
    }

    public function sections(): BelongsToMany
    {
        return $this->belongsToMany(Section::class, 'exam_sections');
    }

    public function subjects(): BelongsToMany
    {
        return $this->belongsToMany(Subject::class, 'exam_subjects');
    }

    public function submittedByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'submitted_by');
    }

    public function approvedByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function approvalLogs(): HasMany
    {
        return $this->hasMany(ResultApprovalLog::class, 'approvable_id')
            ->where('approvable_type', self::class);
    }

    public function subjectOfferings(): BelongsToMany
    {
        return $this->belongsToMany(SubjectOffering::class, 'exam_subject_offerings')
            ->withPivot('max_marks', 'weight');
    }

    public function scopeForTerm($query, int $termId)
    {
        return $query->where('term_id', $termId);
    }

    public function scopeForYear($query, int $yearId)
    {
        return $query->where('academic_year_id', $yearId);
    }

    public function isSubmittable(): bool
    {
        return $this->status === 'published' && !$this->submitted_at;
    }

    public function isApprovable(): bool
    {
        return $this->status === 'published' && $this->submitted_at && !$this->approved_at;
    }

    public function isLocked(): bool
    {
        return $this->approved_at !== null;
    }

    /**
     * Get eligible students (filtered by sections if configured).
     */
    public function eligibleStudents()
    {
        $query = Student::where('class_id', $this->class_id)
            ->where('status', 'active');

        if ($this->sections->count() > 0) {
            $query->whereIn('section_id', $this->sections->pluck('id'));
        }

        return $query->orderBy('roll_no');
    }

    /**
     * Get eligible subjects (filtered if configured).
     */
    public function eligibleSubjects()
    {
        if ($this->subjects->count() > 0) {
            return $this->subjects;
        }

        return Subject::where('class_id', $this->class_id)->orderBy('name')->get();
    }

    /**
     * Get students enrolled in specific subject offerings for this exam.
     * When subject offerings are configured, only students enrolled in those offerings are eligible.
     */
    public function enrolledStudents(int $subjectOfferingId)
    {
        return Student::where('class_id', $this->class_id)
            ->where('status', 'active')
            ->whereHas('subjectEnrollments', fn ($q) => $q
                ->where('subject_offering_id', $subjectOfferingId)
                ->where('status', 'enrolled'))
            ->orderBy('roll_no');
    }

    /**
     * Check if a student is eligible for a specific subject offering in this exam.
     */
    public function isStudentEligible(Student $student, int $subjectOfferingId): bool
    {
        return $student->class_id === $this->class_id
            && $student->status === 'active'
            && $student->subjectEnrollments()
                ->where('subject_offering_id', $subjectOfferingId)
                ->where('status', 'enrolled')
                ->exists();
    }

    /**
     * Get marks for this exam grouped by subject offering.
     */
    public function marksByOffering(): \Illuminate\Support\Collection
    {
        return $this->marks()
            ->whereNotNull('subject_offering_id')
            ->get()
            ->groupBy('subject_offering_id');
    }
}
