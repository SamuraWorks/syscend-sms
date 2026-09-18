<?php

namespace App\Models;

use App\Traits\BelongsToSchool;
use Illuminate\Database\Eloquent\Model;

class ScheduleEventType extends Model
{
    use BelongsToSchool;

    protected $table = 'schedule_event_types';

    protected $fillable = [
        'school_id', 'name', 'slug', 'color', 'icon',
        'is_instructional', 'attendance_required', 'is_active', 'sort_order',
    ];

    protected $casts = [
        'is_instructional'   => 'boolean',
        'attendance_required' => 'boolean',
        'is_active'          => 'boolean',
    ];

    public function periods()
    {
        return $this->hasMany(SchedulePeriod::class, 'event_type_id');
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeOrdered($query)
    {
        return $query->orderBy('sort_order')->orderBy('name');
    }
}
