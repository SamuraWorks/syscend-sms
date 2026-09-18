<?php

namespace App\Models;

use App\Traits\BelongsToSchool;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Storage;

class Staff extends Model
{
    use BelongsToSchool, SoftDeletes;

    protected $table = 'staff';

    protected $fillable = [
        'school_id', 'user_id', 'department_id', 'designation_id',
        'emp_id', 'first_name', 'last_name', 'gender',
        'date_of_birth', 'blood_group', 'religion', 'nationality',
        'phone', 'email', 'address', 'photo',
        'joining_date', 'salary_type', 'salary', 'status', 'notes',
        'teacher_type', 'form_master_section_id', 'form_master_class_id',
        'claimed_by', 'claimed_at', 'registration_status',
    ];

    protected $casts = [
        'date_of_birth' => 'date',
        'joining_date'  => 'date',
        'salary'        => 'decimal:2',
    ];

    protected $appends = ['full_name', 'photo_url'];

    public function getFullNameAttribute(): string
    {
        return trim("{$this->first_name} {$this->last_name}");
    }

    public function getPhotoUrlAttribute(): ?string
    {
        if ($this->photo) {
            return Storage::disk('public')->url($this->photo);
        }

        return $this->user?->avatar_url;
    }

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    public function designation(): BelongsTo
    {
        return $this->belongsTo(Designation::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function documents(): HasMany
    {
        return $this->hasMany(StaffDocument::class);
    }

    public function salaryStructure(): HasOne
    {
        return $this->hasOne(SalaryStructure::class);
    }

    public function payrolls(): HasMany
    {
        return $this->hasMany(Payroll::class);
    }

    public function formMasterSection(): BelongsTo
    {
        return $this->belongsTo(Section::class, 'form_master_section_id');
    }

    public function formMasterClass(): BelongsTo
    {
        return $this->belongsTo(SchoolClass::class, 'form_master_class_id');
    }

    public function subjectAssignments(): HasMany
    {
        return $this->hasMany(TeacherSubjectAssignment::class, 'staff_id');
    }

    public function activeSubjectAssignments(): HasMany
    {
        return $this->hasMany(TeacherSubjectAssignment::class, 'staff_id')
            ->where('is_active', true);
    }

    public function assignedSubjects()
    {
        return Subject::query()
            ->whereHas('subjectOfferings.teacherAssignments', fn ($q) => $q
                ->where('staff_id', $this->id)
                ->where('is_active', true));
    }

    public function isFormMaster(): bool
    {
        return in_array($this->teacher_type, ['form_master', 'both']);
    }

    public function isSubjectTeacher(): bool
    {
        return in_array($this->teacher_type, ['subject_teacher', 'both']);
    }

    protected static function booted(): void
    {
        parent::booted();

        static::creating(function (Staff $staff) {
            if (empty($staff->emp_id)) {
                $year  = now()->format('Y');
                $count = static::withoutGlobalScopes()->where('school_id', $staff->school_id)->count() + 1;
                $staff->emp_id = "EMP-{$year}-" . str_pad($count, 4, '0', STR_PAD_LEFT);
            }
        });
    }
}
