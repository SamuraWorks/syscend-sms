<?php

namespace App\Models;

use App\Traits\BelongsToSchool;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class AcademicTerm extends Model
{
    use BelongsToSchool, SoftDeletes;

    protected $fillable = [
        'school_id', 'academic_year_id', 'name', 'start_date', 'end_date',
        'mid_term_start', 'mid_term_end', 'is_current',
    ];

    protected $casts = [
        'start_date'     => 'date',
        'end_date'       => 'date',
        'mid_term_start' => 'date',
        'mid_term_end'   => 'date',
        'is_current'     => 'boolean',
    ];

    public function academicYear(): BelongsTo
    {
        return $this->belongsTo(AcademicYear::class);
    }

    public function exams()
    {
        return $this->hasMany(Exam::class, 'term_id');
    }

    public function reportCards()
    {
        return $this->hasMany(ReportCard::class, 'term_id');
    }

    public function makeCurrent(): void
    {
        static::where('school_id', $this->school_id)
            ->where('academic_year_id', $this->academic_year_id)
            ->where('id', '!=', $this->id)
            ->update(['is_current' => false]);

        $this->update(['is_current' => true]);
    }

    public static function current(int $schoolId): ?self
    {
        return static::where('school_id', $schoolId)
            ->where('is_current', true)
            ->first();
    }
}
