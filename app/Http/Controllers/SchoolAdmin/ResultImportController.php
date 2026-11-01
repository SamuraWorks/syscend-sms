<?php

namespace App\Http\Controllers\SchoolAdmin;

use App\Http\Controllers\Controller;
use App\Models\{DocumentImport, Exam, Mark, Student, Subject};
use App\Services\{DocumentExtractionService, GradingService};
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class ResultImportController extends Controller
{
    /**
     * Show import dashboard.
     */
    public function index(Request $request): Response
    {
        $imports = DocumentImport::with('user:id,name')
            ->where('school_id', $this->getSchoolId())
            ->when($request->status, fn ($q) => $q->where('status', $request->status))
            ->when($request->document_type, fn ($q) => $q->where('document_type', $request->document_type))
            ->latest()
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('SchoolAdmin/Imports/Index', [
            'imports' => [
                'data' => $imports->items(),
                'meta' => [
                    'total' => $imports->total(), 'per_page' => $imports->perPage(),
                    'current_page' => $imports->currentPage(), 'last_page' => $imports->lastPage(),
                    'from' => $imports->firstItem(), 'to' => $imports->lastItem(),
                ],
                'links' => ['prev' => $imports->previousPageUrl(), 'next' => $imports->nextPageUrl()],
            ],
            'filters' => $request->only(['status', 'document_type']),
            'stats' => [
                'total'     => DocumentImport::where('school_id', $this->getSchoolId())->count(),
                'uploaded'  => DocumentImport::where('school_id', $this->getSchoolId())->where('status', 'uploaded')->count(),
                'processing'=> DocumentImport::where('school_id', $this->getSchoolId())->where('status', 'processing')->count(),
                'imported'  => DocumentImport::where('school_id', $this->getSchoolId())->where('status', 'imported')->count(),
                'failed'    => DocumentImport::where('school_id', $this->getSchoolId())->where('status', 'failed')->count(),
            ],
            'exams' => Exam::where('school_id', $this->getSchoolId())->where('status', '!=', 'completed')
                ->with('schoolClass:id,name')->orderByDesc('created_at')->get(['id', 'name', 'class_id', 'status']),
        ]);
    }

    /**
     * Upload a document for AI extraction.
     */
    public function upload(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'file'          => 'required|file|max:20480|mimes:jpg,jpeg,png,pdf,webp',
            'document_type' => 'required|string|in:report_card,admission_form,attendance_register,fee_receipt,certificate,staff_record',
        ]);

        try {
            $service = new DocumentExtractionService($this->getSchoolId(), auth()->id());
            $import = $service->uploadAndExtract($request->file('file'), $data['document_type']);

            return redirect()->route('school.imports.show', $import->id)
                ->with('success', 'Document uploaded. Click "Extract" to begin AI analysis.');
        } catch (\Throwable $e) {
            return back()->withInput()->with('error', 'Upload failed: ' . $e->getMessage());
        }
    }

    /**
     * Show a single import with extracted data.
     */
    public function show(DocumentImport $import): Response
    {
        abort_unless($import->school_id === $this->getSchoolId(), 403);

        return Inertia::render('SchoolAdmin/Imports/Show', [
            'import' => $import->load('user:id,name'),
        ]);
    }

    /**
     * Trigger AI extraction on an uploaded document.
     */
    public function extract(DocumentImport $import): RedirectResponse
    {
        abort_unless($import->school_id === $this->getSchoolId(), 403);

        if (!$import->isUploaded()) {
            return back()->with('error', 'This document has already been processed.');
        }

        try {
            $service = new DocumentExtractionService($this->getSchoolId(), auth()->id());
            $service->extract($import);

            return back()->with('success', 'AI extraction complete. Review the extracted data below.');
        } catch (\Throwable $e) {
            return back()->with('error', 'Extraction failed: ' . $e->getMessage());
        }
    }

    /**
     * Update reviewed/corrected extracted data.
     */
    public function updateData(Request $request, DocumentImport $import): RedirectResponse
    {
        abort_unless($import->school_id === $this->getSchoolId(), 403);

        $data = $request->validate([
            'extracted_data'   => 'required|array',
            'admin_notes'      => 'nullable|string|max:1000',
        ]);

        try {
            $import->update([
                'extracted_data' => $data['extracted_data'],
                'admin_notes'    => $data['admin_notes'] ?? null,
                'status'         => 'reviewed',
            ]);

            return back()->with('success', 'Extracted data updated. Ready for import.');
        } catch (\Throwable $e) {
            return back()->withInput()->with('error', 'Failed to update: ' . $e->getMessage());
        }
    }

    /**
     * Import the reviewed data into the database.
     */
    public function import(DocumentImport $import): RedirectResponse
    {
        abort_unless($import->school_id === $this->getSchoolId(), 403);

        if (!$import->isReviewed() && !$import->isExtracted()) {
            return back()->with('error', 'Document must be reviewed before importing.');
        }

        try {
            $service = new DocumentExtractionService($this->getSchoolId(), auth()->id());
            $results = $service->importResults($import, $import->extracted_data, true);

            return back()->with('success', "Import complete: {$results['imported']} records imported, {$results['skipped']} skipped.");
        } catch (\Throwable $e) {
            return back()->with('error', 'Import failed: ' . $e->getMessage());
        }
    }

    /**
     * Import marks from a CSV file directly into an exam.
     * CSV columns: admission_no, subject_name, marks_obtained [, ca_score] [, exam_score] [, remarks] [, is_absent]
     */
    public function csvImport(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'csv_file' => 'required|file|mimes:csv,txt|max:10240',
            'exam_id'  => 'required|exists:exams,id',
        ]);

        $exam = Exam::findOrFail($data['exam_id']);
        abort_unless($exam->school_id === $this->getSchoolId(), 403);

        if ($exam->status === 'completed' || $exam->status === 'locked') {
            return back()->with('error', 'This exam is locked. Marks cannot be imported.');
        }

        try {
            $schoolId = $this->getSchoolId();
            $grading  = new GradingService($schoolId);

            $file = $request->file('csv_file');
            $rows = array_map('str_getcsv', file($file->getRealPath()));
            if (empty($rows)) {
                return back()->with('error', 'CSV file is empty.');
            }

            $headers = array_map(fn ($h) => strtolower(trim(str_replace([' ', "\t"], '_', $h))), array_shift($rows));

            $subjects = Subject::where('class_id', $exam->class_id)->get(['id', 'name']);
            $students = Student::where('class_id', $exam->class_id)->where('status', 'active')->get(['id', 'admission_no', 'first_name', 'last_name']);

            $subjectMap = $subjects->keyBy(fn ($s) => strtolower(trim($s->name)));
            $studentMap = $students->keyBy(fn ($s) => strtolower(trim($s->admission_no)));

            $imported = 0;
            $skipped  = 0;
            $errors   = [];

            DB::transaction(function () use ($rows, $headers, $exam, $schoolId, $grading, $subjectMap, $studentMap, &$imported, &$skipped, &$errors) {
                foreach ($rows as $idx => $row) {
                    if (count($row) < 2 || empty(array_filter($row))) { $skipped++; continue; }

                    $data = array_combine($headers, $row);
                    if (!$data) { $skipped++; continue; }

                    $admissionNo = strtolower(trim($data['admission_no'] ?? $data['student_id'] ?? $data['student_no'] ?? ''));
                    $subjectName = strtolower(trim($data['subject_name'] ?? $data['subject'] ?? ''));
                    $marksRaw    = $data['marks_obtained'] ?? $data['marks'] ?? $data['score'] ?? $data['total'] ?? null;

                    if ($marksRaw === null && isset($data['ca_score']) && isset($data['exam_score'])) {
                        $ca = is_numeric($data['ca_score']) ? (float) $data['ca_score'] : 0;
                        $ex = is_numeric($data['exam_score']) ? (float) $data['exam_score'] : 0;
                        $marksRaw = $ca + $ex;
                    }

                    $student = $studentMap[$admissionNo] ?? null;
                    $subject = $subjectMap[$subjectName] ?? null;

                    if (!$student) {
                        $errors[] = "Row " . ($idx + 2) . ": Student '{$admissionNo}' not found.";
                        $skipped++;
                        continue;
                    }
                    if (!$subject) {
                        $errors[] = "Row " . ($idx + 2) . ": Subject '{$subjectName}' not found.";
                        $skipped++;
                        continue;
                    }

                    $isAbsent = isset($data['is_absent']) && in_array(strtolower(trim($data['is_absent'])), ['yes', 'true', '1', 'absent']);
                    $marks    = $isAbsent || $marksRaw === '' ? null : (float) $marksRaw;
                    $maxScore = $exam->max_score ?: 100;
                    $graded   = $marks !== null ? $grading->calculate($marks, $maxScore) : ['grade' => null, 'gpa' => null];

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

            $exam->update(['status' => $exam->status === 'draft' ? 'draft' : $exam->status]);

            $msg = "{$imported} marks imported successfully.";
            if ($skipped > 0) $msg .= " {$skipped} rows skipped.";
            if (!empty($errors)) $msg .= " " . count($errors) . " errors (see below).";

            return back()->with('success', $msg)->with('import_errors', array_slice($errors, 0, 20));
        } catch (\Throwable $e) {
            return back()->withInput()->with('error', 'CSV import failed: ' . $e->getMessage());
        }
    }

    /**
     * Delete an import record.
     */
    public function destroy(DocumentImport $import): RedirectResponse
    {
        abort_unless($import->school_id === $this->getSchoolId(), 403);

        try {
            $import->delete();
            return back()->with('success', 'Import record deleted.');
        } catch (\Throwable $e) {
            return back()->with('error', 'Failed to delete: ' . $e->getMessage());
        }
    }
}
