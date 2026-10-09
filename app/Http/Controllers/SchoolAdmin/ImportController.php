<?php

namespace App\Http\Controllers\SchoolAdmin;

use App\Http\Controllers\Controller;
use App\Models\ImportJob;
use App\Models\School;
use App\Services\AI\AIUnavailableException;
use App\Services\AI\ImportColumnMapper;
use App\Services\CurriculumImportService;
use App\Services\ParentImportService;
use App\Services\StaffImportService;
use App\Services\StudentImportService;
use App\Services\SubjectImportService;
use App\Services\TimetableImportService;
use App\Support\Imports\ImportTemplateRegistry;
use Illuminate\Http\JsonResponse;
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
    public function index(): Response
    {
        $jobs = ImportJob::query()
            ->where('school_id', $this->getSchoolId())
            ->latest()
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('SchoolAdmin/Imports/Index', [
            // This component is also rendered by ResultImportController at
            // /school/imports, which sends the nested meta shape - both must
            // agree or the page breaks on one of the two routes.
            'imports' => [
                'data'  => $jobs->items(),
                'meta'  => [
                    'total'        => $jobs->total(),
                    'per_page'     => $jobs->perPage(),
                    'current_page' => $jobs->currentPage(),
                    'last_page'    => $jobs->lastPage(),
                    'from'         => $jobs->firstItem(),
                    'to'           => $jobs->lastItem(),
                ],
            ],
        ]);
    }

    public function create(string $type): Response
    {
        abort_unless(ImportTemplateRegistry::supports($type), 404);

        return Inertia::render('SchoolAdmin/Imports/Create', [
            'importType' => $type,
        ]);
    }

    public function upload(Request $request, string $type): RedirectResponse
    {
        abort_unless(ImportTemplateRegistry::supports($type), 404);

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

        try {
            $service->parseFile($job);
        } catch (\Throwable $e) {
            report($e);
            $job->update([
                'status'         => 'failed',
                'import_summary' => ['error' => $e->getMessage()],
            ]);

            return redirect()->route('school-admin.imports.index')
                ->with('error', 'We could not read that file. Please check it uses the template format and try again.');
        }

        return redirect()->route('school-admin.imports.preview', $job);
    }

    public function preview(Request $request, ImportJob $job): Response
    {
        abort_unless($job->school_id === $this->getSchoolId(), 403);

        $service = $this->getImportService($job->import_type);

        try {
            $raw = $service->previewRows($job);
        } catch (\Throwable $e) {
            report($e);
            $job->update([
                'status'         => 'failed',
                'import_summary' => ['error' => $e->getMessage()],
            ]);

            return redirect()
                ->route('school-admin.imports.index')
                ->with('error', 'We could not parse that file. Please download the template again and retry.');
        }

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

        try {
            $summary = $service->executeImport($job);
        } catch (\Throwable $e) {
            report($e);
            $job->update([
                'status'         => 'failed',
                'import_summary' => ['error' => $e->getMessage()],
            ]);

            return redirect()
                ->route('school-admin.imports.index')
                ->with('error', 'The import failed. Please review your file and try again.');
        }

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
        abort_unless(ImportTemplateRegistry::supports($type), 404);

        $spreadsheet = new Spreadsheet();
        $spreadsheet->removeSheetByIndex(0);

        $instructions = ImportTemplateRegistry::instructions($type);
        $samples = ImportTemplateRegistry::samples($type);

        $headers = $instructions['headers'];

        $this->buildInstructionSheet($spreadsheet, $type, $instructions);
        $this->buildSampleSheet($spreadsheet, $headers, $samples);

        $filename = "{$type}_import_template.xlsx";
        $tempPath = storage_path("app/private/{$filename}");
        \Illuminate\Support\Facades\File::ensureDirectoryExists(dirname($tempPath));
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

    /**
     * Ask the AI to suggest how the uploaded file's columns map to the target
     * fields for this import type. Returns a reviewable mapping persisted on the
     * job; nothing is imported here.
     */
    public function analyzeStructure(Request $request, ImportJob $job, ImportColumnMapper $mapper): JsonResponse
    {
        abort_unless($job->school_id === $this->getSchoolId(), 403);

        $school = School::findOrFail($this->getSchoolId());

        try {
            $result = $mapper->analyze($job, auth()->user(), $school);
        } catch (AIUnavailableException $e) {
            return response()->json([
                'error' => $e->getMessage(),
                'type'  => $e->type,
            ], $e->toHttpStatus());
        } catch (\Throwable $e) {
            report($e);

            return response()->json([
                'error' => 'We could not analyse that file. Please check it is a readable spreadsheet and try again.',
            ], 422);
        }

        return response()->json($result);
    }

    private function getImportService(string $type): StudentImportService|StaffImportService|ParentImportService|CurriculumImportService|TimetableImportService|SubjectImportService
    {
        $schoolId = $this->getSchoolId();

        return match ($type) {
            'students'   => new StudentImportService($schoolId),
            'parents'    => new ParentImportService($schoolId),
            'staff'      => new StaffImportService($schoolId),
            'subjects'   => new SubjectImportService($schoolId),
            'curriculum' => new CurriculumImportService($schoolId),
            'timetables' => new TimetableImportService($schoolId),
            default      => abort(404),
        };
    }
}
