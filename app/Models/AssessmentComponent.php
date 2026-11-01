<?php

namespace App\Models;

use App\Traits\BelongsToSchool;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class AssessmentComponent extends Model
{
    use BelongsToSchool, SoftDeletes;

    protected $fillable = [
        'school_id', 'academic_year_id', 'name', 'slug', 'category',
        'description', 'max_marks', 'weight_percentage', 'sort_order',
        'is_active', 'include_in_final_result', 'include_in_promotion',
        'require_approval',
    ];

    protected $casts = [
        'max_marks'                => 'decimal:2',
        'weight_percentage'        => 'decimal:2',
        'is_active'                => 'boolean',
        'include_in_final_result'  => 'boolean',
        'include_in_promotion'     => 'boolean',
        'require_approval'         => 'boolean',
        'sort_order'               => 'integer',
    ];

    public function academicYear(): BelongsTo
    {
        return $this->belongsTo(AcademicYear::class);
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeForCategory($query, string $category)
    {
        return $query->where('category', $category);
    }

    public function scopeForYear($query, int $yearId)
    {
        return $query->where('academic_year_id', $yearId);
    }

    public function scopeCoursework($query)
    {
        return $query->where('category', 'coursework');
    }

    public function scopeExamination($query)
    {
        return $query->where('category', 'examination');
    }
}
