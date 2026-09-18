<?php

namespace App\Models;

use App\Traits\BelongsToSchool;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Subject extends Model
{
    use BelongsToSchool, SoftDeletes;

    protected $fillable = [
        'school_id', 'class_id', 'name', 'code', 'type', 'full_marks', 'pass_marks',
        'department_id', 'school_level', 'is_core', 'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'is_core'   => 'boolean',
    ];

    public function schoolClass(): BelongsTo
    {
        return $this->belongsTo(SchoolClass::class, 'class_id');
    }

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class, 'department_id');
    }

    public function subjectOfferings(): HasMany
    {
        return $this->hasMany(SubjectOffering::class);
    }

    public function offeringsForYear(int $academicYearId)
    {
        return $this->subjectOfferings()
            ->where('academic_year_id', $academicYearId)
            ->active();
    }
}
