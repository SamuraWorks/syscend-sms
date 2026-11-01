<?php

namespace App\Models;

use App\Traits\BelongsToSchool;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ExamAssessmentLink extends Model
{
    use BelongsToSchool;

    protected $fillable = [
        'school_id', 'exam_id', 'assessment_type_id', 'max_marks', 'weight', 'sort_order',
    ];

    protected $casts = [
        'max_marks' => 'decimal:2',
        'weight'    => 'decimal:2',
    ];

    public function exam(): BelongsTo
    {
        return $this->belongsTo(Exam::class);
    }

    public function assessmentType(): BelongsTo
    {
        return $this->belongsTo(AssessmentType::class);
    }
}
