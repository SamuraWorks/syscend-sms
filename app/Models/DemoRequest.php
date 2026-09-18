<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Str;

class DemoRequest extends Model
{
    use Notifiable;
    protected $fillable = [
        'request_id', 'status', 'assigned_to',
        'school_name', 'school_type', 'school_level', 'district',
        'number_of_students', 'number_of_teachers',
        'contact_name', 'contact_position', 'contact_email',
        'contact_phone', 'contact_whatsapp',
        'modules_of_interest', 'current_management',
        'biggest_challenge', 'preferred_contact_method',
        'preferred_day', 'preferred_time',
        'ip_address', 'user_agent',
    ];

    protected $casts = [
        'modules_of_interest'  => 'array',
        'number_of_students'   => 'integer',
        'number_of_teachers'   => 'integer',
    ];

    protected static function booted(): void
    {
        static::creating(function (DemoRequest $req) {
            if (empty($req->request_id)) {
                $req->request_id = 'DEMO-' . strtoupper(Str::random(8));
            }
        });
    }

    public function assignee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    public function notes(): HasMany
    {
        return $this->hasMany(DemoRequestNote::class);
    }

    public function statusHistory(): HasMany
    {
        return $this->hasMany(DemoRequestStatusHistory::class);
    }

    public function scopeStatus($query, string $status)
    {
        return $query->where('status', $status);
    }

    public function getStatusLabelAttribute(): string
    {
        return match ($this->status) {
            'new'                => 'New Request',
            'contacted'          => 'Contacted',
            'demo_scheduled'     => 'Demo Scheduled',
            'demo_completed'     => 'Demo Completed',
            'follow_up_required' => 'Follow-up Required',
            'converted'          => 'Converted to Customer',
            'closed'             => 'Closed',
            default              => ucfirst($this->status),
        };
    }
}
