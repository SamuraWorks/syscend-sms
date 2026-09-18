<?php

namespace App\Models;

use App\Traits\BelongsToSchool;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class ReportCardTemplate extends Model
{
    use BelongsToSchool, HasFactory, SoftDeletes;

    protected $fillable = [
        'school_id',
        'name',
        'description',
        'status',
        'is_default',
        'front_image_path',
        'back_image_path',
        'template_config',
        'ai_extracted_data',
        'ai_confidence_score',
        'version',
        'previous_version_id',
        'approved_by',
        'approved_at',
        'created_by',
    ];

    protected $casts = [
        'is_default'           => 'boolean',
        'template_config'      => 'array',
        'ai_extracted_data'    => 'array',
        'ai_confidence_score'  => 'decimal:2',
        'approved_at'          => 'datetime',
    ];

    // ── Relationships ───────────────────────────────────────

    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function previousVersion(): BelongsTo
    {
        return $this->belongsTo(self::class, 'previous_version_id');
    }

    public function nextVersions()
    {
        return $this->hasMany(self::class, 'previous_version_id');
    }

    // ── Accessors ───────────────────────────────────────────

    public function getFrontImageUrlAttribute(): ?string
    {
        return $this->front_image_path ? asset('storage/' . $this->front_image_path) : null;
    }

    public function getBackImageUrlAttribute(): ?string
    {
        return $this->back_image_path ? asset('storage/' . $this->back_image_path) : null;
    }

    // ── Scopes ──────────────────────────────────────────────

    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function scopeDraft($query)
    {
        return $query->where('status', 'draft');
    }

    public function scopeArchived($query)
    {
        return $query->where('status', 'archived');
    }

    // ── Helpers ─────────────────────────────────────────────

    public function isDraft(): bool
    {
        return $this->status === 'draft';
    }

    public function isActive(): bool
    {
        return $this->status === 'active';
    }

    public function isArchived(): bool
    {
        return $this->status === 'archived';
    }
}
