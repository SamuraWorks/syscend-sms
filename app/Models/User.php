<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Facades\Storage;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable, HasRoles, SoftDeletes;

    protected $fillable = [
        'school_id',
        'name',
        'email',
        'username',
        'phone',
        'phone_secondary',
        'avatar',
        'status',
        'password',
        'is_temporary_password',
        'must_change_password',
        'password_changed_at',
        'last_password_change_at',
        'last_login_at',
        'force_password_change',
        'created_by',
        'two_factor_enabled',
        'two_factor_secret',
        'registration_status',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $appends = ['avatar_url'];

    protected function casts(): array
    {
        return [
            'email_verified_at'      => 'datetime',
            'last_login_at'          => 'datetime',
            'password_changed_at'    => 'datetime',
            'last_password_change_at'=> 'datetime',
            'password'               => 'hashed',
            'is_temporary_password'  => 'boolean',
            'must_change_password'   => 'boolean',
        ];
    }

    public function getAvatarUrlAttribute(): ?string
    {
        return $this->avatar ? asset('storage/' . $this->avatar) : null;
    }

    public function createdBy(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class);
    }

    public function auditLogs(): HasMany
    {
        return $this->hasMany(UserAuditLog::class);
    }

    public function isTempPassword(): bool
    {
        return $this->is_temporary_password;
    }

    public function needsPasswordChange(): bool
    {
        return $this->must_change_password && $this->is_temporary_password;
    }

    /**
     * Only 'active' accounts may authenticate. Any other status (inactive,
     * suspended, ...) blocks sign-in at LoginController::store().
     */
    public function isActive(): bool
    {
        return $this->status === 'active';
    }
}
