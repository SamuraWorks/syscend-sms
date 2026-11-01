<?php

namespace App\Models;

use App\Traits\BelongsToSchool;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SchedulePeriod extends Model
{
    use BelongsToSchool;

    protected $table = 'schedule_periods';

    protected $fillable = [
        'school_id', 'academic_year_id', 'name', 'event_type_id',
        'period_number', 'start_time', 'end_time', 'duration_minutes',
        'is_break', 'is_active', 'sort_order',
    ];

    protected $casts = [
        'start_time' => 'datetime:H:i',
        'end_time'   => 'datetime:H:i',
        'is_break'   => 'boolean',
        'is_active'  => 'boolean',
    ];

    public function eventType(): BelongsTo
    {
        return $this->belongsTo(ScheduleEventType::class, 'event_type_id');
    }

    public function getDurationAttribute(): int
    {
        if ($this->duration_minutes) {
            return $this->duration_minutes;
        }
        $start = \Carbon\Carbon::parse($this->start_time);
        $end   = \Carbon\Carbon::parse($this->end_time);
        return $start->diffInMinutes($end);
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeOrdered($query)
    {
        return $query->orderBy('sort_order')->orderBy('start_time');
    }

    public static function boot(): void
    {
        parent::boot();

        static::saving(function (SchedulePeriod $period) {
            if (!$period->duration_minutes) {
                $start = \Carbon\Carbon::parse($period->start_time);
                $end   = \Carbon\Carbon::parse($period->end_time);
                $period->duration_minutes = (int) $start->diffInMinutes($end);
            }
        });
    }
}
