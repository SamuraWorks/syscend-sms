<?php

namespace App\Http\Controllers;

use App\Models\Student;
use App\Models\Staff;
use App\Models\SchoolClass;
use App\Models\Section;
use App\Models\AcademicYear;
use App\Models\AcademicTerm;
use App\Models\SuccessScore;
use App\Models\StudentAlert;
use App\Models\Intervention;
use App\Services\StudentPerformanceEngine;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class PrincipalPerformanceController extends Controller
{
    protected function engine(?int $yearId = null, ?int $termId = null): StudentPerformanceEngine
    {
        return new StudentPerformanceEngine(Auth::user()->school_id, $yearId, $termId);
    }

    public function dashboard(Request $request)
    {
        $schoolId = Auth::user()->school_id;
        $yearId = $request->input('academic_year_id');
        $termId = $request->input('term_id');

        $engine = $this->engine($yearId, $termId);
        $summary = $engine->getSummaryStats();
        $topStudents = $engine->getTopStudents('school', 10);
        $atRiskStudents = $engine->getStudentsRequiringAttention(10);
        $improvedStudents = $engine->getMostImprovedStudents(10);
        $departmentPerformance = $engine->getDepartmentPerformance();
        $subjectPerformance = $engine->getSubjectPerformance();

        $totalStudents = \App\Models\Student::where('school_id', $schoolId)->where('status', 'active')->count();
        $totalStaff = Staff::where('school_id', $schoolId)->where('status', 'active')->count();
        $totalClasses = SchoolClass::where('school_id', $schoolId)->count();

        $recentAlerts = StudentAlert::where('school_id', $schoolId)
            ->where('is_read', false)
            ->with('student:id,first_name,last_name')
            ->orderBy('created_at', 'desc')
            ->take(10)
            ->get();

        $activeInterventions = Intervention::where('school_id', $schoolId)
            ->where('status', 'active')
            ->with('student:id,first_name,last_name')
            ->count();

        return Inertia::render('Principal/PerformanceDashboard', [
'linked' => true,
            'summary'               => $summary,
            'topStudents'           => $topStudents,
            'atRiskStudents'        => $atRiskStudents,
            'improvedStudents'      => $improvedStudents,
            'departmentPerformance' => $departmentPerformance,
            'subjectPerformance'    => $subjectPerformance,
            'recentAlerts'          => $recentAlerts,
            'totalStudents'         => $totalStudents,
            'totalStaff'            => $totalStaff,
            'totalClasses'          => $totalClasses,
            'activeInterventions'   => $activeInterventions,
            'academicYearId'        => $yearId,
            'termId'                => $termId,
        ]);
    }

    public function studentDetail(Request $request, int $studentId)
    {
        $student = Student::where('school_id', Auth::user()->school_id)->findOrFail($studentId);
        $engine = $this->engine($request->input('academic_year_id'), $request->input('term_id'));
        $profile = $engine->getStudentProfile($student);

        return Inertia::render('Principal/StudentPerformanceDetail', [
            'linked'  => true,
            'profile' => $profile,
        ]);
    }
}
