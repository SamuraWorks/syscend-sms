<?php

namespace App\Services;

use App\Models\GradeScale;
use App\Support\SierraLeoneEducation;
use Illuminate\Support\Collection;

class GradingService
{
    private Collection $scales;

    public function __construct(int $schoolId, ?string $schoolLevel = null)
    {
        $this->scales = GradeScale::where('school_id', $schoolId)
            ->forLevel($schoolLevel)
            ->orderByDesc('min_marks')
            ->get();
    }

    public function calculate(float $marks, float $fullMarks): array
    {
        $percentage = $fullMarks > 0 ? ($marks / $fullMarks) * 100 : 0;

        foreach ($this->scales as $scale) {
            if ($percentage >= (float) $scale->min_marks) {
                return [
                    'grade'   => $scale->grade,
                    'gpa'     => (float) $scale->gpa,
                    'remarks' => $scale->remarks,
                ];
            }
        }

        if ($this->scales->isNotEmpty()) {
            $lowest = $this->scales->last();
            return [
                'grade'   => $lowest->grade,
                'gpa'     => (float) $lowest->gpa,
                'remarks' => $lowest->remarks,
            ];
        }

        return ['grade' => 'N/A', 'gpa' => 0.00, 'remarks' => 'No grade scale configured'];
    }

    public static function calculateWassce(float $score): array
    {
        foreach (SierraLeoneEducation::WASSCE_GRADE_SCALE as $grade) {
            if ($score >= $grade['min'] && $score <= $grade['max']) {
                return [
                    'grade'          => $grade['grade'],
                    'gpa'            => $grade['gpa'],
                    'remarks'        => $grade['remark'],
                    'interpretation' => $grade['interpretation'],
                ];
            }
        }

        $fallback = end(SierraLeoneEducation::WASSCE_GRADE_SCALE);
        return [
            'grade'          => $fallback['grade'],
            'gpa'            => $fallback['gpa'],
            'remarks'        => $fallback['remark'],
            'interpretation' => $fallback['interpretation'],
        ];
    }

    public static function calculateNpse(float $score): array
    {
        foreach (SierraLeoneEducation::NPSE_GRADE_SCALE as $grade) {
            if ($score >= $grade['min'] && $score <= $grade['max']) {
                return [
                    'grade'   => $grade['grade'],
                    'remarks' => $grade['remark'],
                ];
            }
        }

        $fallback = end(SierraLeoneEducation::NPSE_GRADE_SCALE);
        return [
            'grade'   => $fallback['grade'],
            'remarks' => $fallback['remark'],
        ];
    }

    public static function calculateForExamType(string $examType, float $score): array
    {
        return match($examType) {
            'wassce' => self::calculateWassce($score),
            'npse'   => self::calculateNpse($score),
            default  => self::calculateWassce($score),
        };
    }

    public static function defaultScales(): array
    {
        return [
            ['grade' => 'A+', 'gpa' => 5.00, 'min_marks' => 80, 'max_marks' => 100, 'remarks' => 'Outstanding',   'sort_order' => 1],
            ['grade' => 'A',  'gpa' => 4.00, 'min_marks' => 70, 'max_marks' => 79,  'remarks' => 'Excellent',     'sort_order' => 2],
            ['grade' => 'A-', 'gpa' => 3.50, 'min_marks' => 60, 'max_marks' => 69,  'remarks' => 'Very Good',     'sort_order' => 3],
            ['grade' => 'B',  'gpa' => 3.00, 'min_marks' => 50, 'max_marks' => 59,  'remarks' => 'Good',          'sort_order' => 4],
            ['grade' => 'C',  'gpa' => 2.00, 'min_marks' => 40, 'max_marks' => 49,  'remarks' => 'Satisfactory',  'sort_order' => 5],
            ['grade' => 'D',  'gpa' => 1.00, 'min_marks' => 33, 'max_marks' => 39,  'remarks' => 'Pass',          'sort_order' => 6],
            ['grade' => 'F',  'gpa' => 0.00, 'min_marks' => 0,  'max_marks' => 32,  'remarks' => 'Fail',          'sort_order' => 7],
        ];
    }

    public static function wassceScales(): array
    {
        return array_map(fn($g) => [
            'grade'   => $g['grade'],
            'gpa'     => $g['gpa'],
            'min_marks' => $g['min'],
            'max_marks' => $g['max'],
            'remarks' => $g['remark'],
            'sort_order' => $g['gpa'],
        ], SierraLeoneEducation::WASSCE_GRADE_SCALE);
    }

    public static function npseScales(): array
    {
        return array_map(fn($g, $i) => [
            'grade'   => $g['grade'],
            'gpa'     => 0,
            'min_marks' => $g['min'],
            'max_marks' => $g['max'],
            'remarks' => $g['remark'],
            'sort_order' => $i + 1,
        ], SierraLeoneEducation::NPSE_GRADE_SCALE, array_keys(SierraLeoneEducation::NPSE_GRADE_SCALE));
    }

    public static function seederDefaults(string $schoolLevel): array
    {
        return match ($schoolLevel) {
            'early_childhood' => [
                ['grade' => 'Excellent',    'gpa' => 5.00, 'min_marks' => 90, 'max_marks' => 100, 'remarks' => 'Excellent',              'sort_order' => 1],
                ['grade' => 'Very Good',    'gpa' => 4.00, 'min_marks' => 75, 'max_marks' => 89,  'remarks' => 'Very Good',              'sort_order' => 2],
                ['grade' => 'Good',         'gpa' => 3.00, 'min_marks' => 60, 'max_marks' => 74,  'remarks' => 'Good',                   'sort_order' => 3],
                ['grade' => 'Fair',         'gpa' => 2.00, 'min_marks' => 40, 'max_marks' => 59,  'remarks' => 'Fair',                   'sort_order' => 4],
                ['grade' => 'Needs Improvement', 'gpa' => 1.00, 'min_marks' => 0, 'max_marks' => 39, 'remarks' => 'Needs Improvement', 'sort_order' => 5],
            ],
            'primary' => self::defaultScales(),
            'junior_secondary' => self::wassceScales(),
            'senior_secondary' => self::wassceScales(),
            default => self::defaultScales(),
        };
    }
}
