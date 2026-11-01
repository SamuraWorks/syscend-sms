<?php

namespace App\Http\Controllers;

use App\Models\Student;
use App\Models\SuccessScore;
use App\Models\StudentGoal;
use App\Models\StudentAchievement;
use App\Models\StudentAlert;
use App\Models\Intervention;
use App\Services\StudentPerformanceEngine;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class StudentPerformanceController extends Controller
{
    public function dashboard(Request $request)
    {
        $user = Auth::user();
        $student = Student::where('school_id', $user->school_id)->where('user_id', $user->id)->first();

        if (!$student) {
            return back()->withErrors('No student profile found.');
        }

        $engine = new StudentPerformanceEngine($user->school_id, $request->input('academic_year_id'), $request->input('term_id'));
        $profile = $engine->getStudentProfile($student);

        return Inertia::render('Student/PerformanceDashboard', [
            'linked'  => true,
            'profile' => $profile,
        ]);
    }

    public function goals(Request $request)
    {
        $user = Auth::user();
        $student = Student::where('school_id', $user->school_id)->where('user_id', $user->id)->first();

        $goals = StudentGoal::where('student_id', $student->id)
            ->where('school_id', $user->school_id)
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return Inertia::render('Student/Goals', [
            'linked' => true,
            'goals'  => $goals,
        ]);
    }

    public function achievements(Request $request)
    {
        $user = Auth::user();
        $student = Student::where('school_id', $user->school_id)->where('user_id', $user->id)->first();

        $achievements = StudentAchievement::where('student_id', $student->id)
            ->where('school_id', $user->school_id)
            ->orderBy('awarded_at', 'desc')
            ->paginate(20);

        return Inertia::render('Student/Achievements', [
            'linked'       => true,
            'achievements' => $achievements,
        ]);
    }
}
