<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class NationalTeacherRegistry extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'national_teacher_registry';

    protected $fillable = [
        'national_teacher_id', 'name', 'email', 'phone', 'staff_id',
        'school_id', 'district_id', 'qualification', 'specialization',
        'years_of_experience', 'employment_status', 'certifications',
        'licensing_status', 'professional_development_hours',
    ];

    protected $casts = [
        'years_of_experience'           => 'integer',
        'professional_development_hours' => 'integer',
        'certifications'                => 'array',
    ];

    public function staff(): BelongsTo
    {
        return $this->belongsTo(Staff::class);
    }

    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class);
    }

    public function district(): BelongsTo
    {
        return $this->belongsTo(District::class);
    }

    public function scopeActive($query)
    {
        return $query->where('employment_status', 'active');
    }

    public function scopeLicensed($query)
    {
        return $query->where('licensing_status', 'licensed');
    }
}
