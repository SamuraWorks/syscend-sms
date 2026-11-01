<?php

namespace App\Models;

use App\Traits\BelongsToSchool;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Invoice extends Model
{
    use BelongsToSchool;

    protected $fillable = [
        'school_id', 'subscription_id', 'invoice_no', 'type', 'status',
        'description', 'issue_date', 'due_date', 'paid_at',
        'subtotal', 'discount', 'total', 'currency', 'items', 'notes', 'pdf_path',
    ];

    protected $casts = [
        'issue_date' => 'date',
        'due_date'   => 'date',
        'paid_at'    => 'datetime',
        'subtotal'   => 'decimal:2',
        'discount'   => 'decimal:2',
        'total'      => 'decimal:2',
        'items'      => 'array',
    ];

    public function subscription(): BelongsTo
    {
        return $this->belongsTo(SchoolSubscription::class);
    }

    public function getIsPaidAttribute(): bool
    {
        return $this->status === 'paid';
    }
}