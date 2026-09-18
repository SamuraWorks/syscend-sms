<?php

namespace App\Http\Controllers\SchoolAdmin;

use App\Support\SierraLeoneEducation;
use App\Http\Controllers\Controller;
use App\Models\AcademicYear;
use App\Models\NationalExamination;
use App\Models\SchoolClass;
use App\Models\GradeScale;
use App\Models\Student;
use App\Services\GradingService;
use App\Services\NotificationDispatchService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class NationalExaminationController extends Controller
{
    public function index(Request $request): Response
    {
        $schoolId = $this->getSchoolId();

        $exams = NationalExamination::with(['student:id,first_name,last_name,admission_no', 'academicYear:id,name'])
            ->when($request->exam_type, fn ($q) => $q->where('exam_type', $request->exam_type))
            ->when($request->exam_year, fn ($q) => $q->where('exam_year', $request->exam_year))
            ->when($request->status, fn ($q) => $q->where('status', $request->status))
            ->latest()
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('SchoolAdmin/NationalExams/Index', [
            'exams' => [
                'data' => $exams->items(),
                'meta' => [
                    'total'        => $exams->total(),
                    'current_page' => $exams->currentPage(),
                    'last_page'    => $exams->lastPage(),
                ],
                'links' => ['prev' => $exams->previousPageUrl(), 'next' => $exams->nextPageUrl()],
            ],
            'examTypes'     => SierraLeoneEducation::NATIONAL_EXAMINATIONS,
            'gradeScale'    => SierraLeoneEducation::WASSCE_GRADE_SCALE,
            'academicYears' => AcademicYear::where('school_id', $schoolId)->orderByDesc('is_current')->get(['id', 'name', 'is_current']),
            'students'      => Student::where('school_id', $schoolId)->where('status', 'active')->orderBy('first_name')->get(['id', 'first_name', 'last_name', 'admission_no']),
            'filters'       => $request->only('exam_type', 'exam_year', 'status'),
            'stats'         => [
                'total'  => NationalExamination::where('school_id', $schoolId)->count(),
                'npse'   => NationalExamination::where('school_id', $schoolId)->where('exam_type', 'npse')->count(),
                'bece'   => NationalExamination::where('school_id', $schoolId)->where('exam_type', 'bece')->count(),
                'wassce' => NationalExamination::where('school_id', $schoolId)->where('exam_type', 'wassce')->count(),
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'student_id'       => 'required|exists:students,id',
            'academic_year_id' => 'required|exists:academic_years,id',
            'term_id'          => 'nullable|exists:academic_terms,id',
            'exam_type'        => 'required|in:npse,bece,wassce',
            'index_number'     => 'nullable|string|max:50',
            'exam_year'        => 'required|integer|min:2000|max:2100',
            'notes'            => 'nullable|string|max:500',
        ]);

        try {
            $schoolId = $this->getSchoolId();
            $exam = NationalExamination::create(array_merge($data, ['school_id' => $schoolId]));

            $student = Student::find($data['student_id']);
            $examLabel = SierraLeoneEducation::NATIONAL_EXAMINATIONS[$data['exam_type']]['label'] ?? strtoupper($data['exam_type']);

            if ($student && !empty($data['index_number'])) {
                $indexField = $data['exam_type'] . '_index_number';
                if (in_array($indexField, ['npse_index_number', 'bece_index_number', 'wassce_index_number'])) {
                    Student::withoutGlobalScopes()->where('id', $student->id)->update([$indexField => $data['index_number']]);
                }
            }

            NotificationDispatchService::notifyRole(
                $schoolId, 'principal',
                'New ' . strtoupper($data['exam_type']) . ' Registration',
                ($student?->full_name ?? 'A student') . " has been registered for {$examLabel} {$data['exam_year']}.",
                '/school/national-exams'
            );

            return back()->with('success', 'National exam registration created.');
        } catch (\Throwable $e) {
            return back()->withInput()->with('error', 'Failed to register: ' . $e->getMessage());
        }
    }

    public function update(Request $request, NationalExamination $nationalExam): RedirectResponse
    {
        $data = $request->validate([
            'index_number'   => 'nullable|string|max:50',
            'total_score'    => 'nullable|numeric|min:0',
            'overall_grade'  => 'nullable|string|max:10',
            'overall_result' => 'nullable|in:pass,fail,distinction,credit',
            'subject_scores' => 'nullable|array',
            'status'         => 'required|in:registered,sat,results_pending,results_published',
            'notes'          => 'nullable|string|max:500',
        ]);

        try {
            $oldStatus = $nationalExam->status;
            $nationalExam->update($data);

            if (isset($data['total_score']) && $data['total_score'] !== null) {
                $scale = SierraLeoneEducation::getGradeForScore($nationalExam->exam_type, (float) $data['total_score']);
                if ($scale && empty($data['overall_grade'])) {
                    $nationalExam->update(['overall_grade' => $scale['grade']]);
                }
            }

            if ($data['status'] === 'results_published' && $oldStatus !== 'results_published') {
                $student = Student::find($nationalExam->student_id);
                if ($student) {
                    $examLabel = SierraLeoneEducation::NATIONAL_EXAMINATIONS[$nationalExam->exam_type]['label'] ?? strtoupper($nationalExam->exam_type);
                    NotificationDispatchService::notifyRole(
                        $nationalExam->school_id, 'school-admin',
                        strtoupper($nationalExam->exam_type) . ' Results Published',
                        "{$examLabel} results for {$student->full_name} have been published.",
                        '/school/national-exams'
                    );
                }
            }

            return back()->with('success', 'National exam updated.');
        } catch (\Throwable $e) {
            return back()->withInput()->with('error', 'Failed to update: ' . $e->getMessage());
        }
    }

    public function destroy(NationalExamination $nationalExam): RedirectResponse
    {
        try {
            $nationalExam->delete();
            return back()->with('success', 'National exam record deleted.');
        } catch (\Throwable $e) {
            return back()->with('error', 'Failed to delete: ' . $e->getMessage());
        }
    }

    public function bulkRegister(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'student_ids'      => 'required|array',
            'student_ids.*'    => 'exists:students,id',
            'academic_year_id' => 'required|exists:academic_years,id',
            'exam_type'        => 'required|in:npse,bece,wassce',
            'exam_year'        => 'required|integer|min:2000|max:2100',
        ]);

        try {
            $schoolId = $this->getSchoolId();
            $created = 0;

            DB::transaction(function () use ($data, $schoolId, &$created) {
                foreach ($data['student_ids'] as $studentId) {
                    NationalExamination::firstOrCreate(
                        [
                            'school_id'       => $schoolId,
                            'student_id'      => $studentId,
                            'exam_type'       => $data['exam_type'],
                            'exam_year'       => $data['exam_year'],
                        ],
                        [
                            'academic_year_id' => $data['academic_year_id'],
                            'status'           => 'registered',
                        ]
                    );
                    $created++;
                }
            });

            $examLabel = SierraLeoneEducation::NATIONAL_EXAMINATIONS[$data['exam_type']]['label'] ?? strtoupper($data['exam_type']);
            NotificationDispatchService::notifyRole(
                $schoolId, 'principal',
                "Bulk {$data['exam_type']} Registration",
                "{$created} students registered for {$examLabel} {$data['exam_year']}.",
                '/school/national-exams'
            );

            return back()->with('success', "{$created} students registered for " . strtoupper($data['exam_type']) . ".");
        } catch (\Throwable $e) {
            return back()->withInput()->with('error', 'Failed to bulk register: ' . $e->getMessage());
        }
    }

    public function importResults(Request $request): RedirectResponse
    {
        $request->validate([
            'results'         => 'required|array',
            'results.*.student_id'      => 'required|exists:students,id',
            'results.*.total_score'     => 'required|numeric|min:0',
            'results.*.subject_scores'  => 'nullable|array',
            'exam_type'       => 'required|in:npse,bece,wassce',
            'exam_year'       => 'required|integer|min:2000|max:2100',
        ]);

        try {
            $schoolId = $this->getSchoolId();
            $imported = 0;

            $gradeScales = GradeScale::where('school_id', $schoolId)->orderByDesc('min_marks')->get();

            DB::transaction(function () use ($request, $schoolId, $gradeScales, &$imported) {
                foreach ($request->results as $row) {
                    $scorePercentage = (float) $row['total_score'];
                    $matchedScale = $gradeScales->first(fn ($gs) => $scorePercentage >= (float) $gs->min_marks);

                    $overallGrade = $matchedScale?->grade ?? null;
                    $gpa = (float) ($matchedScale?->gpa ?? 0);
                    $result = match(true) {
                        $gpa >= 4.0 => 'distinction',
                        $gpa >= 3.0 => 'credit',
                        $gpa >= 1.0 => 'pass',
                        default => 'fail',
                    };

                    NationalExamination::updateOrCreate(
                        [
                            'school_id'   => $schoolId,
                            'student_id'  => $row['student_id'],
                            'exam_type'   => $request->exam_type,
                            'exam_year'   => $request->exam_year,
                        ],
                        [
                            'total_score'    => $row['total_score'],
                            'overall_grade'  => $overallGrade,
                            'overall_result' => $result,
                            'subject_scores' => $row['subject_scores'] ?? null,
                            'status'         => 'results_pending',
                        ]
                    );
                    $imported++;
                }
            });

            return back()->with('success', "{$imported} results imported as pending review.");
        } catch (\Throwable $e) {
            return back()->withInput()->with('error', 'Failed to import results: ' . $e->getMessage());
        }
    }

    public function publishResults(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'exam_type' => 'required|in:npse,bece,wassce',
            'exam_year' => 'required|integer|min:2000|max:2100',
        ]);

        try {
            $schoolId = $this->getSchoolId();
            $count = NationalExamination::where('school_id', $schoolId)
                ->where('exam_type', $data['exam_type'])
                ->where('exam_year', $data['exam_year'])
                ->where('status', 'results_pending')
                ->update(['status' => 'results_published']);

            if ($count > 0) {
                NotificationDispatchService::notifyRole(
                    $schoolId, 'school-admin',
                    strtoupper($data['exam_type']) . ' Results Published',
                    "{$count} " . strtoupper($data['exam_type']) . " results for {$data['exam_year']} have been published.",
                    '/school/national-exams'
                );
            }

            return back()->with('success', "{$count} results published and parents notified.");
        } catch (\Throwable $e) {
            return back()->with('error', 'Failed to publish results: ' . $e->getMessage());
        }
    }
}
