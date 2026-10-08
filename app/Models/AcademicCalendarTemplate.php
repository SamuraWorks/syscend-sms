<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AcademicCalendarTemplate extends Model
{
    use HasFactory;

    protected $fillable = [
        'name', 'country', 'zone',
        'year_start_month', 'year_start_day',
        'year_end_month', 'year_end_day',
        'is_active', 'sort_order',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function terms(): HasMany
    {
        return $this->hasMany(AcademicCalendarTemplateTerm::class)->orderBy('term_number');
    }
}