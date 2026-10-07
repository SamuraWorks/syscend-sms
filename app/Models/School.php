<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class School extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name', 'short_name', 'slug', 'logo', 'email', 'phone',
        'address', 'city', 'state', 'country',
        'timezone', 'currency', 'currency_symbol', 'language',
        'settings', 'status', 'is_configured', 'allowed_ips', 'current_subscription_id',

        // MoE fields
        'district_id', 'school_type', 'ownership',
        'gps_latitude', 'gps_longitude', 'infrastructure_info',
        'inspection_status', 'accreditation_status',
        'national_school_id', 'moe_approval_status', 'approved_at', 'approved_by',

        // School Identity
        'motto', 'badge', 'banner', 'primary_color', 'secondary_color',
        'year_established', 'school_level',

        // Registration
        'mbsse_registration_number', 'emis_code', 'waec_centre_number',
        'npse_centre_number', 'bece_centre_number', 'wassce_centre_number',
        'business_registration_number', 'tax_identification_number',

        // Contact
        'district_name', 'chiefdom', 'province', 'postal_address',
        'whatsapp_number', 'website',

        // Leadership
        'proprietor_name', 'proprietor_photo',
        'principal_name', 'principal_photo',
        'vice_principal_name', 'bursar_name', 'registrar_name',

        // Academic
        'working_days', 'school_opening_time', 'school_closing_time',
        'ca_weight', 'exam_weight',

        // Branding assets
        'official_signature', 'official_stamp',

        // Public profile
        'public_profile_enabled', 'about_school', 'school_mission', 'school_vision',
    ];

    protected $casts = [
        'settings'            => 'array',
        'infrastructure_info' => 'array',
        'is_configured'       => 'boolean',
        'public_profile_enabled' => 'boolean',
        'approved_at'         => 'datetime',
        'ca_weight'           => 'decimal:2',
        'exam_weight'         => 'decimal:2',
    ];

    protected static function booted(): void
    {
        static::creating(function (School $school) {
            if (empty($school->slug)) {
                $school->slug = Str::slug($school->name);
            }
        });
    }

    // ── Relationships ──────────────────────────────────────

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    public function academicYears(): HasMany
    {
        return $this->hasMany(AcademicYear::class);
    }

    public function currentAcademicYear()
    {
        return $this->academicYears()->where('is_current', true)->first();
    }

    public function district(): BelongsTo
    {
        return $this->belongsTo(District::class);
    }

    public function inspections(): HasMany
    {
        return $this->hasMany(SchoolInspection::class);
    }

    public function nationalStudents(): HasMany
    {
        return $this->hasMany(NationalStudentRegistry::class);
    }

    public function nationalTeachers(): HasMany
    {
        return $this->hasMany(NationalTeacherRegistry::class);
    }

    public function dataSyncs(): HasMany
    {
        return $this->hasMany(SchoolDataSync::class);
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function currentSubscription(): BelongsTo
    {
        return $this->belongsTo(SchoolSubscription::class, 'current_subscription_id');
    }

    public function subscriptions(): HasMany
    {
        return $this->hasMany(SchoolSubscription::class);
    }

    public function activeSubscription()
    {
        return $this->hasOne(SchoolSubscription::class)
            ->where('status', 'active')
            ->latest('end_date');
    }

    public function hasModule(string $slug): bool
    {
        $sub = $this->currentSubscription;
        if (! $sub || ! $sub->package) return false;
        $modules = $sub->package->moduleSlugs();
        if (! empty($modules)) return in_array($slug, $modules, true);
        return in_array($slug, $sub->package->features ?? [], true);
    }

    // ── Accessors ──────────────────────────────────────────

    public function getLogoUrlAttribute(): ?string
    {
        return $this->logo ? \Illuminate\Support\Facades\Storage::disk('public')->url($this->logo) : null;
    }

    public function getBadgeUrlAttribute(): ?string
    {
        return $this->badge ? \Illuminate\Support\Facades\Storage::disk('public')->url($this->badge) : null;
    }

    public function getBannerUrlAttribute(): ?string
    {
        return $this->banner ? \Illuminate\Support\Facades\Storage::disk('public')->url($this->banner) : null;
    }

    public function getSignatureUrlAttribute(): ?string
    {
        return $this->official_signature ? \Illuminate\Support\Facades\Storage::disk('public')->url($this->official_signature) : null;
    }

    public function getStampUrlAttribute(): ?string
    {
        return $this->official_stamp ? \Illuminate\Support\Facades\Storage::disk('public')->url($this->official_stamp) : null;
    }

    /**
     * Get all branding data as a flat array for cross-app propagation.
     */
    public function getBrandingAttribute(): array
    {
        $settings = SchoolSetting::allFor($this->id);

        return [
            'name'             => $this->name,
            'short_name'       => $this->short_name,
            'motto'            => $this->motto,
            'tagline'          => $settings['tagline'] ?? null,
            'footer_text'      => $settings['footer_text'] ?? null,
            'logo_url'         => $this->logo_url,
            'badge_url'        => $this->badge_url,
            'banner_url'       => $this->banner_url,
            'favicon_url'      => isset($settings['favicon'])
                ? \Illuminate\Support\Facades\Storage::disk('public')->url($settings['favicon'])
                : null,
            'primary_color'    => $this->primary_color,
            'secondary_color'  => $this->secondary_color,
            'about_school'     => $this->about_school,
            'school_mission'   => $this->school_mission,
            'school_vision'    => $this->school_vision,
        ];
    }

    // ── Scopes ─────────────────────────────────────────────

    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }
}
