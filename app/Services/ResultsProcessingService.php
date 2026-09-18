<?php

namespace App\Services;

use App\Models\{AssessmentComponent, Exam, GradeScale, Mark, ReportCard, SchoolAssessmentConfig, Student, Subject};
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class ResultsProcessingService
{
    private int $schoolId;
    private ?SchoolAssessmentConfig $config;
    private ?GradingService $grading;

    public function __construct(int $schoolId)
    {
        $this->schoolId = $schoolId;
        $this->config = SchoolAssessmentConfig::where('school_id', $schoolId)
            ->active()->default()->first();
        $this->grading = new GradingService($schoolId);
    }

    /**
     * Process results for a class/term — compute per-subject totals and overall position.
     */
    public function processClassResults(
        int $classId,
        int $academicYearId,
        ?int $termId = null,
        ?int $sectionId = null
    ): Collection {
        $students = Student::where('class_id', $classId)
            ->when($sectionId, fn ($q) => $q->where('section_id', $sectionId))
            ->where('status', 'active')
            ->with('section:id,name')
            ->orderBy('roll_no')
            ->get();

        if ($students->isEmpty()) {
            return collect();
        }

        $studentIds = $students->pluck('id');
        $exams = Exam::where('class_id', $classId)
            ->where('academic_year_id', $academicYearId)
            ->when($termId, fn ($q) => $q->where('term_id', $termId))
            ->where('status', 'completed')
            ->get();

        if ($exams->isEmpty()) {
            return collect();
        }

        $examIds = $exams->pluck('id');
        $subjects = Subject::where('class_id', $classId)->orderBy('name')->get();

        $allMarks = Mark::whereIn('exam_id', $examIds)
            ->whereIn('student_id', $studentIds)
            ->get();

        $results = $students->map(function ($student) use ($subjects, $allMarks, $exams, $classId, $academicYearId, $termId) {
            $studentMarks = $allMarks->where('student_id', $student->id);
            $totalObtained = 0;
            $totalMax = 0;
            $subjectResults = [];
            $weightedTotal = 0;
            $totalWeight = 0;

            foreach ($subjects as $subject) {
                $subjectMarks = $studentMarks->where('subject_id', $subject->id);
                $componentScores = [];
                $subjectTotal = 0;
                $subjectMax = 0;

                foreach ($exams as $exam) {
                    $mark = $subjectMarks->firstWhere('exam_id', $exam->id);
                    $marksObtained = $mark?->marks_obtained;
                    $isAbsent = $mark?->is_absent ?? false;

                    $componentScores[] = [
                        'exam_id'        => $exam->id,
                        'exam_name'      => $exam->name,
                        'marks_obtained' => $marksObtained,
                        'max_score'      => $exam->max_score,
                        'grade'          => $mark?->grade,
                        'gpa'            => $mark?->gpa,
                        'is_absent'      => $isAbsent,
                        'remarks'        => $mark?->remarks,
                    ];

                    if ($marksObtained !== null && !$isAbsent) {
                        $subjectTotal += (float) $marksObtained;
                        $subjectMax += (float) ($exam->max_score ?? 100);
                    }
                }

                $subjectPercentage = $subjectMax > 0 ? round(($subjectTotal / $subjectMax) * 100, 2) : 0;
                $graded = $this->grading->calculate($subjectTotal, $subjectMax);

                $subjectResults[] = [
                    'subject_id'    => $subject->id,
                    'subject_name'  => $subject->name,
                    'total_marks'   => $subjectTotal,
                    'max_marks'     => $subjectMax,
                    'percentage'    => $subjectPercentage,
                    'grade'         => $graded['grade'],
                    'gpa'           => $graded['gpa'],
                    'remarks'       => $graded['remarks'],
                    'components'    => $componentScores,
                    'is_absent'     => $subjectMarks->where('is_absent', true)->count() === $subjectMarks->count(),
                ];

                $totalObtained += $subjectTotal;
                $totalMax += $subjectMax;
            }

            $overallPercentage = $totalMax > 0 ? round(($totalObtained / $totalMax) * 100, 2) : 0;
            $overallGrade = $this->grading->calculate($totalObtained, $totalMax);

            return [
                'student'         => $student,
                'subjects'        => $subjectResults,
                'total_obtained'  => round($totalObtained, 2),
                'total_max'       => $totalMax,
                'percentage'      => $overallPercentage,
                'grade'           => $overallGrade['grade'],
                'gpa'             => $overallGrade['gpa'],
                'remarks'         => $overallGrade['remarks'],
                'rank'            => 0,
            ];
        });

        // Sort by total obtained descending, assign ranks
        $results = $results->sortByDesc('total_obtained')->values();
        $rank = 1;
        $prevTotal = null;
        $prevRank = 1;

        foreach ($results as $idx => &$result) {
            if ($prevTotal !== null && $result['total_obtained'] === $prevTotal) {
                $result['rank'] = $prevRank;
            } else {
                $result['rank'] = $rank;
                $prevRank = $rank;
            }
            $prevTotal = $result['total_obtained'];
            $rank++;
        }

        return $results;
    }

    /**
     * Generate or update ReportCards for a class/term.
     */
    public function generateReportCards(
        int $classId,
        int $academicYearId,
        ?int $termId = null,
        ?int $sectionId = null
    ): array {
        $results = $this->processClassResults($classId, $academicYearId, $termId, $sectionId);

        $created = 0;
        $updated = 0;

        foreach ($results as $result) {
            $student = $result['student'];

            // Compute attendance from Attendance model
            $attendance = $this->getAttendanceSummary($student->id, $academicYearId, $termId);

            $existing = ReportCard::where([
                'school_id'       => $this->schoolId,
                'student_id'      => $student->id,
                'academic_year_id'=> $academicYearId,
                'term_id'         => $termId,
            ])->first();

            $data = [
                'school_id'        => $this->schoolId,
                'student_id'       => $student->id,
                'academic_year_id' => $academicYearId,
                'term_id'          => $termId,
                'class_id'         => $classId,
                'section_id'       => $student->section_id,
                'total_marks'      => $result['total_max'],
                'obtained_marks'   => $result['total_obtained'],
                'percentage'       => $result['percentage'],
                'grade'            => $result['grade'],
                'gpa'              => $result['gpa'],
                'rank'             => $result['rank'],
                'total_school_days' => $attendance['total_days'],
                'days_present'     => $attendance['present'],
                'days_absent'      => $attendance['absent'],
                'days_late'        => $attendance['late'],
                'subject_data'     => $result['subjects'],
                'extra_data'       => ['processed_at' => now()->toIso8601String()],
                'status'           => 'draft',
                'assessment_config_id' => $this->config?->id,
            ];

            if ($existing) {
                if ($existing->status === 'draft') {
                    $existing->update($data);
                    $updated++;
                }
            } else {
                ReportCard::create($data);
                $created++;
            }
        }

        return ['created' => $created, 'updated' => $updated, 'total' => $results->count()];
    }

    /**
     * Get attendance summary for a student.
     */
    private function getAttendanceSummary(int $studentId, int $academicYearId, ?int $termId): array
    {
        $query = DB::table('attendances')
            ->where('attendable_type', 'App\Models\Student')
            ->where('attendable_id', $studentId);

        if ($termId) {
            $academicTerm = \App\Models\AcademicTerm::find($termId);
            if ($academicTerm) {
                $query->whereBetween('date', [$academicTerm->start_date, $academicTerm->end_date]);
            }
        }

        $records = $query->get();

        return [
            'total_days' => $records->count(),
            'present'    => $records->where('status', 'present')->count(),
            'absent'     => $records->where('status', 'absent')->count(),
            'late'       => $records->where('status', 'late')->count(),
            'half_day'   => $records->where('status', 'half_day')->count(),
        ];
    }

    /**
     * Get available assessment components for a school/year.
     */
    public function getAssessmentComponents(int $academicYearId): Collection
    {
        return AssessmentComponent::where('school_id', $this->schoolId)
            ->where('academic_year_id', $academicYearId)
            ->active()
            ->orderBy('sort_order')
            ->get();
    }
}
