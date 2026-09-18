<?php

namespace App\Models;

use App\Traits\BelongsToSchool;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SchoolSubscription extends Model
{
    use BelongsToSchool, SoftDeletes;

    protected $fillable = [
        'school_id', 'package_id', 'coupon_id', 'academic_year_id',
        'start_date', 'end_date', 'term_number',
        'status', 'is_trial', 'trial_ends_at',
        'price_per_term', 'amount_paid', 'payment_method', 'notes',
    ];

    protected $casts = [
        'start_date'    => 'date',
        'end_date'      => 'date',
        'trial_ends_at' => 'date',
        'is_trial'      => 'boolean',
        'price_per_term' => 'decimal:2',
        'amount_paid'   => 'decimal:2',
    ];

    public function package(): BelongsTo  { return $this->belongsTo(Package::class); }
    public function coupon(): BelongsTo   { return $this->belongsTo(Coupon::class); }
    public function academicYear(): BelongsTo { return $this->belongsTo(AcademicYear::class); }
    public function school(): BelongsTo   { return $this->belongsTo(School::class); }

    public function payments(): HasMany
    {
        return $this->hasMany(SubscriptionPayment::class, 'subscription_id');
    }

    public function confirmedPayments(): HasMany
    {
        return $this->hasMany(SubscriptionPayment::class, 'subscription_id')->where('status', 'confirmed');
    }

    public function getBalanceAttribute(): float
    {
        $price = (float) ($this->price_per_term ?? 0);
        $paid  = (float) $this->confirmedPayments()->sum('amount');
        return max(0, $price - $paid);
    }

    public function getIsFullyPaidAttribute(): bool
    {
        return $this->balance <= 0;
    }

    /**
     * Provision a trial subscription for a newly created school using the
     * default (first active) package. Returns null when no package is
     * available so school creation never fails because of pricing setup.
     */
    public static function startTrialForSchool(School $school, ?int $days = null): ?self
    {
        $package = Package::where('is_active', true)->orderBy('id')->first();

        if (! $package) {
            return null;
        }

        $days ??= (int) config('app.trial_days', 14);
        $trialEndsAt = now()->addDays($days);

        $subscription = self::create([
            'school_id'      => $school->id,
            'package_id'     => $package->id,
            'start_date'     => now()->toDateString(),
            'end_date'       => $trialEndsAt->toDateString(),
            'status'         => 'trial',
            'is_trial'       => true,
            'trial_ends_at'  => $trialEndsAt->toDateString(),
            'price_per_term' => $package->price_per_term ?? 0,
            'amount_paid'    => 0,
            'payment_method' => null,
            'notes'          => 'Auto-provisioned trial subscription',
        ]);

        $school->update(['current_subscription_id' => $subscription->id]);

        return $subscription;
    }
}
