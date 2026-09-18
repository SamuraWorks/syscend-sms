<?php

namespace App\Http\Controllers;

use App\Models\Student;
use App\Models\Guardian;
use App\Models\SuccessScore;
use App\Services\StudentPerformanceEngine;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class ParentPerformanceController extends Controller
{
    public function dashboard(Request $request)
    {
        $user = Auth::user();
        $guardian = Guardian::where('school_id', $user->school_id)->where('user_id', $user->id)->first();

        if (!$guardian) {
            return back()->withErrors('No guardian profile found.');
        }

        $children = Student::where('school_id', $user->school_id)
            ->where('guardian_id', $guardian->id)
            ->where('status', 'active')
            ->get();

        $childData = $children->map(function ($child) use ($request) {
            $engine = new StudentPerformanceEngine($child->school_id, $request->input('academic_year_id'), $request->input('term_id'));
            return $engine->getStudentProfile($child);
        });

        return Inertia::render('Parent/PerformanceDashboard', [
'linked' => true,
            'children' => $childData,
        ]);
    }

    public function childDetail(Request $request, int $childId)
    {
        $user = Auth::user();
        $guardian = Guardian::where('school_id', $user->school_id)->where('user_id', $user->id)->first();

        $student = Student::where('school_id', $user->school_id)
            ->where('guardian_id', $guardian->id)
            ->where('id', $childId)
            ->firstOrFail();

        $engine = new StudentPerformanceEngine($user->school_id, $request->input('academic_year_id'), $request->input('term_id'));
        $profile = $engine->getStudentProfile($student);

        return Inertia::render('Parent/ChildPerformanceDetail', [
            'linked'  => true,
            'profile' => $profile,
        ]);
    }
}
