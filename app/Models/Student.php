<?php

namespace App\Models;

use App\Traits\{BelongsToSchool, HasAuditLog};
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Storage;

class Student extends Model
{
    use BelongsToSchool, HasAuditLog, SoftDeletes;

    protected $fillable = [
        'school_id', 'user_id', 'class_id', 'section_id', 'guardian_id',
        'house_id', 'admission_no', 'student_id', 'roll_no', 'first_name', 'last_name',
        'gender', 'date_of_birth', 'blood_group', 'religion',
        'nationality', 'place_of_birth', 'phone', 'email', 'address', 'photo',
        'category', 'status', 'admission_date', 'admission_type', 'previous_school',
        'department_id', 'emis_number',
        'npse_index_number', 'bece_index_number', 'wassce_index_number',
        'medical_info',
        'claimed_by', 'claimed_at', 'registration_status',
    ];

    protected $casts = [
        'date_of_birth'  => 'date',
        'admission_date' => 'date',
    ];

    protected $appends = ['full_name', 'photo_url', 'initials'];

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

    public function schoolClass(): BelongsTo
    {
        return $this->belongsTo(SchoolClass::class, 'class_id');
    }

    public function section(): BelongsTo
    {
        return $this->belongsTo(Section::class);
    }

    public function guardian(): BelongsTo
    {
        return $this->belongsTo(Guardian::class);
    }

    public function guardians(): BelongsToMany
    {
        return $this->belongsToMany(Guardian::class, 'guardian_student')
            ->withPivot('relationship', 'is_primary', 'school_id')
            ->withTimestamps();
    }

    public function house(): BelongsTo
    {
        return $this->belongsTo(House::class);
    }

    public function getInitialsAttribute(): string
    {
        $parts = preg_split('/\s+/', trim($this->full_name)) ?: [];

        return strtoupper(substr($parts[0] ?? '', 0, 1) . substr($parts[1] ?? substr($parts[0] ?? '', 1, 1), 0, 1));
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class, 'department_id');
    }

    public function documents(): HasMany
    {
        return $this->hasMany(StudentDocument::class);
    }

    public function subjectEnrollments(): HasMany
    {
        return $this->hasMany(StudentSubjectEnrollment::class);
    }

    public function enrolledSubjects()
    {
        return Subject::query()
            ->whereHas('subjectOfferings.enrollments', fn ($q) => $q
                ->where('student_id', $this->id)
                ->where('status', 'enrolled'));
    }

    protected static function booted(): void
    {
        parent::booted();

        static::creating(function (Student $student) {
            if (empty($student->admission_no)) {
                $student->admission_no = app(\App\Services\StudentIdService::class)::generate((int) $student->school_id);
            }
        });
    }
}
