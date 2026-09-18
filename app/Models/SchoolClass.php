<?php

namespace App\Models;

use App\Traits\BelongsToSchool;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class SchoolClass extends Model
{
    use BelongsToSchool, SoftDeletes;

    protected $table = 'classes';

    protected $fillable = [
        'school_id', 'name', 'short_name', 'numeric_name', 'capacity',
        'class_teacher_id', 'school_level', 'level_order', 'department_id',
        'description', 'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function sections(): HasMany
    {
        return $this->hasMany(Section::class, 'class_id');
    }

    public function subjects(): HasMany
    {
        return $this->hasMany(Subject::class, 'class_id');
    }

    public function students(): HasMany
    {
        return $this->hasMany(Student::class, 'class_id');
    }

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class, 'department_id');
    }

    public function classTeacher(): BelongsTo
    {
        return $this->belongsTo(Staff::class, 'class_teacher_id');
    }

    public function levelLabel(): string
    {
        return match($this->school_level) {
            'early_childhood'   => 'Early Childhood Education',
            'primary'           => 'Primary Education',
            'junior_secondary'  => 'Junior Secondary School',
            'senior_secondary'  => 'Senior Secondary School',
            default             => '',
        };
    }

    public function activeSections(): HasMany
    {
        return $this->sections()->where('is_active', true);
    }
}
