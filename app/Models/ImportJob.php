<?php

namespace App\Models;

use App\Traits\BelongsToSchool;
use Illuminate\Database\Eloquent\{Model, SoftDeletes};
use Illuminate\Database\Eloquent\Relations\{BelongsTo};

class ImportJob extends Model
{
    use BelongsToSchool, SoftDeletes;

    protected $fillable = [
        'school_id', 'user_id', 'import_type', 'file_name', 'file_path', 'file_type',
        'status', 'total_rows', 'valid_rows', 'error_rows', 'imported_rows',
        'validation_errors', 'import_summary', 'import_options',
        'validated_at', 'imported_at',
    ];

    protected function casts(): array
    {
        return [
            'total_rows' => 'integer',
            'valid_rows' => 'integer',
            'error_rows' => 'integer',
            'imported_rows' => 'integer',
            'validation_errors' => 'array',
            'import_summary' => 'array',
            'import_options' => 'array',
            'validated_at' => 'datetime',
            'imported_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo { return $this->belongsTo(User::class); }
    public function scopeForType($query, string $type) { return $query->where('import_type', $type); }
    public function scopeRecent($query) { return $query->latest()->limit(20); }
}
