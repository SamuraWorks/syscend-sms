<?php

namespace App\Models;

use App\Traits\BelongsToSchool;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class AssessmentType extends Model
{
    use BelongsToSchool, SoftDeletes;

    protected $fillable = [
        'school_id', 'name', 'category', 'weight', 'is_active', 'sort_order',
        'description', 'academic_year_id', 'max_marks',
        'include_in_final_result', 'include_in_promotion', 'require_approval',
    ];

    protected $casts = [
        'weight'                    => 'decimal:2',
        'max_marks'                 => 'decimal:2',
        'is_active'                 => 'boolean',
        'sort_order'                => 'integer',
        'include_in_final_result'   => 'boolean',
        'include_in_promotion'      => 'boolean',
        'require_approval'          => 'boolean',
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
}
