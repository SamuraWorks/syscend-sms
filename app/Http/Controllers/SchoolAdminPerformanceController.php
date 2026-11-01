<?php

namespace App\Http\Controllers;

use App\Models\Student;
use App\Models\Guardian;
use App\Models\SchoolClass;
use App\Models\Section;
use App\Models\Staff;
use App\Models\SuccessScore;
use App\Models\StudentAlert;
use App\Services\StudentPerformanceEngine;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class SchoolAdminPerformanceController extends Controller
{
    public function dashboard(Request $request)
    {
        $schoolId = Auth::user()->school_id;
        $engine = new StudentPerformanceEngine($schoolId, $request->input('academic_year_id'), $request->input('term_id'));

        $summary = $engine->getSummaryStats();
        $topStudents = $engine->getTopStudents('school', 10);
        $atRiskStudents = $engine->getStudentsRequiringAttention(10);
        $departmentPerformance = $engine->getDepartmentPerformance();

        $studentsWithoutGuardians = Student::where('school_id', $schoolId)
            ->whereNull('guardian_id')
            ->where('status', 'active')
            ->count();

        $studentsWithoutClass = Student::where('school_id', $schoolId)
            ->whereNull('class_id')
            ->where('status', 'active')
            ->count();

        $studentsWithoutPhoto = Student::where('school_id', $schoolId)
            ->whereNull('photo')
            ->where('status', 'active')
            ->count();

        return Inertia::render('SchoolAdmin/PerformanceDashboard', [
'linked' => true,
            'summary'                => $summary,
            'topStudents'            => $topStudents,
            'atRiskStudents'         => $atRiskStudents,
            'departmentPerformance'  => $departmentPerformance,
            'studentsWithoutGuardians' => $studentsWithoutGuardians,
            'studentsWithoutClass'   => $studentsWithoutClass,
            'studentsWithoutPhoto'   => $studentsWithoutPhoto,
        ]);
    }
}
