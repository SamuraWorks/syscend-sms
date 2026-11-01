<?php

namespace App\Models;

use App\Traits\{BelongsToSchool, HasAuditLog};
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class DocumentImport extends Model
{
    use BelongsToSchool, HasAuditLog, SoftDeletes;

    protected $fillable = [
        'school_id', 'user_id', 'document_type', 'file_path', 'file_name',
        'file_type', 'file_size', 'status', 'extracted_data', 'extraction_metadata',
        'import_results', 'admin_notes', 'records_imported', 'records_skipped',
        'records_updated', 'processed_at', 'imported_at',
    ];

    protected $casts = [
        'extracted_data'       => 'array',
        'extraction_metadata'  => 'array',
        'import_results'       => 'array',
        'file_size'            => 'integer',
        'records_imported'     => 'integer',
        'records_skipped'      => 'integer',
        'records_updated'      => 'integer',
        'processed_at'         => 'datetime',
        'imported_at'          => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function scopeForType($query, string $type)
    {
        return $query->where('document_type', $type);
    }

    public function scopeWithStatus($query, string $status)
    {
        return $query->where('status', $status);
    }

    public function isUploaded(): bool { return $this->status === 'uploaded'; }
    public function isProcessing(): bool { return $this->status === 'processing'; }
    public function isExtracted(): bool { return $this->status === 'extracted'; }
    public function isReviewed(): bool { return $this->status === 'reviewed'; }
    public function isImported(): bool { return $this->status === 'imported'; }
    public function isFailed(): bool { return $this->status === 'failed'; }
}
