<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AcademicCalendarTemplateTerm extends Model
{
    use HasFactory;

    protected $fillable = [
        'academic_calendar_template_id', 'name', 'term_number',
        'start_month', 'start_day', 'end_month', 'end_day', 'sort_order',
    ];

    public function template(): BelongsTo
    {
        return $this->belongsTo(AcademicCalendarTemplate::class, 'academic_calendar_template_id');
    }

    /**
     * Resolve the calendar year this term applies to, given an anchor
     * academic start year (terms starting in Sep–Dec belong to the anchor
     * year; Jan–Jul terms belong to the following year).
     */
    public function appliesToYear(int $anchorYear): int
    {
        return $this->start_month >= 9 ? $anchorYear : $anchorYear + 1;
    }
}