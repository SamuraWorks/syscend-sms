<?php

namespace App\Http\Controllers;

use App\Models\Student;
use App\Models\Staff;
use App\Models\Mark;
use App\Models\Subject;
use App\Models\SuccessScore;
use App\Models\StudentAlert;
use App\Models\StudentBehavior;
use App\Services\StudentPerformanceEngine;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class TeacherPerformanceController extends Controller
{
    protected function getTeacher(): Staff
    {
        $user = Auth::user();
        return Staff::where('school_id', $user->school_id)->where('user_id', $user->id)->firstOrFail();
    }

    public function dashboard(Request $request)
    {
        $teacher = $this->getTeacher();
        $schoolId = $teacher->school_id;
        $engine = new StudentPerformanceEngine($schoolId, $request->input('academic_year_id'), $request->input('term_id'));

        $summary = $engine->getSummaryStats();

        $subjectStudents = $this->getSubjectTeacherStudents($teacher);
        $formMasterStudents = $teacher->isFormMaster() ? $this->getFormMasterStudents($teacher) : null;

        $recentAlerts = StudentAlert::where('school_id', $schoolId)
            ->whereIn('student_id', $subjectStudents->pluck('id'))
            ->where('is_read', false)
            ->with('student:id,first_name,last_name')
            ->orderBy('created_at', 'desc')
            ->take(10)
            ->get();

        return Inertia::render('Teacher/PerformanceDashboard', [
'linked' => true,
            'summary'             => $summary,
            'subjectStudents'     => $subjectStudents,
            'formMasterStudents'  => $formMasterStudents,
            'isFormMaster'        => $teacher->isFormMaster(),
            'recentAlerts'        => $recentAlerts,
        ]);
    }

    public function studentDetail(Request $request, int $studentId)
    {
        $teacher = $this->getTeacher();
        $student = Student::where('school_id', $teacher->school_id)->findOrFail($studentId);
        $engine = new StudentPerformanceEngine($teacher->school_id, $request->input('academic_year_id'), $request->input('term_id'));
        $profile = $engine->getStudentProfile($student);

        $teacherSubjects = $teacher->subjects?->pluck('id') ?? collect();
        $filteredSubjects = collect($profile['current_score']['subject_scores'] ?? [])
            ->filter(fn($s, $k) => $teacherSubjects->contains($k));

        $profile['teacher_subject_scores'] = $filteredSubjects;

        return Inertia::render('Teacher/StudentPerformanceDetail', [
            'linked'  => true,
            'profile' => $profile,
        ]);
    }

    public function classPerformance(Request $request)
    {
        $teacher = $this->getTeacher();
        if (!$teacher->isFormMaster()) {
            return back()->withErrors('Only form masters can view class performance.');
        }

        $classId = $teacher->form_master_class_id;
        $sectionId = $teacher->form_master_section_id;

        $students = Student::where('school_id', $teacher->school_id)
            ->where('class_id', $classId)
            ->when($sectionId, fn($q) => $q->where('section_id', $sectionId))
            ->where('status', 'active')
            ->with('schoolClass:id,name')
            ->get();

        $engine = new StudentPerformanceEngine($teacher->school_id, $request->input('academic_year_id'), $request->input('term_id'));

        $studentScores = $students->map(function ($student) use ($engine) {
            return $engine->calculateForStudent($student);
        })->sortByDesc('total_score')->values();

        $behaviours = StudentBehavior::where('school_id', $teacher->school_id)
            ->where('class_id', $classId)
            ->when($sectionId, fn($q) => $q->where('section_id', $sectionId))
            ->orderBy('occurred_at', 'desc')
            ->take(20)
            ->get();

        return Inertia::render('Teacher/ClassPerformance', [
            'linked'         => true,
            'students'       => $studentScores,
            'studentModels'  => $students,
            'behaviours'     => $behaviours,
            'classId'        => $classId,
            'sectionId'      => $sectionId,
        ]);
    }

    protected function getSubjectTeacherStudents(Staff $teacher): \Illuminate\Support\Collection
    {
        $subjectIds = $teacher->subjects?->pluck('id') ?? collect();
        if ($subjectIds->isEmpty()) return collect();

        $studentIds = Mark::whereHas('exam', fn($q) => $q->where('school_id', $teacher->school_id))
            ->whereIn('subject_id', $subjectIds)
            ->pluck('student_id')
            ->unique();

        return Student::whereIn('id', $studentIds)->where('status', 'active')
            ->with('schoolClass:id,name')
            ->get()
            ->map(function ($student) use ($teacher) {
                $engine = new StudentPerformanceEngine($teacher->school_id);
                $score = $engine->calculateForStudent($student);
                return [
                    'student' => $student,
                    'score'   => $score['total_score'],
                    'classification' => $score['classification'],
                ];
            })
            ->sortByDesc('score')
            ->values();
    }

    protected function getFormMasterStudents(Staff $teacher): \Illuminate\Support\Collection
    {
        $students = Student::where('school_id', $teacher->school_id)
            ->where('class_id', $teacher->form_master_class_id)
            ->when($teacher->form_master_section_id, fn($q) => $q->where('section_id', $teacher->form_master_section_id))
            ->where('status', 'active')
            ->with('schoolClass:id,name', 'section:id,name')
            ->get();

        $engine = new StudentPerformanceEngine($teacher->school_id);

        return $students->map(function ($student) use ($engine) {
            $score = $engine->calculateForStudent($student);
            return [
                'student' => $student,
                'score'   => $score,
            ];
        })->sortByDesc(fn($s) => $s['score']['total_score'])->values();
    }
}
