<?php

namespace App\Http\Controllers\SchoolAdmin;

use App\Http\Controllers\Controller;
use App\Models\Exam;
use App\Models\ExamAssessmentLink;
use App\Models\AssessmentType;
use App\Models\GradeScale;
use App\Models\Mark;
use App\Models\SchoolSetting;
use App\Models\ResultApprovalLog;
use App\Models\SchoolClass;
use App\Models\Section;
use App\Models\Student;
use App\Models\Subject;
use App\Services\GradingService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class ExamController extends Controller
{
    public function index(Request $request): Response
    {
        $exams = Exam::with(['schoolClass:id,name', 'term:id,name'])
            ->when($request->class_id, fn ($q) => $q->where('class_id', $request->class_id))
            ->when($request->status,   fn ($q) => $q->where('status', $request->status))
            ->when($request->term_id,  fn ($q) => $q->where('term_id', $request->term_id))
            ->latest()
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('SchoolAdmin/Exams/Index', [
            'exams' => [
                'data' => $exams->items(),
                'meta' => [
                    'total' => $exams->total(), 'per_page' => $exams->perPage(),
                    'current_page' => $exams->currentPage(), 'last_page' => $exams->lastPage(),
                    'from' => $exams->firstItem(), 'to' => $exams->lastItem(),
                ],
                'links' => ['prev' => $exams->previousPageUrl(), 'next' => $exams->nextPageUrl()],
            ],
            'classes'        => SchoolClass::orderBy('numeric_name')->get(['id', 'name']),
            'allSections'    => Section::orderBy('name')->get(['id', 'name', 'class_id']),
            'allSubjects'    => Subject::orderBy('name')->get(['id', 'name', 'class_id']),
            'filters'        => $request->only('class_id', 'status', 'term_id'),
            'assessmentTypes'=> AssessmentType::where('school_id', $this->getSchoolId())->active()->orderBy('sort_order')->get(),
            'stats'   => [
                'total'     => Exam::count(),
                'draft'     => Exam::where('status', 'draft')->count(),
                'published' => Exam::where('status', 'published')->count(),
                'completed' => Exam::where('status', 'completed')->count(),
                'submitted' => Exam::whereNotNull('submitted_at')->whereNull('approved_at')->count(),
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'name'              => 'required|string|max:150',
            'type'              => 'required|in:unit_test,mid_term,final,custom',
            'class_id'          => 'required|exists:classes,id',
            'start_date'        => 'nullable|date',
            'end_date'          => 'nullable|date|after_or_equal:start_date',
            'status'            => 'required|in:draft,published,completed',
            'description'       => 'nullable|string|max:500',
            'term_id'           => 'nullable|exists:academic_terms,id',
            'academic_year_id'  => 'nullable|exists:academic_years,id',
            'assessment_category' => 'nullable|string|in:continuous_assessment,summative',
            'ca_weight'         => 'nullable|numeric|min:0|max:100',
            'exam_weight'       => 'nullable|numeric|min:0|max:100',
            'max_score'         => 'nullable|numeric|min:1',
            'assessment_model'  => 'nullable|string|in:ca_test_final,ca_final,test_final,final_only,custom',
            'assessment_links'  => 'nullable|array',
            'assessment_links.*.assessment_type_id' => 'required_with:assessment_links|exists:assessment_types,id',
            'assessment_links.*.max_marks'  => 'required_with:assessment_links|numeric|min:1',
            'assessment_links.*.weight'     => 'required_with:assessment_links|numeric|min:0|max:100',
            'publication_date'  => 'nullable|date',
            'eligible_section_ids' => 'nullable|array',
            'eligible_section_ids.*' => 'exists:sections,id',
            'eligible_subject_ids'  => 'nullable|array',
            'eligible_subject_ids.*' => 'exists:subjects,id',
        ]);

        try {
            $schoolId = $this->getSchoolId();
            $defaultCa = (float) SchoolSetting::get($schoolId, 'ca_weight', 40);
            $defaultExam = (float) SchoolSetting::get($schoolId, 'exam_weight', 60);

            DB::transaction(function () use ($data, $schoolId, $defaultCa, $defaultExam) {
                $exam = Exam::create(array_merge($data, [
                    'school_id'    => $schoolId,
                    'max_score'    => $data['max_score'] ?? 100,
                    'ca_weight'    => $data['ca_weight'] ?? $defaultCa,
                    'exam_weight'  => $data['exam_weight'] ?? $defaultExam,
                ]));

                if (!empty($data['assessment_links'])) {
                    foreach ($data['assessment_links'] as $link) {
                        ExamAssessmentLink::create(array_merge($link, [
                            'school_id' => $schoolId,
                            'exam_id'   => $exam->id,
                        ]));
                    }
                }

                if (!empty($data['eligible_section_ids'])) {
                    $exam->sections()->sync($data['eligible_section_ids']);
                }
                if (!empty($data['eligible_subject_ids'])) {
                    $exam->subjects()->sync($data['eligible_subject_ids']);
                }
            });

            return back()->with('success', 'Exam created.');
        } catch (\Throwable $e) {
            return back()->withInput()->with('error', 'Failed to create exam: ' . $e->getMessage());
        }
    }

    public function update(Request $request, Exam $exam): RedirectResponse
    {
        if ($exam->isLocked()) {
            return back()->with('error', 'Cannot edit an approved exam.');
        }

        $data = $request->validate([
            'name'              => 'required|string|max:150',
            'type'              => 'required|in:unit_test,mid_term,final,custom',
            'class_id'          => 'required|exists:classes,id',
            'start_date'        => 'nullable|date',
            'end_date'          => 'nullable|date|after_or_equal:start_date',
            'status'            => 'required|in:draft,published,completed',
            'description'       => 'nullable|string|max:500',
            'term_id'           => 'nullable|exists:academic_terms,id',
            'academic_year_id'  => 'nullable|exists:academic_years,id',
            'assessment_category' => 'nullable|string|in:continuous_assessment,summative',
            'ca_weight'         => 'nullable|numeric|min:0|max:100',
            'exam_weight'       => 'nullable|numeric|min:0|max:100',
            'max_score'         => 'nullable|numeric|min:1',
            'assessment_model'  => 'nullable|string|in:ca_test_final,ca_final,test_final,final_only,custom',
            'assessment_links'  => 'nullable|array',
            'assessment_links.*.assessment_type_id' => 'required_with:assessment_links|exists:assessment_types,id',
            'assessment_links.*.max_marks'  => 'required_with:assessment_links|numeric|min:1',
            'assessment_links.*.weight'     => 'required_with:assessment_links|numeric|min:0|max:100',
            'publication_date'  => 'nullable|date',
            'eligible_section_ids' => 'nullable|array',
            'eligible_section_ids.*' => 'exists:sections,id',
            'eligible_subject_ids'  => 'nullable|array',
            'eligible_subject_ids.*' => 'exists:subjects,id',
        ]);

        try {
            DB::transaction(function () use ($data, $exam) {
                $exam->update($data);

                if (isset($data['assessment_links'])) {
                    $exam->assessmentLinks()->delete();
                    foreach ($data['assessment_links'] as $link) {
                        ExamAssessmentLink::create(array_merge($link, [
                            'school_id' => $this->getSchoolId(),
                            'exam_id'   => $exam->id,
                        ]));
                    }
                }

                if (array_key_exists('eligible_section_ids', $data)) {
                    $exam->sections()->sync($data['eligible_section_ids'] ?? []);
                }
                if (array_key_exists('eligible_subject_ids', $data)) {
                    $exam->subjects()->sync($data['eligible_subject_ids'] ?? []);
                }
            });

            return back()->with('success', 'Exam updated.');
        } catch (\Throwable $e) {
            return back()->withInput()->with('error', 'Failed to update exam: ' . $e->getMessage());
        }
    }

    public function destroy(Exam $exam): RedirectResponse
    {
        try {
            $exam->delete();
            return back()->with('success', 'Exam deleted.');
        } catch (\Throwable $e) {
            return back()->with('error', 'Failed to delete exam: ' . $e->getMessage());
        }
    }

    /**
     * Submit exam marks for approval (locks marks from teacher editing).
     */
    public function submit(Exam $exam): RedirectResponse
    {
        if (!$exam->isSubmittable()) {
            return back()->with('error', 'This exam cannot be submitted.');
        }

        $exam->update([
            'submitted_by' => auth()->id(),
            'submitted_at' => now(),
        ]);

        Mark::where('exam_id', $exam->id)
            ->where('status', 'draft')
            ->update([
                'status'       => 'submitted',
                'submitted_by' => auth()->id(),
                'submitted_at' => now(),
            ]);

        ResultApprovalLog::log(
            $this->getSchoolId(),
            $exam,
            auth()->id(),
            'submitted',
            null,
            ['status' => $exam->status],
            ['status' => $exam->status, 'submitted_at' => now()->toIso8601String()]
        );

        return back()->with('success', 'Exam submitted for approval. Marks are now locked.');
    }

    /**
     * Approve an exam after review.
     */
    public function approve(Exam $exam): RedirectResponse
    {
        if (!$exam->isApprovable()) {
            return back()->with('error', 'This exam cannot be approved.');
        }

        $previousState = ['status' => $exam->status, 'submitted_at' => $exam->submitted_at?->toIso8601String()];

        $exam->update([
            'approved_by' => auth()->id(),
            'approved_at' => now(),
            'status'      => 'completed',
        ]);

        Mark::where('exam_id', $exam->id)
            ->where('status', 'submitted')
            ->update(['status' => 'approved']);

        ResultApprovalLog::log(
            $this->getSchoolId(),
            $exam,
            auth()->id(),
            'approved',
            null,
            $previousState,
            ['status' => 'completed', 'approved_at' => now()->toIso8601String()]
        );

        return back()->with('success', 'Exam approved. Results are now published.');
    }

    /**
     * Get assessment types for configuration.
     */
    public function assessmentTypes(): Response
    {
        $types = AssessmentType::where('school_id', $this->getSchoolId())
            ->active()
            ->orderBy('sort_order')
            ->get();

        return response()->json($types);
    }

    /**
     * Marks entry page for an exam — shows students × subjects grid.
     */
    public function marks(Request $request, Exam $exam): Response
    {
        if ($exam->isLocked()) {
            return back()->with('error', 'This exam is locked. Marks cannot be edited.');
        }

        $sectionId = $request->section_id;

        $subjects = Subject::where('class_id', $exam->class_id)->orderBy('name')->get();

        $students = Student::where('class_id', $exam->class_id)
            ->when($sectionId, fn ($q) => $q->where('section_id', $sectionId))
            ->where('status', 'active')
            ->with('section:id,name')
            ->orderBy('roll_no')
            ->get(['id', 'first_name', 'last_name', 'roll_no', 'section_id']);

        $existingMarks = Mark::where('exam_id', $exam->id)
            ->whereIn('student_id', $students->pluck('id'))
            ->get()
            ->groupBy('student_id')
            ->map(fn ($marks) => $marks->keyBy('subject_id'));

        $assessmentLinks = $exam->assessmentLinks()->with('assessmentType')->orderBy('sort_order')->get();

        return Inertia::render('SchoolAdmin/Exams/Marks', [
            'exam'             => $exam->load('schoolClass:id,name'),
            'subjects'         => $subjects,
            'students'         => $students,
            'existingMarks'    => $existingMarks,
            'sections'         => Section::where('class_id', $exam->class_id)->orderBy('name')->get(['id', 'name']),
            'filters'          => ['section_id' => $sectionId],
            'assessmentLinks'  => $assessmentLinks,
        ]);
    }

    /**
     * Bulk save marks for an exam.
     */
    public function saveMarks(Request $request, Exam $exam): RedirectResponse
    {
        if ($exam->isLocked()) {
            return back()->with('error', 'This exam is locked. Marks cannot be edited.');
        }

        $data = $request->validate([
            'section_id'              => 'nullable|exists:sections,id',
            'records'                 => 'required|array',
            'records.*.student_id'    => 'required|exists:students,id',
            'records.*.subject_id'    => 'required|exists:subjects,id',
            'records.*.marks_obtained'=> 'nullable|numeric|min:0',
            'records.*.is_absent'     => 'boolean',
            'records.*.remarks'       => 'nullable|string|max:200',
        ]);

        $schoolId = $this->getSchoolId();
        $grading  = new GradingService($schoolId);

        try {
            DB::transaction(function () use ($data, $exam, $schoolId, $grading) {
                foreach ($data['records'] as $row) {
                    $marksObtained = $row['is_absent'] ? null : ($row['marks_obtained'] ?? null);
                    $maxScore = $exam->max_score ?: 100;
                    $graded = $marksObtained !== null ? $grading->calculate((float) $marksObtained, $maxScore) : ['grade' => null, 'gpa' => null];

                    Mark::updateOrCreate(
                        [
                            'exam_id'    => $exam->id,
                            'student_id' => $row['student_id'],
                            'subject_id' => $row['subject_id'],
                        ],
                        [
                            'school_id'      => $schoolId,
                            'marks_obtained' => $marksObtained,
                            'raw_score'      => $marksObtained,
                            'grade'          => $graded['grade'],
                            'gpa'            => $graded['gpa'],
                            'is_absent'      => $row['is_absent'] ?? false,
                            'remarks'        => $row['remarks'] ?? null,
                            'status'         => 'draft',
                        ]
                    );
                }
            });

            return back()->with('success', 'Marks saved successfully.');
        } catch (\Throwable $e) {
            return back()->withInput()->with('error', 'Failed to save marks: ' . $e->getMessage());
        }
    }

    /**
     * Results / merit list for an exam.
     */
    public function results(Request $request, Exam $exam): Response
    {
        $sectionId = $request->section_id;
        $subjects  = Subject::where('class_id', $exam->class_id)->orderBy('name')->get();

        $students = Student::where('class_id', $exam->class_id)
            ->when($sectionId, fn ($q) => $q->where('section_id', $sectionId))
            ->where('status', 'active')
            ->with('section:id,name')
            ->orderBy('roll_no')
            ->get(['id', 'first_name', 'last_name', 'roll_no', 'section_id']);

        $allMarks = Mark::where('exam_id', $exam->id)
            ->whereIn('student_id', $students->pluck('id'))
            ->get()
            ->groupBy('student_id')
            ->map(fn ($marks) => $marks->keyBy('subject_id'));

        $results = $students->map(function ($student) use ($subjects, $allMarks) {
            $studentMarks = $allMarks[$student->id] ?? collect();
            $total        = 0;
            $obtained     = 0;
            $failed       = false;
            $subjectRows  = [];

            foreach ($subjects as $subject) {
                $mark = $studentMarks[$subject->id] ?? null;
                $mo   = $mark && !$mark->is_absent ? (float) $mark->marks_obtained : 0;
                $total    += $subject->full_marks;
                $obtained += $mo;
                if ($mark && ($mark->grade === 'F' || $mark->is_absent)) $failed = true;

                $subjectRows[] = [
                    'subject_id'     => $subject->id,
                    'marks_obtained' => $mark?->marks_obtained,
                    'grade'          => $mark?->grade,
                    'gpa'            => $mark?->gpa,
                    'is_absent'      => $mark?->is_absent ?? false,
                ];
            }

            $percentage = $total > 0 ? round(($obtained / $total) * 100, 2) : 0;
            $avgGpa     = $studentMarks->whereNotNull('gpa')->avg('gpa');

            return [
                'student'    => $student,
                'marks'      => $subjectRows,
                'total'      => $total,
                'obtained'   => round($obtained, 2),
                'percentage' => $percentage,
                'avg_gpa'    => $avgGpa ? round($avgGpa, 2) : null,
                'failed'     => $failed,
                'rank'       => 0,
            ];
        })->sortByDesc('obtained')->values();

        $results = $results->map(function ($row, $idx) {
            $row['rank'] = $idx + 1;
            return $row;
        });

        return Inertia::render('SchoolAdmin/Exams/Results', [
            'exam'       => $exam->load('schoolClass:id,name'),
            'subjects'   => $subjects,
            'results'    => $results->values(),
            'sections'   => Section::where('class_id', $exam->class_id)->orderBy('name')->get(['id', 'name']),
            'gradeScale' => GradeScale::orderByDesc('min_marks')->get(),
            'filters'    => ['section_id' => $sectionId],
        ]);
    }

    /**
     * Grade scales management page.
     */
    public function gradeScales(): Response
    {
        return Inertia::render('SchoolAdmin/Exams/GradeScales', [
            'scales' => GradeScale::orderBy('sort_order')->get(),
        ]);
    }

    public function saveGradeScale(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'grade'      => 'required|string|max:10',
            'gpa'        => 'required|numeric|min:0|max:5',
            'min_marks'  => 'required|numeric|min:0|max:100',
            'max_marks'  => 'required|numeric|min:0|max:100',
            'remarks'    => 'nullable|string|max:50',
            'sort_order' => 'nullable|integer',
        ]);

        try {
            GradeScale::create(array_merge($data, ['school_id' => $this->getSchoolId()]));
            return back()->with('success', 'Grade added.');
        } catch (\Throwable $e) {
            return back()->withInput()->with('error', 'Failed to add grade: ' . $e->getMessage());
        }
    }

    public function updateGradeScale(Request $request, GradeScale $gradeScale): RedirectResponse
    {
        $data = $request->validate([
            'grade'      => 'required|string|max:10',
            'gpa'        => 'required|numeric|min:0|max:5',
            'min_marks'  => 'required|numeric|min:0|max:100',
            'max_marks'  => 'required|numeric|min:0|max:100',
            'remarks'    => 'nullable|string|max:50',
            'sort_order' => 'nullable|integer',
        ]);

        try {
            $gradeScale->update($data);
            return back()->with('success', 'Grade updated.');
        } catch (\Throwable $e) {
            return back()->withInput()->with('error', 'Failed to update grade: ' . $e->getMessage());
        }
    }

    public function deleteGradeScale(GradeScale $gradeScale): RedirectResponse
    {
        try {
            $gradeScale->delete();
            return back()->with('success', 'Grade deleted.');
        } catch (\Throwable $e) {
            return back()->with('error', 'Failed to delete grade: ' . $e->getMessage());
        }
    }

    public function bulkImportMarks(Request $request, Exam $exam): RedirectResponse
    {
        if ($exam->isLocked()) {
            return back()->with('error', 'This exam is locked. Marks cannot be imported.');
        }

        $request->validate([
            'csv_file' => 'required|file|mimes:csv,txt|max:5120',
        ]);

        try {
            $schoolId = $this->getSchoolId();
            $grading  = new GradingService($schoolId);
            $file = $request->file('csv_file');
            $rows = array_map('str_getcsv', file($file->getRealPath()));
            $headers = array_map('strtolower', array_map('trim', array_shift($rows)));

            $subjects = Subject::where('class_id', $exam->class_id)->get(['id', 'name']);
            $students = Student::where('class_id', $exam->class_id)->where('status', 'active')->get(['id', 'admission_no']);

            $subjectMap = $subjects->keyBy(fn ($s) => strtolower($s->name));
            $studentMap = $students->keyBy(fn ($s) => strtolower($s->admission_no));

            $imported = 0;
            $skipped = 0;

            DB::transaction(function () use ($rows, $headers, $exam, $schoolId, $grading, $subjectMap, $studentMap, &$imported, &$skipped) {
                foreach ($rows as $idx => $row) {
                    if (count($row) < 3) { $skipped++; continue; }

                    $data = array_combine($headers, $row);
                    $admissionNo = strtolower(trim($data['admission_no'] ?? $data['admission_no_no'] ?? ''));
                    $subjectName = strtolower(trim($data['subject_name'] ?? $data['subject'] ?? ''));
                    $marksObtained = $data['marks_obtained'] ?? $data['marks'] ?? $data['score'] ?? null;

                    $student = $studentMap[$admissionNo] ?? null;
                    $subject = $subjectMap[$subjectName] ?? null;

                    if (!$student || !$subject) { $skipped++; continue; }

                    $isAbsent = strtolower(trim($data['is_absent'] ?? '')) === 'yes' || strtolower(trim($data['is_absent'] ?? '')) === 'true' || ($marksObtained === '' || $marksObtained === null);
                    $marks = $isAbsent ? null : (float) $marksObtained;
                    $maxScore = $exam->max_score ?: 100;
                    $graded = $marks !== null ? $grading->calculate($marks, $maxScore) : ['grade' => null, 'gpa' => null];

                    Mark::updateOrCreate(
                        ['exam_id' => $exam->id, 'student_id' => $student->id, 'subject_id' => $subject->id],
                        [
                            'school_id'      => $schoolId,
                            'marks_obtained' => $marks,
                            'raw_score'      => $marks,
                            'grade'          => $graded['grade'],
                            'gpa'            => $graded['gpa'],
                            'is_absent'      => $isAbsent,
                            'remarks'        => trim($data['remarks'] ?? ''),
                            'status'         => 'draft',
                        ]
                    );
                    $imported++;
                }
            });

            return back()->with('success', "{$imported} marks imported, {$skipped} rows skipped.");
        } catch (\Throwable $e) {
            return back()->withInput()->with('error', 'Failed to import marks: ' . $e->getMessage());
        }
    }
}
