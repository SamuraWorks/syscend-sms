<?php

namespace App\Services;

use App\Models\Student;
use App\Models\Mark;
use App\Models\Attendance;
use App\Models\Homework;
use App\Models\HomeworkSubmission;
use App\Models\StudentBehavior;
use App\Models\SuccessScore;
use App\Models\StudentAlert;
use App\Models\StudentAchievement;
use App\Models\StudentPerformanceSnapshot;
use App\Models\AcademicYear;
use App\Models\AcademicTerm;
use App\Models\SchoolClass;
use App\Models\Subject;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class StudentPerformanceEngine
{
    protected int $schoolId;
    protected ?int $academicYearId;
    protected ?int $termId;

    public function __construct(int $schoolId, ?int $academicYearId = null, ?int $termId = null)
    {
        $this->schoolId = $schoolId;
        $this->academicYearId = $academicYearId ?? $this->getCurrentYearId();
        $this->termId = $termId ?? $this->getCurrentTermId();
    }

    public function calculateForStudent(Student $student): array
    {
        $academicScore = $this->calculateAcademicScore($student);
        $attendanceScore = $this->calculateAttendanceScore($student);
        $homeworkScore = $this->calculateHomeworkScore($student);
        $behaviorScore = $this->calculateBehaviorScore($student);
        $participationScore = $this->calculateParticipationScore($student);

        $totalScore = $academicScore['score'] + $attendanceScore['score'] + $homeworkScore['score']
                    + $behaviorScore['score'] + $participationScore['score'];

        $classification = $this->classify($totalScore);

        return [
            'student_id'          => $student->id,
            'academic_score'      => round($academicScore['score'], 2),
            'attendance_score'    => round($attendanceScore['score'], 2),
            'homework_score'      => round($homeworkScore['score'], 2),
            'behavior_score'      => round($behaviorScore['score'], 2),
            'participation_score' => round($participationScore['score'], 2),
            'total_score'         => round($totalScore, 2),
            'classification'      => $classification,
            'subject_scores'      => $academicScore['subject_scores'] ?? [],
            'metadata' => [
                'academic_detail'      => $academicScore,
                'attendance_detail'    => $attendanceScore,
                'homework_detail'      => $homeworkScore,
                'behavior_detail'      => $behaviorScore,
                'participation_detail' => $participationScore,
            ],
        ];
    }

    public function calculateAcademicScore(Student $student): array
    {
        $marks = Mark::where('student_id', $student->id)
            ->whereHas('exam', fn($q) => $q->where('academic_year_id', $this->academicYearId)
                ->when($this->termId, fn($q) => $q->where('term_id', $this->termId))
                ->where('status', 'published')
            )
            ->with('subject:id,name,full_marks')
            ->get();

        if ($marks->isEmpty()) {
            return ['score' => 0, 'average_percentage' => 0, 'subject_scores' => [], 'subject_count' => 0];
        }

        $subjectGroups = $marks->groupBy('subject_id');
        $subjectScores = [];
        $totalPercentage = 0;
        $validSubjects = 0;

        foreach ($subjectGroups as $subjectId => $subjectMarks) {
            $subject = $subjectMarks->first()->subject;
            $fullMarks = $subject->full_marks ?? 100;
            $validMarks = $subjectMarks->where('is_absent', false);

            if ($validMarks->isEmpty()) continue;

            $avgObtained = $validMarks->avg('marks_obtained') ?? 0;
            $percentage = ($avgObtained / $fullMarks) * 100;

            $subjectScores[$subjectId] = [
                'subject_name'      => $subject->name ?? 'Unknown',
                'average_obtained'  => round($avgObtained, 2),
                'full_marks'        => $fullMarks,
                'percentage'        => round($percentage, 2),
                'grade'             => $validMarks->last()->grade ?? null,
                'mark_count'        => $validMarks->count(),
            ];

            $totalPercentage += $percentage;
            $validSubjects++;
        }

        $averagePercentage = $validSubjects > 0 ? $totalPercentage / $validSubjects : 0;
        $score = ($averagePercentage / 100) * 50;

        return [
            'score'              => round(min(50, max(0, $score)), 2),
            'average_percentage' => round($averagePercentage, 2),
            'subject_scores'     => $subjectScores,
            'subject_count'      => $validSubjects,
        ];
    }

    public function calculateAttendanceScore(Student $student): array
    {
        $query = Attendance::where('attendable_type', Student::class)
            ->where('attendable_id', $student->id)
            ->where('school_id', $this->schoolId);

        if ($this->academicYearId) {
            $query->where('academic_year_id', $this->academicYearId);
        }

        $records = $query->get();

        $totalDays = $records->count();
        if ($totalDays === 0) {
            return ['score' => 15, 'percentage' => 100, 'present' => 0, 'absent' => 0, 'late' => 0, 'total' => 0];
        }

        $present = $records->where('status', 'present')->count();
        $late = $records->where('status', 'late')->count();
        $halfDay = $records->where('status', 'half_day')->count();
        $absent = $records->where('status', 'absent')->count();

        $effectivePresent = $present + ($halfDay * 0.5);
        $percentage = ($effectivePresent / $totalDays) * 100;

        $score = ($percentage / 100) * 20;

        return [
            'score'      => round(min(20, max(0, $score)), 2),
            'percentage' => round($percentage, 2),
            'present'    => $present,
            'absent'     => $absent,
            'late'       => $late,
            'half_day'   => $halfDay,
            'total'      => $totalDays,
        ];
    }

    public function calculateHomeworkScore(Student $student): array
    {
        $classId = $student->class_id;

        $totalHomework = Homework::where('school_id', $this->schoolId)
            ->where('class_id', $classId)
            ->where('is_active', true)
            ->count();

        if ($totalHomework === 0) {
            return ['score' => 7, 'completion_rate' => 100, 'completed' => 0, 'total' => 0, 'missing' => 0];
        }

        $submitted = HomeworkSubmission::where('student_id', $student->id)
            ->whereIn('status', ['submitted', 'reviewed'])
            ->count();

        $missing = $totalHomework - $submitted;
        $completionRate = ($submitted / $totalHomework) * 100;
        $score = ($completionRate / 100) * 10;

        return [
            'score'           => round(min(10, max(0, $score)), 2),
            'completion_rate' => round($completionRate, 2),
            'completed'       => $submitted,
            'total'           => $totalHomework,
            'missing'         => $missing,
        ];
    }

    public function calculateBehaviorScore(Student $student): array
    {
        $query = StudentBehavior::where('student_id', $student->id)
            ->where('school_id', $this->schoolId);

        if ($this->academicYearId) {
            $query->where('academic_year_id', $this->academicYearId);
        }
        if ($this->termId) {
            $query->where('term_id', $this->termId);
        }

        $behaviors = $query->get();

        $positive = $behaviors->where('category', 'positive')->count();
        $negative = $behaviors->where('category', 'negative')->count();
        $total = $behaviors->count();

        if ($total === 0) {
            return ['score' => 7, 'positive' => 0, 'negative' => 0, 'total' => 0, 'ratio' => 1];
        }

        $netScore = $positive - $negative;
        $ratio = $total > 0 ? ($positive + 1) / ($total + 2) : 0.5;

        $score = $ratio * 10;

        return [
            'score'    => round(min(10, max(0, $score)), 2),
            'positive' => $positive,
            'negative' => $negative,
            'total'    => $total,
            'ratio'    => round($ratio, 2),
        ];
    }

    public function calculateParticipationScore(Student $student): array
    {
        $marks = Mark::where('student_id', $student->id)
            ->whereHas('exam', fn($q) => $q->where('academic_year_id', $this->academicYearId))
            ->get();

        $absentCount = $marks->where('is_absent', true)->count();
        $totalMarks = $marks->count();

        $hasRemarks = $marks->where('remarks', '!=', null)->count();

        if ($totalMarks === 0) {
            return ['score' => 5, 'exam_participation_rate' => 100, 'has_teacher_remarks' => false];
        }

        $examParticipation = (($totalMarks - $absentCount) / $totalMarks) * 100;
        $score = ($examParticipation / 100) * 7 + min(3, $hasRemarks * 0.5);

        return [
            'score'                  => round(min(10, max(0, $score)), 2),
            'exam_participation_rate' => round($examParticipation, 2),
            'has_teacher_remarks'    => $hasRemarks > 0,
        ];
    }

    public function classify(float $score): string
    {
        return match (true) {
            $score >= 80 => 'excellent',
            $score >= 60 => 'good',
            $score >= 40 => 'needs_monitoring',
            $score >= 20 => 'needs_support',
            default      => 'critical',
        };
    }

    public function getClassificationColor(string $classification): string
    {
        return match ($classification) {
            'excellent'        => 'green',
            'good'             => 'blue',
            'needs_monitoring' => 'yellow',
            'needs_support'    => 'orange',
            'critical'         => 'red',
            default            => 'gray',
        };
    }

    public function getClassificationIcon(string $classification): string
    {
        return match ($classification) {
            'excellent'        => 'check-circle',
            'good'             => 'thumbs-up',
            'needs_monitoring' => 'alert-triangle',
            'needs_support'    => 'alert-circle',
            'critical'         => 'x-circle',
            default            => 'help-circle',
        };
    }

    public function calculateAndSaveAll(): array
    {
        $students = Student::where('school_id', $this->schoolId)->where('status', 'active')->get();
        $results = [];

        foreach ($students as $student) {
            $scoreData = $this->calculateForStudent($student);

            $saved = SuccessScore::updateOrCreate(
                [
                    'school_id'       => $this->schoolId,
                    'student_id'      => $student->id,
                    'academic_year_id' => $this->academicYearId,
                    'term_id'         => $this->termId,
                ],
                [
                    'class_id'              => $student->class_id,
                    'academic_score'        => $scoreData['academic_score'],
                    'attendance_score'      => $scoreData['attendance_score'],
                    'homework_score'        => $scoreData['homework_score'],
                    'behavior_score'        => $scoreData['behavior_score'],
                    'participation_score'   => $scoreData['participation_score'],
                    'total_score'           => $scoreData['total_score'],
                    'classification'        => $scoreData['classification'],
                    'subject_scores'        => $scoreData['subject_scores'],
                    'metadata'              => $scoreData['metadata'],
                ]
            );

            $results[] = array_merge($scoreData, ['record_id' => $saved->id]);
        }

        $this->calculateRankings($results);
        $this->generateAlerts($results);
        $this->autoAwardAchievements($results);

        return $results;
    }

    public function calculateRankings(array $results): void
    {
        $sorted = collect($results)->sortByDesc('total_score')->values()->toArray();

        $schoolRank = 1;
        foreach ($sorted as &$result) {
            SuccessScore::where('student_id', $result['student_id'])
                ->where('academic_year_id', $this->academicYearId)
                ->where('term_id', $this->termId)
                ->update(['school_rank' => $schoolRank++, 'total_students_in_school' => count($sorted)]);
        }

        $classGroups = collect($sorted)->groupBy(fn($r) => collect($results)->firstWhere('student_id', $r['student_id'])['metadata']['academic_detail']['class_id'] ?? null);

        foreach ($classGroups as $classId => $classResults) {
            if (!$classId) continue;
            $classRank = 1;
            foreach ($classResults as $result) {
                SuccessScore::where('student_id', $result['student_id'])
                    ->where('academic_year_id', $this->academicYearId)
                    ->where('term_id', $this->termId)
                    ->update([
                        'class_rank'              => $classRank++,
                        'total_students_in_class' => $classResults->count(),
                    ]);
            }
        }
    }

    public function generateAlerts(array $results): void
    {
        foreach ($results as $result) {
            if ($result['classification'] === 'critical') {
                StudentAlert::updateOrCreate(
                    [
                        'school_id'  => $this->schoolId,
                        'student_id' => $result['student_id'],
                        'type'       => 'low_grades',
                    ],
                    [
                        'severity' => 'critical',
                        'title'    => 'Critical Performance Alert',
                        'message'  => "Student score is {$result['total_score']}% (Critical). Immediate intervention required.",
                        'data'     => $result,
                    ]
                );
            }

            if ($result['classification'] === 'needs_support') {
                StudentAlert::updateOrCreate(
                    [
                        'school_id'  => $this->schoolId,
                        'student_id' => $result['student_id'],
                        'type'       => 'declining_performance',
                    ],
                    [
                        'severity' => 'warning',
                        'title'    => 'Student Needs Support',
                        'message'  => "Student score is {$result['total_score']}% (Needs Support). Intervention recommended.",
                        'data'     => $result,
                    ]
                );
            }

            $attendancePct = $result['metadata']['attendance_detail']['percentage'] ?? 100;
            if ($attendancePct < 75) {
                StudentAlert::updateOrCreate(
                    [
                        'school_id'  => $this->schoolId,
                        'student_id' => $result['student_id'],
                        'type'       => 'poor_attendance',
                    ],
                    [
                        'severity' => $attendancePct < 60 ? 'critical' : 'warning',
                        'title'    => 'Attendance Warning',
                        'message'  => "Attendance is {$attendancePct}%. Minimum 75% required.",
                        'data'     => ['attendance_percentage' => $attendancePct],
                    ]
                );
            }

            $homeworkMissing = $result['metadata']['homework_detail']['missing'] ?? 0;
            if ($homeworkMissing >= 3) {
                StudentAlert::updateOrCreate(
                    [
                        'school_id'  => $this->schoolId,
                        'student_id' => $result['student_id'],
                        'type'       => 'missing_homework',
                    ],
                    [
                        'severity' => $homeworkMissing >= 5 ? 'critical' : 'warning',
                        'title'    => 'Missing Homework Alert',
                        'message'  => "Student has {$homeworkMissing} missing homework assignments.",
                        'data'     => ['missing' => $homeworkMissing],
                    ]
                );
            }

            $negativeBehavior = $result['metadata']['behavior_detail']['negative'] ?? 0;
            if ($negativeBehavior >= 3) {
                StudentAlert::updateOrCreate(
                    [
                        'school_id'  => $this->schoolId,
                        'student_id' => $result['student_id'],
                        'type'       => 'behavior_concern',
                    ],
                    [
                        'severity' => $negativeBehavior >= 5 ? 'critical' : 'warning',
                        'title'    => 'Behavior Concern',
                        'message'  => "{$negativeBehavior} negative behavior records this term.",
                        'data'     => ['negative_count' => $negativeBehavior],
                    ]
                );
            }

            if ($result['classification'] === 'excellent') {
                StudentAlert::updateOrCreate(
                    [
                        'school_id'  => $this->schoolId,
                        'student_id' => $result['student_id'],
                        'type'       => 'significant_improvement',
                    ],
                    [
                        'severity' => 'info',
                        'title'    => 'Outstanding Performance',
                        'message'  => "Student scored {$result['total_score']}% â€” classified as Excellent!",
                        'data'     => $result,
                    ]
                );
            }
        }
    }

    public function autoAwardAchievements(array $results): void
    {
        $sorted = collect($results)->sortByDesc('total_score')->values();
        $topThree = $sorted->take(3);

        $badges = ['gold_medal', 'silver_medal', 'bronze_medal'];
        $titles = ['Top Performer in School', 'Runner-Up in School', 'Third Best in School'];

        foreach ($topThree as $index => $result) {
            if ($result['classification'] === 'excellent') {
                StudentAchievement::updateOrCreate(
                    [
                        'school_id'  => $this->schoolId,
                        'student_id' => $result['student_id'],
                        'academic_year_id' => $this->academicYearId,
                        'term_id'    => $this->termId,
                        'badge'      => $badges[$index],
                    ],
                    [
                        'title'       => $titles[$index],
                        'description' => "Scored {$result['total_score']}% â€” Top " . ($index + 1) . " in school",
                        'category'    => 'academic',
                        'awarded_at'  => now()->toDateString(),
                    ]
                );
            }
        }
    }

    public function getTopStudents(string $groupBy = 'school', int $limit = 10): Collection
    {
        $query = SuccessScore::where('school_id', $this->schoolId)
            ->where('academic_year_id', $this->academicYearId)
            ->when($this->termId, fn($q) => $q->where('term_id', $this->termId))
            ->with(['student:id,first_name,last_name,class_id,section_id,photo,user_id', 'student.user:id,avatar'])
            ->orderBy('total_score', 'desc');

        return match ($groupBy) {
            'class'     => $query->get()->groupBy('class_id')->map(fn($g) => $g->take($limit)),
            'department' => $query->whereHas('student', fn($q) => $q->whereNotNull('department_id'))->get()->groupBy(fn($s) => $s->student->department_id ?? 0),
            default     => $query->take($limit)->get(),
        };
    }

    public function getStudentsRequiringAttention(int $limit = 50): Collection
    {
        return SuccessScore::where('school_id', $this->schoolId)
            ->where('academic_year_id', $this->academicYearId)
            ->when($this->termId, fn($q) => $q->where('term_id', $this->termId))
            ->whereIn('classification', ['needs_monitoring', 'needs_support', 'critical'])
            ->with(['student:id,first_name,last_name,class_id,section_id,photo,user_id', 'student.user:id,avatar'])
            ->orderBy('total_score', 'asc')
            ->take($limit)
            ->get();
    }

    public function getMostImprovedStudents(int $limit = 10): Collection
    {
        if (!$this->termId || $this->termId <= 1) {
            return collect();
        }

        $currentScores = SuccessScore::where('school_id', $this->schoolId)
            ->where('academic_year_id', $this->academicYearId)
            ->where('term_id', $this->termId)
            ->pluck('total_score', 'student_id');

        $prevTermId = $this->termId - 1;
        $prevScores = SuccessScore::where('school_id', $this->schoolId)
            ->where('academic_year_id', $this->academicYearId)
            ->where('term_id', $prevTermId)
            ->pluck('total_score', 'student_id');

        $improved = collect();
        foreach ($currentScores as $studentId => $currentScore) {
            $prevScore = $prevScores[$studentId] ?? 0;
            $improvement = $currentScore - $prevScore;
            if ($improvement > 0) {
                $improved->push(['student_id' => $studentId, 'improvement' => $improvement, 'current' => $currentScore, 'previous' => $prevScore]);
            }
        }

        return $improved->sortByDesc('improvement')->take($limit);
    }

    public function getStudentProfile(Student $student): array
    {
        $currentScore = SuccessScore::where('school_id', $this->schoolId)
            ->where('student_id', $student->id)
            ->where('academic_year_id', $this->academicYearId)
            ->when($this->termId, fn($q) => $q->where('term_id', $this->termId))
            ->first();

        $history = SuccessScore::where('school_id', $this->schoolId)
            ->where('student_id', $student->id)
            ->orderBy('academic_year_id', 'desc')
            ->orderBy('term_id', 'desc')
            ->take(6)
            ->get();

        $goals = \App\Models\StudentGoal::where('student_id', $student->id)
            ->where('school_id', $this->schoolId)
            ->where('status', 'active')
            ->get();

        $achievements = \App\Models\StudentAchievement::where('student_id', $student->id)
            ->where('school_id', $this->schoolId)
            ->orderBy('awarded_at', 'desc')
            ->take(10)
            ->get();

        $alerts = StudentAlert::where('student_id', $student->id)
            ->where('school_id', $this->schoolId)
            ->where('is_read', false)
            ->count();

        $interventions = \App\Models\Intervention::where('student_id', $student->id)
            ->where('school_id', $this->schoolId)
            ->where('status', 'active')
            ->count();

        return [
            'student'         => $student,
            'current_score'   => $currentScore,
            'history'         => $history,
            'goals'           => $goals,
            'achievements'    => $achievements,
            'pending_alerts'  => $alerts,
            'active_interventions' => $interventions,
        ];
    }

    public function getDepartmentPerformance(): Collection
    {
        return SuccessScore::where('school_id', $this->schoolId)
            ->where('academic_year_id', $this->academicYearId)
            ->when($this->termId, fn($q) => $q->where('term_id', $this->termId))
            ->with('student:id,first_name,last_name,department_id')
            ->get()
            ->groupBy(fn($s) => $s->student->department_id ?? 'unassigned')
            ->map(fn($scores) => [
                'average_score'   => round($scores->avg('total_score'), 2),
                'student_count'   => $scores->count(),
                'excellent_count' => $scores->where('classification', 'excellent')->count(),
                'critical_count'  => $scores->where('classification', 'critical')->count(),
            ]);
    }

    public function getSubjectPerformance(): Collection
    {
        $marks = Mark::whereHas('exam', fn($q) => $q->where('school_id', $this->schoolId)
            ->where('academic_year_id', $this->academicYearId)
            ->when($this->termId, fn($q) => $q->where('term_id', $this->termId))
        )
            ->with('subject:id,name')
            ->get();

        return $marks->groupBy('subject_id')->map(function ($subjectMarks, $subjectId) {
            $subject = $subjectMarks->first()->subject;
            $validMarks = $subjectMarks->where('is_absent', false);
            $fullMarks = $subject?->full_marks ?? 100;

            return [
                'subject_name'     => $subject->name ?? 'Unknown',
                'average_marks'    => round($validMarks->avg('marks_obtained') ?? 0, 2),
                'full_marks'       => $fullMarks,
                'average_percentage' => round(($validMarks->avg('marks_obtained') ?? 0) / $fullMarks * 100, 2),
                'student_count'    => $validMarks->pluck('student_id')->unique()->count(),
                'pass_count'       => $validMarks->where('marks_obtained', '>=', $fullMarks * 0.4)->count(),
            ];
        });
    }

    public function getSummaryStats(): array
    {
        $scores = SuccessScore::where('school_id', $this->schoolId)
            ->where('academic_year_id', $this->academicYearId)
            ->when($this->termId, fn($q) => $q->where('term_id', $this->termId))
            ->get();

        return [
            'total_students'         => $scores->count(),
            'average_score'          => round($scores->avg('total_score') ?? 0, 2),
            'excellent_count'        => $scores->where('classification', 'excellent')->count(),
            'good_count'             => $scores->where('classification', 'good')->count(),
            'needs_monitoring_count' => $scores->where('classification', 'needs_monitoring')->count(),
            'needs_support_count'    => $scores->where('classification', 'needs_support')->count(),
            'critical_count'         => $scores->where('classification', 'critical')->count(),
            'classification_distribution' => [
                'excellent'        => $scores->where('classification', 'excellent')->count(),
                'good'             => $scores->where('classification', 'good')->count(),
                'needs_monitoring' => $scores->where('classification', 'needs_monitoring')->count(),
                'needs_support'    => $scores->where('classification', 'needs_support')->count(),
                'critical'         => $scores->where('classification', 'critical')->count(),
            ],
        ];
    }

    protected function getCurrentYearId(): ?int
    {
        return AcademicYear::where('school_id', $this->schoolId)->where('is_current', true)->value('id');
    }

    protected function getCurrentTermId(): ?int
    {
        return AcademicTerm::where('school_id', $this->schoolId)->where('is_current', true)->value('id');
    }
}
