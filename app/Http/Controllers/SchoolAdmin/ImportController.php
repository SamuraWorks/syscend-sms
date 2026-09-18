<?php

namespace App\Http\Controllers\SchoolAdmin;

use App\Http\Controllers\Controller;
use App\Models\ImportJob;
use App\Services\CurriculumImportService;
use App\Services\ParentImportService;
use App\Services\StaffImportService;
use App\Services\StudentImportService;
use App\Services\TimetableImportService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\StreamedResponse;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Color;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Worksheet\DataType;
use RuntimeException;

class ImportController extends Controller
{
    private const VALID_TYPES = ['students', 'parents', 'staff', 'curriculum', 'timetables'];

    public function index(): Response
    {
        $jobs = ImportJob::query()
            ->where('school_id', $this->getSchoolId())
            ->latest()
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('SchoolAdmin/Imports/Index', [
            'imports' => [
                'data'  => $jobs->items(),
                'current_page' => $jobs->currentPage(),
                'last_page'    => $jobs->lastPage(),
                'per_page'     => $jobs->perPage(),
                'total'        => $jobs->total(),
            ],
        ]);
    }

    public function create(string $type): Response
    {
        abort_unless(in_array($type, self::VALID_TYPES), 404);

        return Inertia::render('SchoolAdmin/Imports/Create', [
            'importType' => $type,
        ]);
    }

    public function upload(Request $request, string $type): RedirectResponse
    {
        abort_unless(in_array($type, self::VALID_TYPES), 404);

        $request->validate([
            'file' => 'required|file|mimes:xlsx,xls,csv|max:10240',
        ]);

        $file = $request->file('file');
        $fileName = $file->getClientOriginalName();
        $filePath = $file->store('imports', 'private');

        $job = ImportJob::create([
            'school_id'   => $this->getSchoolId(),
            'user_id'     => auth()->id(),
            'import_type' => $type,
            'file_name'   => $fileName,
            'file_path'   => $filePath,
            'file_type'   => $file->getClientOriginalExtension(),
            'status'      => 'uploaded',
        ]);

        $service = $this->getImportService($type);
        $service->parseFile($job);

        return redirect()->route('school-admin.imports.preview', $job);
    }

    public function preview(Request $request, ImportJob $job): Response
    {
        abort_unless($job->school_id === $this->getSchoolId(), 403);

        $service = $this->getImportService($job->import_type);
        $raw = $service->previewRows($job);

        $preview = match ($job->import_type) {
            'curriculum' => $raw,
            'timetables' => [
                'rows'    => [],
                'errors'  => collect($raw['errors'] ?? [])->pluck('errors')->flatten()->values()->all(),
                'grouped' => [],
            ],
            default => [
                'rows'    => $raw['preview'] ?? [],
                'errors'  => $this->flattenValidationErrors($raw['errors'] ?? []),
                'grouped' => [],
            ],
        };

        return Inertia::render('SchoolAdmin/Imports/Preview', [
            'job'         => $job->fresh(),
            'preview'     => $preview,
            'importType'  => $job->import_type,
        ]);
    }

    private function flattenValidationErrors(array $errors): array
    {
        $flat = [];
        foreach ($errors as $rowNum => $messages) {
            foreach ((array) $messages as $msg) {
                $flat[] = "Row {$rowNum}: {$msg}";
            }
        }
        return $flat;
    }

    public function execute(Request $request, ImportJob $job): RedirectResponse
    {
        abort_unless($job->school_id === $this->getSchoolId(), 403);

        $service = $this->getImportService($job->import_type);
        $summary = $service->executeImport($job);

        $job->update([
            'status'   => 'completed',
            'imported_at' => now(),
        ]);

        return redirect()
            ->route('school-admin.imports.index')
            ->with('success', "Import completed. {$job->imported_rows} records imported successfully.");
    }

    public function downloadTemplate(string $type): \Symfony\Component\HttpFoundation\Response
    {
        abort_unless(in_array($type, self::VALID_TYPES), 404);

        $spreadsheet = new Spreadsheet();
        $spreadsheet->removeSheetByIndex(0);

        $instructions = match ($type) {
            'students'   => $this->studentTemplateInstructions(),
            'staff'      => $this->staffTemplateInstructions(),
            'parents'    => $this->parentTemplateInstructions(),
            'curriculum' => $this->curriculumTemplateInstructions(),
            'timetables' => $this->timetableTemplateInstructions(),
        };

        $samples = match ($type) {
            'students'   => $this->studentTemplateSamples(),
            'staff'      => $this->staffTemplateSamples(),
            'parents'    => $this->parentTemplateSamples(),
            'curriculum' => $this->curriculumTemplateSamples(),
            'timetables' => $this->timetableTemplateSamples(),
        };

        $headers = $instructions['headers'];

        $this->buildInstructionSheet($spreadsheet, $type, $instructions);
        $this->buildSampleSheet($spreadsheet, $headers, $samples);

        $filename = "{$type}_import_template.xlsx";
        $tempPath = storage_path("app/private/{$filename}");
        $writer = IOFactory::createWriter($spreadsheet, 'Xlsx');
        $writer->save($tempPath);

        return response()->download($tempPath, $filename, [
            'Cache-Control' => 'no-cache, no-store, must-revalidate',
        ])->deleteFileAfterSend(true);
    }

    private function buildInstructionSheet(Spreadsheet &$spreadsheet, string $type, array $instructions): void
    {
        $sheet = new \PhpOffice\PhpSpreadsheet\Worksheet\Worksheet($spreadsheet, 'Instructions');
        $spreadsheet->addSheet($sheet, 0);

        $sheet->setTitle('Instructions');

        $titleRow = 1;
        $sheet->setCellValue("A{$titleRow}", strtoupper($type) . ' IMPORT TEMPLATE');
        $sheet->getStyle("A{$titleRow}")->getFont()->setBold(true)->setSize(16)->getColor()->setRGB('1E3A5F');
        $sheet->mergeCells("A{$titleRow}:F{$titleRow}");

        $descRow = 3;
        $sheet->setCellValue("A{$descRow}", $instructions['description']);
        $sheet->getStyle("A{$descRow}")->getFont()->setItalic(true)->setSize(10)->getColor()->setRGB('666666');
        $sheet->mergeCells("A{$descRow}:F{$descRow}");

        $rulesRow = 5;
        $sheet->setCellValue("A{$rulesRow}", 'IMPORTANT RULES:');
        $sheet->getStyle("A{$rulesRow}")->getFont()->setBold(true)->setSize(11)->getColor()->setRGB('CC0000');
        $sheet->mergeCells("A{$rulesRow}:F{$rulesRow}");

        $ruleNum = 0;
        foreach ($instructions['rules'] as $rule) {
            $ruleRow = $rulesRow + 1 + $ruleNum;
            $sheet->setCellValue("A{$ruleRow}", ($ruleNum + 1) . '. ' . $rule);
            $sheet->getStyle("A{$ruleRow}")->getFont()->setSize(10);
            $sheet->mergeCells("A{$ruleRow}:F{$ruleRow}");
            $ruleNum++;
        }

        $headerRow = $rulesRow + 2 + $ruleNum;
        $cols = ['Column Name', 'Required?', 'Valid Values', 'Description', 'Example'];
        foreach ($cols as $colIdx => $colName) {
            $coord = self::columnLetter($colIdx + 1) . $headerRow;
            $sheet->setCellValue($coord, $colName);
            $sheet->getStyle($coord)->getFont()->setBold(true)->setSize(10)->getColor()->setRGB('FFFFFF');
            $sheet->getStyle($coord)->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setRGB('1E3A5F');
            $sheet->getStyle($coord)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
        }

        foreach ($instructions['columns'] as $colIdx => $col) {
            $row = $headerRow + 1 + $colIdx;
            $requiredColor = $col['required'] ? 'FDE8E8' : 'E8F5E9';

            $sheet->setCellValue('A' . $row, $col['name']);
            $sheet->setCellValue('B' . $row, $col['required'] ? 'YES' : 'No');
            $sheet->setCellValue('C' . $row, $col['valid'] ?? '');
            $sheet->setCellValue('D' . $row, $col['description']);
            $sheet->setCellValue('E' . $row, $col['example']);

            for ($c = 1; $c <= 5; $c++) {
                $coord = self::columnLetter($c) . $row;
                $sheet->getStyle($coord)->getFill()
                    ->setFillType(Fill::FILL_SOLID)
                    ->getStartColor()->setRGB($requiredColor);
                $sheet->getStyle($coord)->getFont()->setSize(10);
            }
            $sheet->getStyle('B' . $row)->getFont()->setBold(true)->setColor(
                new Color($col['required'] ? 'CC0000' : '2E7D32')
            );
        }

        $sheet->getColumnDimension('A')->setWidth(22);
        $sheet->getColumnDimension('B')->setWidth(12);
        $sheet->getColumnDimension('C')->setWidth(35);
        $sheet->getColumnDimension('D')->setWidth(50);
        $sheet->getColumnDimension('E')->setWidth(25);
    }

    private function buildSampleSheet(Spreadsheet &$spreadsheet, array $headers, array $samples): void
    {
        $sheet = new \PhpOffice\PhpSpreadsheet\Worksheet\Worksheet($spreadsheet, 'Sample Data');
        $spreadsheet->addSheet($sheet, 1);

        $sheet->setTitle('Sample Data');

        $sheet->setCellValue('A1', 'DO NOT edit the column headers below. Fill in the data rows.');
        $sheet->getStyle('A1')->getFont()->setBold(true)->setItalic(true)->setSize(10)->getColor()->setRGB('CC0000');
        $sheet->mergeCells('A1:' . self::columnLetter(count($headers)) . '1');

        foreach ($headers as $colIdx => $header) {
            $colLetter = self::columnLetter($colIdx + 1);
            $coord = "{$colLetter}2";
            $sheet->setCellValue($coord, $header);
            $sheet->getStyle($coord)->getFont()->setBold(true)->setSize(10)->getColor()->setRGB('FFFFFF');
            $sheet->getStyle($coord)->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setRGB('1E3A5F');
            $sheet->getStyle($coord)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
        }

        foreach ($samples as $sampleIdx => $sample) {
            $row = 3 + $sampleIdx;
            foreach ($sample as $colIdx => $value) {
                $coord = self::columnLetter($colIdx + 1) . $row;
                $sheet->setCellValue($coord, $value);
                $sheet->getStyle($coord)->getFont()->setSize(10);
            }
        }

        for ($colIdx = 0; $colIdx < count($headers); $colIdx++) {
            $sheet->getColumnDimension(self::columnLetter($colIdx + 1))->setWidth(20);
        }
    }

    private static function columnLetter(int $col): string
    {
        $letter = '';
        while ($col > 0) {
            $col--;
            $letter = chr(65 + ($col % 26)) . $letter;
            $col = intdiv($col, 26);
        }
        return $letter;
    }

    private function studentTemplateInstructions(): array
    {
        return [
            'description' => 'Fill in the Sample Data sheet with your student data. Then save the file and upload it. Classes and sections must already exist in the system.',
            'rules' => [
                'first_name, last_name, gender, and class_name are REQUIRED.',
                'gender must be exactly "male" or "female" (lowercase, no extra spaces).',
                'class_name must match an existing class in your school exactly (case-insensitive).',
                'section_name is optional but must match an existing section for that class.',
                'student_id_no is auto-generated if left blank.',
                'parent info is optional. If parent_name is provided, a parent account is created and linked.',
                'date_of_birth must be in YYYY-MM-DD format (e.g. 2010-05-15).',
                'email must be a valid email address if provided.',
            ],
            'headers' => ['student_id_no', 'first_name', 'last_name', 'middle_name', 'gender', 'date_of_birth', 'class_name', 'section_name', 'phone', 'email', 'parent_name', 'parent_phone', 'parent_email', 'parent_occupation', 'parent_address'],
            'columns' => [
                ['name' => 'student_id_no',      'required' => false, 'valid' => 'Any unique text',            'description' => 'Unique student ID. Leave blank to auto-generate.',                    'example' => 'STU001'],
                ['name' => 'first_name',          'required' => true,  'valid' => 'Text',                       'description' => 'Student first name.',                                                  'example' => 'John'],
                ['name' => 'last_name',           'required' => true,  'valid' => 'Text',                       'description' => 'Student last name / surname.',                                         'example' => 'Kamara'],
                ['name' => 'middle_name',         'required' => false, 'valid' => 'Text',                       'description' => 'Middle name (optional).',                                              'example' => ''],
                ['name' => 'gender',              'required' => true,  'valid' => 'male OR female',             'description' => 'Must be exactly "male" or "female" (lowercase).',                      'example' => 'male'],
                ['name' => 'date_of_birth',       'required' => false, 'valid' => 'YYYY-MM-DD',                'description' => 'Date of birth. Example: 15 May 2010 = 2010-05-15.',                    'example' => '2010-05-15'],
                ['name' => 'class_name',          'required' => true,  'valid' => 'Must match existing class',  'description' => 'Must exactly match a class name in the system (case-insensitive).',     'example' => 'JSS 1'],
                ['name' => 'section_name',        'required' => false, 'valid' => 'Must match existing section','description' => 'Section/stream within the class. Must exist for that class.',           'example' => 'A'],
                ['name' => 'phone',               'required' => false, 'valid' => 'Phone number',              'description' => 'Student phone number.',                                                'example' => '+23276123456'],
                ['name' => 'email',               'required' => false, 'valid' => 'Valid email address',        'description' => 'Student email address.',                                               'example' => ''],
                ['name' => 'parent_name',         'required' => false, 'valid' => 'Text',                      'description' => 'Parent/guardian full name. If provided, a parent account is created.',  'example' => 'Mary Kamara'],
                ['name' => 'parent_phone',        'required' => false, 'valid' => 'Phone number',              'description' => 'Parent phone number.',                                                 'example' => '+23276123457'],
                ['name' => 'parent_email',        'required' => false, 'valid' => 'Valid email address',        'description' => 'Parent email address.',                                                'example' => ''],
                ['name' => 'parent_occupation',   'required' => false, 'valid' => 'Text',                      'description' => 'Parent occupation.',                                                   'example' => 'Teacher'],
                ['name' => 'parent_address',      'required' => false, 'valid' => 'Text',                      'description' => 'Parent address.',                                                      'example' => 'Freetown'],
            ],
        ];
    }

    private function studentTemplateSamples(): array
    {
        return [
            ['STU001', 'John', 'Kamara', '', 'male', '2010-05-15', 'JSS 1', 'A', '+23276123456', '', 'Mary Kamara', '+23276123457', '', 'Teacher', 'Freetown'],
            ['STU002', 'Fatima', 'Bangura', 'Amina', 'female', '2011-08-22', 'JSS 1', 'A', '+23276123458', 'fatima@example.com', 'Ibrahim Bangura', '+23276123459', 'ibrahim@example.com', 'Engineer', 'Bo'],
            ['STU003', 'Ibrahim', 'Sesay', '', 'male', '2009-01-10', 'JSS 2', 'B', '', '', '', '', '', '', ''],
            ['', 'Aisha', 'Mansaray', '', 'female', '2012-03-05', 'JSS 1', '', '+23276123460', '', 'Fatima Mansaray', '+23276123461', '', 'Nurse', 'Freetown'],
        ];
    }

    private function staffTemplateInstructions(): array
    {
        return [
            'description' => 'Fill in the Sample Data sheet with your staff data. Departments and designations must already exist in the system.',
            'rules' => [
                'emp_id, first_name, last_name, and gender are REQUIRED.',
                'gender must be exactly "male" or "female" (lowercase).',
                'teacher_type must be one of: subject_teacher, form_master, both, non_teaching (lowercase with underscores).',
                'department_name and designation_name are optional but must match existing records if provided.',
                'email must be valid if provided.',
            ],
            'headers' => ['emp_id', 'first_name', 'last_name', 'middle_name', 'gender', 'date_of_birth', 'phone', 'email', 'department_name', 'designation_name', 'teacher_type'],
            'columns' => [
                ['name' => 'emp_id',            'required' => true,  'valid' => 'Any unique text',            'description' => 'Unique employee ID. Must not duplicate existing records.',              'example' => 'TCH001'],
                ['name' => 'first_name',        'required' => true,  'valid' => 'Text',                       'description' => 'Staff first name.',                                                   'example' => 'Sarah'],
                ['name' => 'last_name',         'required' => true,  'valid' => 'Text',                       'description' => 'Staff last name / surname.',                                          'example' => 'Conteh'],
                ['name' => 'middle_name',       'required' => false, 'valid' => 'Text',                       'description' => 'Middle name (optional).',                                              'example' => ''],
                ['name' => 'gender',            'required' => true,  'valid' => 'male OR female',             'description' => 'Must be exactly "male" or "female" (lowercase).',                      'example' => 'female'],
                ['name' => 'date_of_birth',     'required' => false, 'valid' => 'YYYY-MM-DD',                'description' => 'Date of birth.',                                                      'example' => '1990-03-20'],
                ['name' => 'phone',             'required' => false, 'valid' => 'Phone number',              'description' => 'Phone number.',                                                       'example' => '+23276123458'],
                ['name' => 'email',             'required' => false, 'valid' => 'Valid email address',        'description' => 'Email address.',                                                      'example' => ''],
                ['name' => 'department_name',   'required' => false, 'valid' => 'Must match existing dept',   'description' => 'Department name. Must exist in the system.',                            'example' => 'Mathematics'],
                ['name' => 'designation_name',  'required' => false, 'valid' => 'Must match existing desig',  'description' => 'Designation/title. Must exist in the system.',                          'example' => 'Senior Teacher'],
                ['name' => 'teacher_type',      'required' => false, 'valid' => 'subject_teacher, form_master, both, or non_teaching', 'description' => 'Type of teacher. Default: non_teaching.',             'example' => 'subject_teacher'],
            ],
        ];
    }

    private function staffTemplateSamples(): array
    {
        return [
            ['TCH001', 'Sarah', 'Conteh', '', 'female', '1990-03-20', '+23276123458', '', 'Mathematics', 'Senior Teacher', 'subject_teacher'],
            ['TCH002', 'James', 'Koroma', 'Samuel', 'male', '1985-07-11', '+23276123459', 'james@example.com', 'English', 'Form Master', 'form_master'],
            ['TCH003', 'Grace', 'Williams', '', 'female', '1992-11-01', '', '', 'Science', 'Lab Technician', 'non_teaching'],
            ['TCH004', 'Mohamed', 'Turay', '', 'male', '1988-05-30', '+23276123460', '', 'Mathematics', 'Head of Department', 'both'],
        ];
    }

    private function parentTemplateInstructions(): array
    {
        return [
            'description' => 'Fill in the Sample Data sheet with parent/guardian data. Each row links one parent to one student. Parents are never duplicated: rows with the same email or phone are merged into one parent record.',
            'rules' => [
                'Student ID, Parent Full Name, Relationship, Email, and Phone are REQUIRED.',
                'Student ID accepts the student\'s Student ID or Admission Number (must already exist in this school).',
                'Relationship must be exactly one of: father, mother, guardian, uncle, aunt, sibling, other (lowercase).',
                'Email must be a valid email address.',
                'Primary Contact is optional: use "email" or "phone" to indicate the preferred contact method (default: email).',
                'If the same parent (same email or phone) appears on multiple rows, they are reused — never duplicated. All children get linked to the same parent record.',
                'Duplicate links (same parent + same child + same relationship) are skipped with a reason.',
                'Rows with errors do not block other rows. A row-level error report is shown after validation.',
                'Importing parents does NOT create portal accounts. Parents register themselves via the registration page using their email and phone.',
            ],
            'headers' => ['student_id', 'parent_full_name', 'relationship', 'email', 'phone', 'alt_phone', 'address', 'primary_contact'],
            'columns' => [
                ['name' => 'student_id',       'required' => true,  'valid' => 'Existing Student ID or Admission Number', 'description' => 'The child this parent should be linked to.',   'example' => 'STU001'],
                ['name' => 'parent_full_name', 'required' => true,  'valid' => 'Text',                                    'description' => 'Full name of the parent/guardian.',            'example' => 'Mary Kamara'],
                ['name' => 'relationship',     'required' => true,  'valid' => 'father, mother, guardian, uncle, aunt, sibling, other', 'description' => 'Relationship to the student.',   'example' => 'mother'],
                ['name' => 'email',            'required' => true,  'valid' => 'Valid email address',                     'description' => 'Parent email address. Used for identity matching and portal registration.', 'example' => 'mary@example.com'],
                ['name' => 'phone',            'required' => true,  'valid' => 'Phone number',                            'description' => 'Parent phone number. Used for identity matching.', 'example' => '+23276123456'],
                ['name' => 'alt_phone',        'required' => false, 'valid' => 'Phone number',                            'description' => 'Alternative phone number.',                    'example' => '+23276123457'],
                ['name' => 'address',          'required' => false, 'valid' => 'Text',                                    'description' => 'Home address.',                                'example' => 'Freetown'],
                ['name' => 'primary_contact',  'required' => false, 'valid' => 'email or phone',                          'description' => 'Preferred contact method. Default: email.',    'example' => 'phone'],
            ],
        ];
    }

    private function parentTemplateSamples(): array
    {
        return [
            ['STU001', 'Mary Kamara', 'mother', 'mary.kamara@example.com', '+23276123456', '', '15 Beach Road, Freetown', 'phone'],
            ['STU002', 'Ibrahim Bangura', 'father', 'ibrahim.bangura@example.com', '+23276123459', '+23276123460', '12 Kissy Road, Freetown', 'email'],
            ['STU001', 'Ibrahim Bangura', 'father', 'ibrahim.bangura@example.com', '+23276123459', '', '', ''],
            ['STU003', 'Fatima Mansaray', 'guardian', 'fatima.mansaray@example.com', '+23276123461', '', 'Bo Town, Bo', 'phone'],
            ['STU004', 'Hassan Kamara', 'uncle', 'hassan.kamara@example.com', '+23276123462', '', 'Makeni', 'email'],
        ];
    }

    private function curriculumTemplateInstructions(): array
    {
        return [
            'description' => 'Fill in the Sample Data sheet with your curriculum/subject offerings. Academic years, classes, sections, and departments must already exist.',
            'rules' => [
                'academic_year, class_name, subject_code, and subject_type are REQUIRED.',
                'class_name must match an existing class in the system (case-insensitive).',
                'subject_type must be exactly one of: compulsory, elective, selective (lowercase).',
                'stream must match an existing section for the given class.',
                'department must match an existing department if provided.',
                'is_required must be "yes" or "no" (default: yes).',
                'min_selection and max_selection must be numbers. max must be >= min.',
                'Each subject_code must be unique within the same class/stream/year.',
            ],
            'headers' => ['academic_year', 'level', 'class_name', 'stream', 'department', 'subject_code', 'subject_name', 'subject_type', 'selection_group', 'is_required', 'min_selection', 'max_selection'],
            'columns' => [
                ['name' => 'academic_year',    'required' => true,  'valid' => 'Must match existing year',  'description' => 'Academic year name (must exist in the system).',                         'example' => '2026'],
                ['name' => 'level',            'required' => false, 'valid' => 'Text',                      'description' => 'School level (e.g. junior, senior).',                                   'example' => 'junior'],
                ['name' => 'class_name',       'required' => true,  'valid' => 'Must match existing class', 'description' => 'Class name exactly as in the system (case-insensitive).',                  'example' => 'JSS 1'],
                ['name' => 'stream',           'required' => false, 'valid' => 'Must match existing section','description' => 'Section/stream within the class. Must exist.',                            'example' => 'A'],
                ['name' => 'department',       'required' => false, 'valid' => 'Must match existing dept',  'description' => 'Department name. Must exist in the system.',                              'example' => 'Mathematics'],
                ['name' => 'subject_code',     'required' => true,  'valid' => 'Any unique code',           'description' => 'Unique code for the subject (unique per class/stream/year).',             'example' => 'ENG01'],
                ['name' => 'subject_name',     'required' => false, 'valid' => 'Text',                      'description' => 'Full subject name.',                                                    'example' => 'English Language'],
                ['name' => 'subject_type',     'required' => true,  'valid' => 'compulsory, elective, or selective', 'description' => 'Whether the subject is compulsory, elective, or selective.',   'example' => 'compulsory'],
                ['name' => 'selection_group',  'required' => false, 'valid' => 'Text',                      'description' => 'Group name for elective selection constraints.',                         'example' => ''],
                ['name' => 'is_required',      'required' => false, 'valid' => 'yes or no',                 'description' => 'Is this subject required? Default: yes.',                                'example' => 'yes'],
                ['name' => 'min_selection',    'required' => false, 'valid' => 'Number >= 0',               'description' => 'Minimum subjects to select from this group. Default: 1.',                 'example' => '1'],
                ['name' => 'max_selection',    'required' => false, 'valid' => 'Number >= min_selection',   'description' => 'Maximum subjects to select from this group. Default: 1.',                 'example' => '1'],
            ],
        ];
    }

    private function curriculumTemplateSamples(): array
    {
        return [
            ['2026', 'junior', 'JSS 1', 'A', '', 'ENG01', 'English Language', 'compulsory', '', 'yes', '1', '1'],
            ['2026', 'junior', 'JSS 1', 'A', 'Mathematics', 'MTH01', 'Mathematics', 'compulsory', '', 'yes', '1', '1'],
            ['2026', 'junior', 'JSS 1', 'A', 'Science', 'SCI01', 'Basic Science', 'compulsory', '', 'yes', '1', '1'],
            ['2026', 'junior', 'JSS 1', 'A', '', 'ART01', 'Fine Art', 'elective', 'arts_group', 'no', '2', '3'],
            ['2026', 'junior', 'JSS 1', 'A', '', 'MUS01', 'Music', 'elective', 'arts_group', 'no', '2', '3'],
            ['2026', 'junior', 'JSS 2', 'B', 'English', 'ENG02', 'English Language II', 'compulsory', '', 'yes', '1', '1'],
        ];
    }

    private function timetableTemplateInstructions(): array
    {
        return [
            'description' => 'Fill in the Sample Data sheet with your timetable data. Classes, subjects, and teachers must already exist in the system.',
            'rules' => [
                'day, start_time, end_time, class_name, and subject_name are REQUIRED.',
                'day must be exactly one of: monday, tuesday, wednesday, thursday, friday, saturday, sunday (lowercase).',
                'start_time and end_time must be in HH:MM format (24-hour clock, e.g. 07:30, 14:15).',
                'class_name must match an existing class (case-insensitive).',
                'subject_name must match an existing subject for that class.',
                'teacher_name must be "FirstName LastName" matching an existing staff member.',
                'section_name is optional but must match an existing section for the class.',
            ],
            'headers' => ['academic_year', 'day', 'start_time', 'end_time', 'class_name', 'section_name', 'subject_name', 'teacher_name', 'room', 'lesson_type'],
            'columns' => [
                ['name' => 'academic_year',  'required' => false, 'valid' => 'Must match existing year',     'description' => 'Academic year name (must exist in the system).',                  'example' => '2026'],
                ['name' => 'day',            'required' => true,  'valid' => 'monday, tuesday, ..., sunday', 'description' => 'Day of the week (lowercase, no abbreviations).',                'example' => 'monday'],
                ['name' => 'start_time',     'required' => true,  'valid' => 'HH:MM (24h format)',          'description' => 'Lesson start time in 24-hour format.',                         'example' => '07:30'],
                ['name' => 'end_time',       'required' => true,  'valid' => 'HH:MM (24h format)',          'description' => 'Lesson end time in 24-hour format.',                           'example' => '08:15'],
                ['name' => 'class_name',     'required' => true,  'valid' => 'Must match existing class',   'description' => 'Class name exactly as in the system.',                          'example' => 'JSS 1'],
                ['name' => 'section_name',   'required' => false, 'valid' => 'Must match existing section', 'description' => 'Section/stream within the class.',                              'example' => 'A'],
                ['name' => 'subject_name',   'required' => true,  'valid' => 'Must match existing subject', 'description' => 'Subject name as in the system (must belong to the class).',     'example' => 'English Language'],
                ['name' => 'teacher_name',   'required' => false, 'valid' => 'FirstName LastName',           'description' => 'Teacher full name. Must match existing staff (first + last).', 'example' => 'John Kamara'],
                ['name' => 'room',           'required' => false, 'valid' => 'Text',                        'description' => 'Room or location identifier.',                                'example' => 'Room 101'],
                ['name' => 'lesson_type',    'required' => false, 'valid' => 'Text',                        'description' => 'Type of lesson (e.g. lecture, lab, practical).',              'example' => ''],
            ],
        ];
    }

    private function timetableTemplateSamples(): array
    {
        return [
            ['2026', 'monday', '07:30', '08:15', 'JSS 1', 'A', 'English Language', 'John Kamara', 'Room 101', ''],
            ['2026', 'monday', '08:20', '09:05', 'JSS 1', 'A', 'Mathematics', 'Sarah Conteh', 'Room 101', ''],
            ['2026', 'monday', '09:10', '09:55', 'JSS 1', 'A', 'Basic Science', 'Grace Williams', 'Lab 1', 'practical'],
            ['2026', 'monday', '07:30', '08:15', 'JSS 2', 'B', 'English Language', 'John Kamara', 'Room 102', ''],
            ['2026', 'tuesday', '07:30', '08:15', 'JSS 1', 'A', 'Mathematics', 'Sarah Conteh', 'Room 101', ''],
            ['2026', 'tuesday', '08:20', '09:05', 'JSS 1', 'B', 'English Language', 'James Koroma', 'Room 103', ''],
        ];
    }

    private function getImportService(string $type): StudentImportService|StaffImportService|ParentImportService|CurriculumImportService|TimetableImportService
    {
        $schoolId = $this->getSchoolId();

        return match ($type) {
            'students'   => new StudentImportService($schoolId),
            'parents'    => new ParentImportService($schoolId),
            'staff'      => new StaffImportService($schoolId),
            'curriculum' => new CurriculumImportService($schoolId),
            'timetables' => new TimetableImportService($schoolId),
            default      => abort(404),
        };
    }
}
