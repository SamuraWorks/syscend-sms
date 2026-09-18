<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class NationalStudentRegistry extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'national_student_registry';

    protected $fillable = [
        'national_student_id', 'name', 'date_of_birth', 'gender',
        'school_id', 'district_id', 'enrollment_date', 'current_level',
        'status', 'previous_schools', 'graduation_year', 'created_by',
    ];

    protected $casts = [
        'date_of_birth'    => 'date',
        'enrollment_date'  => 'date',
        'previous_schools' => 'array',
    ];

    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class);
    }

    public function district(): BelongsTo
    {
        return $this->belongsTo(District::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function scopeForLevel($query, string $level)
    {
        return $query->where('current_level', $level);
    }
}
