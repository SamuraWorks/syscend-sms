<?php

namespace App\Models;

use App\Traits\BelongsToSchool;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class SchoolAssessmentConfig extends Model
{
    use BelongsToSchool, SoftDeletes;

    protected $fillable = [
        'school_id', 'academic_year_id', 'name', 'description',
        'is_default', 'is_active', 'config_data',
        'total_coursework_weight', 'total_examination_weight',
        'require_approval_before_publishing',
    ];

    protected $casts = [
        'is_default'                        => 'boolean',
        'is_active'                         => 'boolean',
        'config_data'                       => 'array',
        'total_coursework_weight'           => 'decimal:2',
        'total_examination_weight'          => 'decimal:2',
        'require_approval_before_publishing' => 'boolean',
    ];

    public function academicYear(): BelongsTo
    {
        return $this->belongsTo(AcademicYear::class);
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeForYear($query, int $yearId)
    {
        return $query->where('academic_year_id', $yearId);
    }

    public function scopeDefault($query)
    {
        return $query->where('is_default', true);
    }

    /**
     * Get the active assessment components for this config.
     */
    public function components()
    {
        return AssessmentComponent::where('school_id', $this->school_id)
            ->where('academic_year_id', $this->academic_year_id)
            ->active()
            ->orderBy('sort_order')
            ->get();
    }

    /**
     * Validate that weights sum to 100.
     */
    public function validateWeights(): bool
    {
        $components = $this->components();
        $total = $components->sum('weight_percentage');
        return abs($total - 100) < 0.01;
    }

    /**
     * Get coursework components.
     */
    public function courseworkComponents()
    {
        return $this->components()->where('category', 'coursework');
    }

    /**
     * Get examination components.
     */
    public function examinationComponents()
    {
        return $this->components()->where('category', 'examination');
    }
}
