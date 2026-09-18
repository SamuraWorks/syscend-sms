<?php

namespace App\Http\Controllers;

use App\Models\Student;
use App\Models\Staff;
use App\Models\SchoolClass;
use App\Models\AcademicYear;
use App\Models\AcademicTerm;
use App\Models\SuccessScore;
use App\Services\StudentPerformanceEngine;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class ProprietorPerformanceController extends Controller
{
    protected function engine(?int $yearId = null, ?int $termId = null): StudentPerformanceEngine
    {
        return new StudentPerformanceEngine(Auth::user()->school_id, $yearId, $termId);
    }

    public function dashboard(Request $request)
    {
        $schoolId = Auth::user()->school_id;
        $engine = $this->engine($request->input('academic_year_id'), $request->input('term_id'));
        $summary = $engine->getSummaryStats();
        $departmentPerformance = $engine->getDepartmentPerformance();
        $topStudents = $engine->getTopStudents('school', 10);
        $atRiskStudents = $engine->getStudentsRequiringAttention(5);
        $subjectPerformance = $engine->getSubjectPerformance();

        $totalStudents = Student::where('school_id', $schoolId)->where('status', 'active')->count();
        $totalStaff = Staff::where('school_id', $schoolId)->where('status', 'active')->count();

        $promotionData = $this->getPromotionStats($schoolId);

        return Inertia::render('Proprietor/AcademicOverview', [
'linked' => true,
            'summary'               => $summary,
            'topStudents'           => $topStudents,
            'atRiskStudents'        => $atRiskStudents,
            'departmentPerformance' => $departmentPerformance,
            'subjectPerformance'    => $subjectPerformance,
            'totalStudents'         => $totalStudents,
            'totalStaff'            => $totalStaff,
            'promotionData'         => $promotionData,
        ]);
    }

    protected function getPromotionStats(int $schoolId): array
    {
        $scores = SuccessScore::where('school_id', $schoolId)
            ->where('academic_year_id', Auth::user()->school_id ? AcademicYear::where('school_id', $schoolId)->where('is_current', true)->value('id') : null)
            ->get();

        $total = $scores->count();
        if ($total === 0) return ['total' => 0, 'promoted' => 0, 'at_risk' => 0, 'promotion_rate' => 0];

        $promoted = $scores->whereIn('classification', ['excellent', 'good'])->count();
        $atRisk = $scores->whereIn('classification', ['needs_support', 'critical'])->count();

        return [
            'total'           => $total,
            'promoted'        => $promoted,
            'at_risk'         => $atRisk,
            'promotion_rate'  => round(($promoted / $total) * 100, 1),
        ];
    }
}
