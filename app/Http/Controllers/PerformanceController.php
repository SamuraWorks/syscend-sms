<?php

namespace App\Http\Controllers;

use App\Models\Student;
use App\Models\Staff;
use App\Models\Intervention;
use App\Models\InterventionNote;
use App\Models\StudentAlert;
use App\Models\StudentBehavior;
use App\Models\StudentGoal;
use App\Models\StudentAchievement;
use App\Models\SuccessScore;
use App\Models\AcademicYear;
use App\Models\AcademicTerm;
use App\Services\StudentPerformanceEngine;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class PerformanceController extends Controller
{
    protected function engine(int $schoolId, ?int $yearId = null, ?int $termId = null): StudentPerformanceEngine
    {
        return new StudentPerformanceEngine($schoolId, $yearId, $termId);
    }

    protected function schoolId(): int
    {
        return Auth::user()->school_id;
    }

    protected function currentYearId(): ?int
    {
        return AcademicYear::where('school_id', $this->schoolId())->where('is_current', true)->value('id');
    }

    protected function currentTermId(): ?int
    {
        return AcademicTerm::where('school_id', $this->schoolId())->where('is_current', true)->value('id');
    }

    public function overview(Request $request)
    {
        $schoolId = $this->schoolId();
        $yearId = $request->input('academic_year_id') ?: $this->currentYearId();
        $termId = $request->input('term_id') ?: $this->currentTermId();

        $engine = $this->engine($schoolId, $yearId, $termId);

        $summary = $engine->getSummaryStats();
        $topStudents = $engine->getTopStudents('school', 10);
        $atRiskStudents = $engine->getStudentsRequiringAttention(10);
        $improvedStudents = $engine->getMostImprovedStudents(10);
        $departmentPerformance = $engine->getDepartmentPerformance();
        $subjectPerformance = $engine->getSubjectPerformance();

        $recentAlerts = StudentAlert::where('school_id', $schoolId)
            ->where('is_read', false)
            ->with('student:id,first_name,last_name')
            ->orderBy('created_at', 'desc')
            ->take(10)
            ->get();

        return Inertia::render('Performance/Overview', [
            'linked'                => true,
            'summary'               => $summary,
            'topStudents'           => $topStudents,
            'atRiskStudents'        => $atRiskStudents,
            'improvedStudents'      => $improvedStudents,
            'departmentPerformance' => $departmentPerformance,
            'subjectPerformance'    => $subjectPerformance,
            'recentAlerts'          => $recentAlerts,
            'academicYearId'        => $yearId,
            'termId'                => $termId,
        ]);
    }

    public function recalculate(Request $request)
    {
        $schoolId = $this->schoolId();
        $yearId = $request->input('academic_year_id') ?: $this->currentYearId();
        $termId = $request->input('term_id') ?: $this->currentTermId();

        $engine = $this->engine($schoolId, $yearId, $termId);
        $results = $engine->calculateAndSaveAll();

        return response()->json([
            'message' => 'Performance scores recalculated for ' . count($results) . ' students.',
            'count'   => count($results),
        ]);
    }

    public function studentProfile(Request $request, int $studentId)
    {
        $student = Student::where('school_id', $this->schoolId())->findOrFail($studentId);
        $engine = $this->engine($this->schoolId(), $request->input('academic_year_id'), $request->input('term_id'));

        $profile = $engine->getStudentProfile($student);

        return Inertia::render('Performance/StudentProfile', [
            'linked'   => true,
            'profile'  => $profile,
        ]);
    }

    public function topStudents(Request $request)
    {
        $engine = $this->engine($this->schoolId(), $request->input('academic_year_id'), $request->input('term_id'));
        $groupBy = $request->input('group_by', 'school');
        $limit = $request->input('limit', 50);

        $students = $engine->getTopStudents($groupBy, $limit);

        return Inertia::render('Performance/TopStudents', [
            'linked'   => true,
            'students' => $students,
            'groupBy'  => $groupBy,
        ]);
    }

    public function atRiskStudents(Request $request)
    {
        $engine = $this->engine($this->schoolId(), $request->input('academic_year_id'), $request->input('term_id'));
        $students = $engine->getStudentsRequiringAttention($request->input('limit', 50));

        return Inertia::render('Performance/AtRiskStudents', [
            'linked'   => true,
            'students' => $students,
        ]);
    }

    public function mostImproved(Request $request)
    {
        $engine = $this->engine($this->schoolId(), $request->input('academic_year_id'), $request->input('term_id'));
        $students = $engine->getMostImprovedStudents($request->input('limit', 50));

        return Inertia::render('Performance/MostImproved', [
            'linked'   => true,
            'students' => $students,
        ]);
    }

    public function subjectPerformance(Request $request)
    {
        $engine = $this->engine($this->schoolId(), $request->input('academic_year_id'), $request->input('term_id'));
        $performance = $engine->getSubjectPerformance();

        return Inertia::render('Performance/SubjectPerformance', [
            'linked'      => true,
            'performance' => $performance,
        ]);
    }

    public function departmentPerformance(Request $request)
    {
        $engine = $this->engine($this->schoolId(), $request->input('academic_year_id'), $request->input('term_id'));
        $performance = $engine->getDepartmentPerformance();

        return Inertia::render('Performance/DepartmentPerformance', [
            'linked'      => true,
            'performance' => $performance,
        ]);
    }

    public function alerts(Request $request)
    {
        $query = StudentAlert::where('school_id', $this->schoolId())
            ->with('student:id,first_name,last_name,class_id');

        if ($request->input('type')) {
            $query->where('type', $request->input('type'));
        }
        if ($request->input('severity')) {
            $query->where('severity', $request->input('severity'));
        }
        if ($request->boolean('unread_only')) {
            $query->where('is_read', false);
        }

        $alerts = $query->orderBy('created_at', 'desc')->paginate(30);

        return Inertia::render('Performance/Alerts', [
            'linked' => true,
            'alerts' => $alerts,
        ]);
    }

    public function markAlertRead(int $id)
    {
        $alert = StudentAlert::where('school_id', $this->schoolId())->findOrFail($id);
        $alert->update(['is_read' => true]);

        return back();
    }

    public function interventions(Request $request)
    {
        $query = Intervention::where('school_id', $this->schoolId())
            ->with(['student:id,first_name,last_name,class_id', 'assignee:id,first_name,last_name']);

        if ($request->input('status')) {
            $query->where('status', $request->input('status'));
        }
        if ($request->input('type')) {
            $query->where('type', $request->input('type'));
        }
        if ($request->input('priority')) {
            $query->where('priority', $request->input('priority'));
        }

        $interventions = $query->orderBy('created_at', 'desc')->paginate(30);

        return Inertia::render('Performance/Interventions', [
            'linked'        => true,
            'interventions' => $interventions,
        ]);
    }

    public function storeIntervention(Request $request)
    {
        $validated = $request->validate([
            'student_id'          => 'required|exists:students,id',
            'type'                => 'required|string|max:50',
            'priority'            => 'required|string|in:low,medium,high,urgent',
            'title'               => 'required|string|max:200',
            'description'         => 'required|string',
            'assigned_to'         => 'nullable|exists:staff,id',
            'counsellor_id'       => 'nullable|exists:staff,id',
            'recommended_action'  => 'nullable|string|max:300',
            'start_date'          => 'required|date',
            'target_date'         => 'nullable|date|after_or_equal:start_date',
        ]);

        $validated['school_id'] = $this->schoolId();
        $validated['academic_year_id'] = $this->currentYearId();
        $validated['term_id'] = $this->currentTermId();
        $validated['created_by'] = Auth::id();

        $intervention = Intervention::create($validated);

        return back()->with('success', 'Intervention plan created.');
    }

    public function showIntervention(int $id)
    {
        $intervention = Intervention::where('school_id', $this->schoolId())
            ->with(['student:id,first_name,last_name,class_id', 'assignee:id,first_name,last_name', 'counsellor:id,first_name,last_name', 'notes.author:id,first_name,last_name'])
            ->findOrFail($id);

        return Inertia::render('Performance/InterventionDetail', [
            'linked'       => true,
            'intervention' => $intervention,
        ]);
    }

    public function updateIntervention(Request $request, int $id)
    {
        $intervention = Intervention::where('school_id', $this->schoolId())->findOrFail($id);

        $validated = $request->validate([
            'status'    => 'sometimes|string|in:active,in_progress,completed,closed,escalated',
            'priority'  => 'sometimes|string|in:low,medium,high,urgent',
            'outcome'   => 'nullable|string',
            'completed_at' => 'nullable|date',
        ]);

        $intervention->update($validated);

        return back()->with('success', 'Intervention updated.');
    }

    public function addInterventionNote(Request $request, int $id)
    {
        $intervention = Intervention::where('school_id', $this->schoolId())->findOrFail($id);

        $validated = $request->validate([
            'note'       => 'required|string',
            'note_type'  => 'required|string|in:follow_up,parent_meeting,counselling,medical,escalation,general',
            'visibility' => 'sometimes|string|in:internal,shared_with_parent,shared_with_student',
        ]);

        $validated['school_id'] = $this->schoolId();
        $validated['intervention_id'] = $intervention->id;
        $validated['author_id'] = Auth::user()->staff_id ?? Auth::id();

        InterventionNote::create($validated);

        return back()->with('success', 'Note added.');
    }

    public function behaviours(Request $request)
    {
        $query = StudentBehavior::where('school_id', $this->schoolId())
            ->with('student:id,first_name,last_name,class_id');

        if ($request->input('student_id')) {
            $query->where('student_id', $request->input('student_id'));
        }
        if ($request->input('category')) {
            $query->where('category', $request->input('category'));
        }

        $behaviours = $query->orderBy('occurred_at', 'desc')->paginate(30);

        return Inertia::render('Performance/Behaviours', [
            'linked'     => true,
            'behaviours' => $behaviours,
        ]);
    }

    public function storeBehaviour(Request $request)
    {
        $validated = $request->validate([
            'student_id'  => 'required|exists:students,id',
            'category'    => 'required|string|in:positive,negative,neutral',
            'type'        => 'required|string|max:80',
            'description' => 'required|string',
            'severity'    => 'required|string|in:minor,moderate,major,critical',
            'action_taken' => 'nullable|string|max:200',
            'occurred_at' => 'required|date',
        ]);

        $validated['school_id'] = $this->schoolId();
        $validated['academic_year_id'] = $this->currentYearId();
        $validated['term_id'] = $this->currentTermId();
        $validated['reported_by'] = Auth::user()->staff_id ?? Auth::id();

        $student = Student::find($validated['student_id']);
        $validated['class_id'] = $student?->class_id;

        StudentBehavior::create($validated);

        return back()->with('success', 'Behaviour record added.');
    }

    public function goals(Request $request)
    {
        $query = StudentGoal::where('school_id', $this->schoolId())
            ->with('student:id,first_name,last_name,class_id');

        if ($request->input('student_id')) {
            $query->where('student_id', $request->input('student_id'));
        }
        if ($request->input('status')) {
            $query->where('status', $request->input('status'));
        }

        $goals = $query->orderBy('created_at', 'desc')->paginate(30);

        return Inertia::render('Performance/Goals', [
            'linked' => true,
            'goals'  => $goals,
        ]);
    }

    public function storeGoal(Request $request)
    {
        $validated = $request->validate([
            'student_id'    => 'required|exists:students,id',
            'category'      => 'required|string|in:academic,attendance,behavior,personal,subject',
            'title'         => 'required|string|max:200',
            'description'   => 'nullable|string',
            'target_value'  => 'nullable|string|max:100',
            'start_date'    => 'required|date',
            'target_date'   => 'nullable|date|after_or_equal:start_date',
        ]);

        $validated['school_id'] = $this->schoolId();
        $validated['academic_year_id'] = $this->currentYearId();
        $validated['term_id'] = $this->currentTermId();

        StudentGoal::create($validated);

        return back()->with('success', 'Goal created.');
    }

    public function achievements(Request $request)
    {
        $query = StudentAchievement::where('school_id', $this->schoolId())
            ->with('student:id,first_name,last_name,class_id');

        if ($request->input('student_id')) {
            $query->where('student_id', $request->input('student_id'));
        }
        if ($request->input('category')) {
            $query->where('category', $request->input('category'));
        }

        $achievements = $query->orderBy('awarded_at', 'desc')->paginate(30);

        return Inertia::render('Performance/Achievements', [
            'linked'       => true,
            'achievements' => $achievements,
        ]);
    }
}
