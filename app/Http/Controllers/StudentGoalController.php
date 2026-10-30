<?php

namespace App\Http\Controllers;

use App\Models\Student;
use App\Models\StudentGoal;
use App\Services\FamilyResolver;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;

class StudentGoalController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();
        $students = $this->authorizedStudents($user);
        $selectedId = (int) $request->integer('student_id', $students->first()?->id);
        $student = $students->firstWhere('id', $selectedId) ?? $students->first();

        $goals = $student
            ? StudentGoal::where('school_id', $user->school_id)->where('student_id', $student->id)->latest()->paginate(50)->withQueryString()
            : StudentGoal::whereRaw('1 = 0')->paginate(50);

        return Inertia::render('Student/Goals', [
            'linked' => $student !== null,
            'canManage' => $this->canManage($user),
            'students' => $students->map(fn (Student $item) => ['id' => $item->id, 'name' => $item->full_name])->values(),
            'selectedStudentId' => $student?->id,
            'goals' => $goals,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'student_id' => ['required', 'integer'],
            'category' => ['required', 'string', 'max:50'],
            'title' => ['required', 'string', 'max:200'],
            'description' => ['nullable', 'string', 'max:2000'],
            'target_value' => ['nullable', 'string', 'max:100'],
            'target_date' => ['nullable', 'date'],
        ]);
        $user = $request->user();
        $student = $this->authorizedStudents($user)->firstWhere('id', (int) $data['student_id']);
        abort_unless($student, 403);

        StudentGoal::create([
            ...$data,
            'school_id' => $user->school_id,
            'student_id' => $student->id,
            'start_date' => Carbon::today(),
            'status' => 'active',
            'progress' => 0,
        ]);

        return back()->with('success', 'Learning goal created.');
    }

    public function update(Request $request, StudentGoal $goal): RedirectResponse
    {
        abort_unless($this->authorizedStudents($request->user())->contains('id', $goal->student_id), 403);
        $data = $request->validate(['progress' => ['required', 'numeric', 'min:0', 'max:100'], 'status' => ['required', 'in:active,achieved,missed,abandoned'], 'notes' => ['nullable', 'string', 'max:2000']]);
        $goal->update($data);
        return back()->with('success', 'Goal progress updated.');
    }

    private function authorizedStudents($user)
    {
        if ($user->hasRole('student')) return Student::where('school_id', $user->school_id)->where('user_id', $user->id)->get();
        if ($user->hasRole('parent')) return app(FamilyResolver::class)->childrenForUser($user);
        abort(403);
    }

    private function canManage($user): bool
    {
        return $user->hasAnyRole(['student', 'parent']);
    }
}
