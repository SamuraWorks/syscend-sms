<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class District extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name', 'code', 'province', 'education_officer_id',
        'schools_count', 'students_count', 'teachers_count', 'status',
    ];

    protected $casts = [
        'schools_count'  => 'integer',
        'students_count' => 'integer',
        'teachers_count' => 'integer',
    ];

    public function educationOfficer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'education_officer_id');
    }

    public function schools(): HasMany
    {
        return $this->hasMany(School::class);
    }

    public function inspections(): HasMany
    {
        return $this->hasMany(SchoolInspection::class);
    }

    public function announcements(): HasMany
    {
        return $this->hasMany(MinistryAnnouncement::class);
    }

    public function nationalStudents(): HasMany
    {
        return $this->hasMany(NationalStudentRegistry::class);
    }

    public function nationalTeachers(): HasMany
    {
        return $this->hasMany(NationalTeacherRegistry::class);
    }

    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }
}
