<?php

namespace App\Http\Controllers;

use App\Models\School;
use App\Models\SuccessScore;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class SuperAdminPerformanceController extends Controller
{
    public function dashboard(Request $request)
    {
        $schools = School::withCount(['students' => fn ($q) => $q->where('status', 'active')])
            ->get();

        if ($schools->isEmpty()) {
            return Inertia::render('SuperAdmin/PlatformPerformance', [
                'hasSchools'       => false,
                'schoolStats'      => [],
                'bestPerforming'   => [],
                'lowestPerforming' => [],
                'totalSchools'     => 0,
                'totalStudents'    => 0,
                'platformAverage'  => 0,
            ]);
        }

        $schoolStats = $schools->map(function ($school) {
            $currentYearId = DB::table('academic_years')
                ->where('school_id', $school->id)
                ->where('is_current', true)
                ->value('id');

            $scores = SuccessScore::where('school_id', $school->id)
                ->when($currentYearId, fn ($q) => $q->where('academic_year_id', $currentYearId))
                ->get();

            $total = $scores->count();
            $avgScore = $scores->avg('total_score');
            $avg = $total > 0 && $avgScore !== null ? round((float) $avgScore, 2) : 0;
            $promoted = $total > 0
                ? round($scores->whereIn('classification', ['excellent', 'good'])->count() / $total * 100, 1)
                : 0;
            $atRisk = $scores->whereIn('classification', ['needs_support', 'critical'])->count();

            return [
                'school_id'     => $school->id,
                'school_name'   => $school->name,
                'student_count' => $school->students_count,
                'average_score' => $avg,
                'promotion_rate' => $promoted,
                'at_risk_count' => $atRisk,
                'classification_distribution' => [
                    'excellent'        => $scores->where('classification', 'excellent')->count(),
                    'good'             => $scores->where('classification', 'good')->count(),
                    'needs_monitoring' => $scores->where('classification', 'needs_monitoring')->count(),
                    'needs_support'    => $scores->where('classification', 'needs_support')->count(),
                    'critical'         => $scores->where('classification', 'critical')->count(),
                ],
            ];
        })->sortByDesc('average_score')->values();

        $bestPerforming = $schoolStats->take(10);
        $lowestPerforming = $schoolStats->take(-10);
        $totalSchools = $schools->count();
        $totalStudents = (int) $schools->sum('students_count');
        $platformAvg = $schoolStats->count() > 0
            ? round((float) $schoolStats->avg('average_score'), 2)
            : 0;

        return Inertia::render('SuperAdmin/PlatformPerformance', [
            'hasSchools'       => true,
            'schoolStats'      => $schoolStats,
            'bestPerforming'   => $bestPerforming,
            'lowestPerforming' => $lowestPerforming,
            'totalSchools'     => $totalSchools,
            'totalStudents'    => $totalStudents,
            'platformAverage'  => $platformAvg,
        ]);
    }
}
