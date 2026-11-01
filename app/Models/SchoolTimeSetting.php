<?php

namespace App\Models;

use App\Traits\BelongsToSchool;
use Illuminate\Database\Eloquent\Model;

class SchoolTimeSetting extends Model
{
    use BelongsToSchool;

    protected $table = 'school_time_settings';

    protected $fillable = [
        'school_id', 'academic_year_id', 'opening_time', 'closing_time',
        'working_days', 'timezone', 'clock_format', 'day_start', 'day_end', 'is_active',
    ];

    protected $casts = [
        'opening_time' => 'datetime:H:i',
        'closing_time' => 'datetime:H:i',
        'day_start'    => 'datetime:H:i',
        'day_end'      => 'datetime:H:i',
    ];

    public function getWorkingDaysArrayAttribute(): array
    {
        return array_map('trim', explode(',', $this->working_days));
    }

    public function isWorkingDay(string $day): bool
    {
        return in_array(strtolower($day), $this->working_days_array);
    }
}
