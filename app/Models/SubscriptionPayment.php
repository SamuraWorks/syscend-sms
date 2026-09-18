<?php

namespace App\Models;

use App\Traits\BelongsToSchool;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SubscriptionPayment extends Model
{
    use BelongsToSchool;

    protected $fillable = [
        'school_id', 'subscription_id', 'amount', 'method',
        'transaction_ref', 'status', 'payer_phone',
        'paid_at', 'confirmed_at', 'notes',
    ];

    protected $casts = [
        'amount'       => 'decimal:2',
        'paid_at'      => 'datetime',
        'confirmed_at' => 'datetime',
    ];

    public function subscription(): BelongsTo
    {
        return $this->belongsTo(SchoolSubscription::class, 'subscription_id');
    }

    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class);
    }

    public function confirm(): bool
    {
        return app(\App\Services\SubscriptionPaymentService::class)->confirmPayment($this);
    }
}
