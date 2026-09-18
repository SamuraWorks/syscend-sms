<?php

namespace App\Services;

use App\Models\DocumentImport;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\{DB, Http, Storage};

class DocumentExtractionService
{
    private int $schoolId;
    private int $userId;

    public function __construct(int $schoolId, int $userId)
    {
        $this->schoolId = $schoolId;
        $this->userId = $userId;
    }

    /**
     * Upload and process a document for AI extraction.
     */
    public function uploadAndExtract(UploadedFile $file, string $documentType): DocumentImport
    {
        $path = $file->store('imports/' . $this->schoolId, 'private');

        $import = DocumentImport::create([
            'school_id'     => $this->schoolId,
            'user_id'       => $this->userId,
            'document_type' => $documentType,
            'file_path'     => $path,
            'file_name'     => $file->getClientOriginalName(),
            'file_type'     => $file->getMimeType(),
            'file_size'     => $file->getSize(),
            'status'        => 'uploaded',
        ]);

        return $import;
    }

    /**
     * Extract data from uploaded document using AI.
     * Uses OpenAI Vision API for image/PDF analysis.
     */
    public function extract(DocumentImport $import): DocumentImport
    {
        $import->update(['status' => 'processing']);

        try {
            $filePath = Storage::disk('private')->path($import->file_path);
            $fileContent = file_get_contents($filePath);
            $base64 = base64_encode($fileContent);
            $mimeType = $import->file_type ?? 'image/jpeg';

            $extractedData = $this->callVisionApi($base64, $mimeType, $import->document_type);

            $import->update([
                'status'               => 'extracted',
                'extracted_data'       => $extractedData['data'] ?? null,
                'extraction_metadata'  => [
                    'model'         => 'gemini-2.0-flash',
                    'confidence'    => $extractedData['confidence'] ?? 0,
                    'extracted_at'  => now()->toIso8601String(),
                    'field_scores'  => $extractedData['field_scores'] ?? [],
                ],
                'processed_at'         => now(),
            ]);
        } catch (\Throwable $e) {
            $import->update([
                'status'         => 'failed',
                'admin_notes'    => 'Extraction failed: ' . $e->getMessage(),
                'processed_at'   => now(),
            ]);
        }

        return $import;
    }

    /**
     * Call Google Gemini Vision API for document analysis.
     */
    private function callVisionApi(string $base64Image, string $mimeType, string $documentType): array
    {
        $apiKey = config('services.gemini.api_key');

        if (!$apiKey) {
            return $this->getMockExtraction($documentType);
        }

        $prompt = $this->getExtractionPrompt($documentType);

        $model = 'gemini-2.0-flash';
        $url = "https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent?key={$apiKey}";

        $response = Http::timeout(120)->post($url, [
            'contents' => [
                [
                    'parts' => [
                        ['text' => $prompt],
                        [
                            'inline_data' => [
                                'mime_type' => $mimeType,
                                'data'      => $base64Image,
                            ],
                        ],
                    ],
                ],
            ],
            'generationConfig' => [
                'temperature'     => 0.1,
                'maxOutputTokens' => 4096,
            ],
        ]);

        if ($response->failed()) {
            $error = $response->json('error.message', $response->body());
            throw new \RuntimeException('Gemini API request failed: ' . $error);
        }

        $content = $response->json('candidates.0.content.parts.0.text', '');

        preg_match('/\{[\s\S]*\}/', $content, $matches);
        if (empty($matches[0])) {
            throw new \RuntimeException('Failed to parse AI response');
        }

        return json_decode($matches[0], true) ?? throw new \RuntimeException('Invalid JSON in AI response');
    }

    /**
     * Get extraction prompt based on document type.
     */
    private function getExtractionPrompt(string $documentType): string
    {
        return match ($documentType) {
            'report_card' => <<<'PROMPT'
You are analyzing a Sierra Leone school document (report card or marks sheet).
Extract ALL visible data with EXACT numbers — do not round or estimate.

CRITICAL RULES:
- Extract exact numeric scores as they appear (e.g. 78, not ~80)
- If a score shows "78/100" or "78 out of 100", extract total as 78
- If there are separate CA (Continuous Assessment) and Exam columns, extract both
- Student names and admission numbers must be extracted character-by-character
- If multiple students appear in the document, return an array of students

SINGLE STUDENT format — return:
{
  "school_info": {
    "name": "exact school name as printed",
    "motto": "school motto if visible"
  },
  "students": [
    {
      "admission_number": "exact admission/student ID number",
      "name": "full student name as printed",
      "class": "e.g. JSS 3, SSS 2, Primary 6",
      "section": "e.g. A, B or null",
      "results": {
        "subjects": [
          {
            "name": "exact subject name (Mathematics, English Language, etc.)",
            "ca_score": number_or_null,
            "exam_score": number_or_null,
            "total": number,
            "grade": "exact grade letter (A1, B2, C4, F9, etc.)",
            "remarks": "exact remarks if visible"
          }
        ],
        "overall_total": number,
        "overall_percentage": number,
        "overall_grade": "exact grade",
        "class_position": "e.g. 3rd out of 45",
        "promotion_status": "promoted/retained/not specified"
      },
      "attendance": {
        "total_school_days": number,
        "days_present": number,
        "days_absent": number,
        "days_late": number_or_null
      },
      "comments": {
        "class_teacher": "exact text of teacher remark",
        "principal": "exact text of principal remark"
      }
    }
  ],
  "academic_info": {
    "term": "e.g. First Term, Term 1",
    "academic_year": "e.g. 2025/2026",
    "exam_name": "e.g. End of Term Examination"
  },
  "confidence": 0.0_to_1.0,
  "field_scores": {"field_name": confidence_score}
}

MULTI-STUDENT MARKS SHEET format (when you see a table with multiple student rows):
Return the same structure but with multiple entries in the "students" array.
Each row in the table becomes one student entry.

Extract exact numbers only. If a field is not visible, use null. Return ONLY valid JSON, no markdown.
PROMPT,
            'admission_form' => <<<'PROMPT'
Analyze this Sierra Leone student admission form. Extract ALL visible data as structured JSON.
Return student info, parent/guardian info, previous school info, medical info.
Use exact text as printed. Return ONLY valid JSON with confidence scores.
PROMPT,
            default => <<<'PROMPT'
Analyze this school document and extract all visible data as structured JSON.
Extract exact numbers and text as they appear. Return ONLY valid JSON with confidence scores.
PROMPT,
        };
    }

    /**
     * Mock extraction for demo/testing when no API key is configured.
     */
    private function getMockExtraction(string $documentType): array
    {
        return [
            'data' => [
                'school_info' => [
                    'name' => 'Demo School',
                    'motto' => 'Knowledge is Power',
                ],
                'student_info' => [
                    'name' => 'Extracted Student Name',
                    'class' => 'Class 6',
                ],
                'results' => [
                    'subjects' => [
                        ['name' => 'Mathematics', 'total' => 78, 'grade' => 'A', 'remarks' => 'Excellent'],
                        ['name' => 'English', 'total' => 65, 'grade' => 'B', 'remarks' => 'Good'],
                    ],
                    'overall_percentage' => 71.5,
                    'overall_grade' => 'B',
                ],
            ],
            'confidence' => 0.85,
            'field_scores' => [
                'school_info.name' => 0.95,
                'student_info.name' => 0.80,
                'results.subjects' => 0.75,
            ],
        ];
    }

    /**
     * Import extracted results into the database.
     */
    public function importResults(DocumentImport $import, array $reviewedData, bool $confirm = false): array
    {
        if (!$confirm) {
            return ['status' => 'preview', 'data' => $reviewedData];
        }

        $imported = 0;
        $skipped = 0;
        $errors = [];

        try {
            DB::transaction(function () use ($import, $reviewedData, &$imported, &$skipped, &$errors) {
                // Process based on document type
                match ($import->document_type) {
                    'report_card' => $this->importReportCard($import, $reviewedData, $imported, $skipped, $errors),
                    default => throw new \RuntimeException('Unsupported document type: ' . $import->document_type),
                };

                $import->update([
                    'status'            => 'imported',
                    'imported_at'       => now(),
                    'records_imported'  => $imported,
                    'records_skipped'   => $skipped,
                    'import_results'    => [
                        'imported' => $imported,
                        'skipped'  => $skipped,
                        'errors'   => $errors,
                    ],
                ]);
            });
        } catch (\Throwable $e) {
            $import->update(['status' => 'failed', 'admin_notes' => $e->getMessage()]);
        }

        return ['imported' => $imported, 'skipped' => $skipped, 'errors' => $errors];
    }

    private function importReportCard(DocumentImport $import, array $data, int &$imported, int &$skipped, array &$errors): void
    {
        $schoolId = $import->school_id;
        $grading  = new GradingService($schoolId);

        // Handle both single-student and multi-student formats
        $studentsData = $data['students'] ?? [];
        if (empty($studentsData) && isset($data['student_info'])) {
            $singleStudent = $data['student_info'];
            $singleStudent['results'] = $data['results'] ?? [];
            $singleStudent['attendance'] = $data['attendance'] ?? null;
            $singleStudent['comments'] = $data['comments'] ?? null;
            $studentsData = [$singleStudent];
        }

        $academicInfo = $data['academic_info'] ?? [];

        if (empty($studentsData)) {
            $errors[] = 'No student data found in extracted content.';
            return;
        }

        $academicYear = \App\Models\AcademicYear::where('school_id', $schoolId)->where('is_current', true)->first();
        $academicTerm = \App\Models\AcademicTerm::where('school_id', $schoolId)->where('is_current', true)->first();

        if (!$academicYear) {
            $errors[] = 'No current academic year found.';
            return;
        }

        foreach ($studentsData as $studentData) {
            $this->importOneStudentResult($import, $schoolId, $grading, $studentData, $academicInfo, $academicYear, $academicTerm, $imported, $skipped, $errors);
        }
    }

    private function importOneStudentResult(DocumentImport $import, int $schoolId, GradingService $grading, array $studentData, array $academicInfo, $academicYear, $academicTerm, int &$imported, int &$skipped, array &$errors): void
    {
        $admissionNo = trim($studentData['admission_number'] ?? $studentData['admission_no'] ?? '');
        if (!$admissionNo) {
            $errors[] = 'No admission number found for a student.';
            $skipped++;
            return;
        }

        $student = \App\Models\Student::where('school_id', $schoolId)
            ->where('admission_no', $admissionNo)
            ->where('status', 'active')
            ->first();

        if (!$student) {
            $errors[] = "Student '{$admissionNo}' not found in system.";
            $skipped++;
            return;
        }

        $classSubjects = $student->class_id
            ? \App\Models\Subject::where('class_id', $student->class_id)->get(['id', 'name'])
            : \App\Models\Subject::where('school_id', $schoolId)->get(['id', 'name']);

        $subjectMap = $classSubjects->keyBy(fn ($s) => strtolower(trim($s->name)));

        $results     = $studentData['results'] ?? [];
        $subjects    = $results['subjects'] ?? [];
        $attendance  = $studentData['attendance'] ?? null;
        $examName    = trim($academicInfo['exam_name'] ?? $results['exam_name'] ?? 'Imported Exam');
        $termName    = trim($academicInfo['term'] ?? $results['term'] ?? '');

        if (!$academicTerm && $termName) {
            $academicTerm = \App\Models\AcademicTerm::where('school_id', $schoolId)
                ->where('name', 'like', "%{$termName}%")->first();
        }

        $exam = \App\Models\Exam::firstOrCreate(
            [
                'school_id'        => $schoolId,
                'class_id'         => $student->class_id,
                'academic_year_id' => $academicYear->id,
                'name'             => $examName,
            ],
            [
                'term_id'      => $academicTerm?->id,
                'type'         => 'custom',
                'max_score'    => 100,
                'status'       => 'draft',
                'academic_term_id' => $academicTerm?->id,
            ]
        );

        foreach ($subjects as $subjectData) {
            $subjectName = trim($subjectData['name'] ?? '');
            if (!$subjectName) { $skipped++; continue; }

            $subject = $subjectMap[strtolower($subjectName)] ?? null;
            if (!$subject) {
                $errors[] = "Subject '{$subjectName}' not found for class {$student->class_id}.";
                $skipped++;
                continue;
            }

            $total = $subjectData['total'] ?? $subjectData['marks_obtained'] ?? null;
            if ($total === null && isset($subjectData['ca_score']) && isset($subjectData['exam_score'])) {
                $ca = is_numeric($subjectData['ca_score']) ? (float) $subjectData['ca_score'] : 0;
                $ex = is_numeric($subjectData['exam_score']) ? (float) $subjectData['exam_score'] : 0;
                $total = $ca + $ex;
            }

            if ($total === null || !is_numeric($total)) {
                $skipped++;
                continue;
            }

            $maxScore = $exam->max_score ?: 100;
            $graded = $grading->calculate((float) $total, $maxScore);

            \App\Models\Mark::updateOrCreate(
                [
                    'exam_id'    => $exam->id,
                    'student_id' => $student->id,
                    'subject_id' => $subject->id,
                ],
                [
                    'school_id'      => $schoolId,
                    'marks_obtained' => (float) $total,
                    'raw_score'      => (float) $total,
                    'grade'          => trim($subjectData['grade'] ?? '') ?: $graded['grade'],
                    'gpa'            => $graded['gpa'],
                    'is_absent'      => false,
                    'remarks'        => trim($subjectData['remarks'] ?? '') ?: ($graded['remarks'] ?? null),
                    'status'         => 'draft',
                ]
            );
            $imported++;
        }

        if (is_array($attendance)) {
            $totalDays = (int) ($attendance['total_school_days'] ?? $attendance['total_days'] ?? 0);
            $present   = (int) ($attendance['days_present'] ?? $attendance['present'] ?? 0);
            if ($totalDays > 0) {
                \App\Models\Attendance::updateOrCreate(
                    [
                        'school_id'       => $schoolId,
                        'attendable_type' => \App\Models\Student::class,
                        'attendable_id'   => $student->id,
                        'date'            => now()->toDateString(),
                    ],
                    [
                        'status'       => $present > 0 ? 'present' : 'absent',
                        'status_draft' => 'approved',
                        'approved_at'  => now(),
                        'remarks'      => "Imported: {$present}/{$totalDays} days present",
                    ]
                );
            }
        }
    }
}
