<?php

namespace App\Services;

use App\Models\{AcademicYear, Department, ImportJob, SchoolClass, Section, Subject, SubjectOffering};
use App\Support\Imports\TabularReader;
use App\Support\StoredFile;
use Illuminate\Support\Facades\DB;

class CurriculumImportService
{
    private const EXPECTED_HEADERS = [
        'academic_year', 'level', 'class_name', 'stream', 'department', 'subject_code',
        'subject_name', 'subject_type', 'selection_group', 'is_required', 'min_selection', 'max_selection',
    ];

    private const VALID_SUBJECT_TYPES = ['compulsory', 'elective', 'selective'];

    private const HEADER_MAP = [
        'academic year'       => 'academic_year',
        'academic_year'       => 'academic_year',
        'level'               => 'level',
        'class'               => 'class_name',
        'class name'          => 'class_name',
        'class_name'          => 'class_name',
        'stream'              => 'stream',
        'section'             => 'stream',
        'department'          => 'department',
        'dept'                => 'department',
        'subject code'        => 'subject_code',
        'subject_code'        => 'subject_code',
        'code'                => 'subject_code',
        'subject name'        => 'subject_name',
        'subject_name'        => 'subject_name',
        'subject'             => 'subject_name',
        'subject type'        => 'subject_type',
        'subject_type'        => 'subject_type',
        'type'                => 'subject_type',
        'selection group'     => 'selection_group',
        'selection_group'     => 'selection_group',
        'group'               => 'selection_group',
        'is required'         => 'is_required',
        'is_required'         => 'is_required',
        'required'            => 'is_required',
        'min selection'       => 'min_selection',
        'min_selection'       => 'min_selection',
        'min'                 => 'min_selection',
        'max selection'       => 'max_selection',
        'max_selection'       => 'max_selection',
        'max'                 => 'max_selection',
    ];

    private int $schoolId;

    public function __construct(int $schoolId)
    {
        $this->schoolId = $schoolId;
    }

    public function parseFile(ImportJob $job): array
    {
        $filePath = StoredFile::localPath($job->file_path, 'private');

        if (!file_exists($filePath)) {
            throw new \RuntimeException("Import file not found: {$job->file_name}");
        }

        $dataRows = TabularReader::read($filePath, self::EXPECTED_HEADERS, self::HEADER_MAP)['rows'];

        $job->update([
            'total_rows' => count($dataRows),
            'import_options' => array_merge($job->import_options ?? [], ['parsed_data' => $dataRows]),
            'status' => 'parsed',
        ]);

        return $dataRows;
    }

    public function validateRows(ImportJob $job): array
    {
        $options = $job->import_options ?? [];
        $rows = $options['parsed_data'] ?? $this->parseFile($job);

        $valid = [];
        $errors = [];

        $existingClasses = SchoolClass::where('school_id', $this->schoolId)
            ->with('sections')
            ->get()
            ->keyBy(fn($c) => strtolower($c->name));

        $existingSections = [];
        foreach ($existingClasses as $class) {
            foreach ($class->sections as $section) {
                $existingSections[strtolower($class->name)][strtolower($section->name)] = $section->id;
            }
        }

        $existingDepartments = Department::where('school_id', $this->schoolId)
            ->pluck('id', 'name')
            ->mapWithKeys(fn($id, $name) => [strtolower($name) => $id])
            ->toArray();

        $existingSubjects = Subject::where('school_id', $this->schoolId)
            ->get()
            ->keyBy(fn($s) => strtolower($s->code));

        $existingYears = AcademicYear::where('school_id', $this->schoolId)
            ->get()
            ->keyBy(fn($y) => strtolower($y->name));

        $autoCreate = $job->import_options['auto_create_classes'] ?? false;

        $seenCombinations = [];
        $groupConstraints = [];

        $classCache = [];
        $sectionCache = [];
        $deptCache = [];

        foreach ($rows as $row) {
            $rowNum = $row['__row_number'];
            $rowErrors = [];

            $yearName = strtolower($row['academic_year'] ?? '');
            $level = strtolower($row['level'] ?? '');
            $className = strtolower($row['class_name'] ?? '');
            $stream = strtolower($row['stream'] ?? '');
            $department = strtolower($row['department'] ?? '');
            $subjectCode = strtoupper(trim($row['subject_code'] ?? ''));
            $subjectName = trim($row['subject_name'] ?? '');
            $subjectType = strtolower(trim($row['subject_type'] ?? ''));
            $selectionGroup = strtolower(trim($row['selection_group'] ?? ''));
            $isRequired = strtolower(trim($row['is_required'] ?? 'yes'));
            $minSelection = (int) ($row['min_selection'] ?? 1);
            $maxSelection = (int) ($row['max_selection'] ?? 1);

            if ($yearName === '') {
                $rowErrors[] = 'academic_year is required.';
            } elseif (!isset($existingYears[$yearName])) {
                $rowErrors[] = "academic_year '{$row['academic_year']}' not found.";
            }

            if ($className === '') {
                $rowErrors[] = 'class_name is required.';
            } else {
                if (!isset($existingClasses[$className])) {
                    if ($autoCreate) {
                        $classCache[$className] = $classCache[$className] ?? null;
                    } else {
                        $rowErrors[] = "class_name '{$row['class_name']}' not found and auto_create_classes is disabled.";
                    }
                }
            }

            if ($stream !== '' && $className !== '' && isset($existingClasses[$className])) {
                $streamKey = $className . '|' . $stream;
                if (!isset($existingSections[$className][$stream])) {
                    if ($autoCreate) {
                        $sectionCache[$streamKey] = $sectionCache[$streamKey] ?? null;
                    } else {
                        $rowErrors[] = "stream '{$row['stream']}' not found for class '{$row['class_name']}' and auto_create_classes is disabled.";
                    }
                }
            }

            if ($department !== '') {
                if (!isset($existingDepartments[$department])) {
                    if ($autoCreate) {
                        $deptCache[$department] = $deptCache[$department] ?? null;
                    } else {
                        $rowErrors[] = "department '{$row['department']}' not found and auto_create_classes is disabled.";
                    }
                }
            }

            if ($subjectCode === '') {
                $rowErrors[] = 'subject_code is required.';
            }

            if ($subjectType === '' || !in_array($subjectType, self::VALID_SUBJECT_TYPES, true)) {
                $rowErrors[] = 'subject_type must be compulsory, elective, or selective.';
            }

            if ($minSelection < 0) {
                $rowErrors[] = 'min_selection must be non-negative.';
            }

            if ($maxSelection < $minSelection) {
                $rowErrors[] = 'max_selection must be >= min_selection.';
            }

            if ($isRequired !== '' && !in_array($isRequired, ['yes', 'no', 'true', 'false', '1', '0'], true)) {
                $rowErrors[] = 'is_required must be yes or no.';
            }

            if ($subjectCode !== '' && $className !== '') {
                $comboKey = $subjectCode . '|' . $className . '|' . $stream . '|' . $yearName;
                if (isset($seenCombinations[$comboKey])) {
                    $rowErrors[] = "Duplicate subject_code '{$subjectCode}' for the same class/stream/year.";
                }
                $seenCombinations[$comboKey] = true;
            }

            if ($selectionGroup !== '' && $className !== '') {
                $groupKey = $selectionGroup . '|' . $className . '|' . $stream . '|' . $yearName;
                if (!isset($groupConstraints[$groupKey])) {
                    $groupConstraints[$groupKey] = ['min' => $minSelection, 'max' => $maxSelection, 'rows' => []];
                }
                $groupConstraints[$groupKey]['rows'][] = $rowNum;
                $groupConstraints[$groupKey]['min'] = max($groupConstraints[$groupKey]['min'], $minSelection);
                $groupConstraints[$groupKey]['max'] = min($groupConstraints[$groupKey]['max'], $maxSelection);
            }

            if (!empty($rowErrors)) {
                $errors[$rowNum] = $rowErrors;
                continue;
            }

            $resolvedClassId = $existingClasses[$className]->id ?? null;
            $resolvedSectionId = null;
            if ($stream !== '' && isset($existingSections[$className][$stream])) {
                $resolvedSectionId = $existingSections[$className][$stream];
            }
            $resolvedDeptId = $existingDepartments[$department] ?? null;
            $resolvedYearId = $existingYears[$yearName]->id ?? null;
            $resolvedSubjectId = isset($existingSubjects[$subjectCode]) ? $existingSubjects[$subjectCode]->id : null;

            $isRequiredBool = in_array($isRequired, ['yes', 'true', '1'], true);

            $valid[] = [
                '__row_number'          => $rowNum,
                '__sheet'               => $row['__sheet'] ?? '',
                '__academic_year_id'    => $resolvedYearId,
                '__class_id'            => $resolvedClassId,
                '__class_name_raw'      => $row['class_name'] ?? '',
                '__class_name_lower'    => $className,
                '__level'               => $level,
                '__section_id'          => $resolvedSectionId,
                '__stream_raw'          => $row['stream'] ?? '',
                '__department_id'       => $resolvedDeptId,
                '__department_raw'      => $row['department'] ?? '',
                '__subject_id'          => $resolvedSubjectId,
                '__subject_code'        => $subjectCode,
                '__subject_name'        => $subjectName,
                '__subject_type'        => $subjectType,
                '__selection_group'     => $selectionGroup,
                '__is_required'         => $isRequiredBool,
                '__min_selection'       => $minSelection,
                '__max_selection'       => $maxSelection,
            ];
        }

        foreach ($groupConstraints as $groupKey => $constraint) {
            if ($constraint['min'] > $constraint['max']) {
                $parts = explode('|', $groupKey);
                foreach ($constraint['rows'] as $rNum) {
                    $errors[$rNum][] = "Selection group '{$parts[0]}' has inconsistent min/max constraints across rows.";
                }
                $valid = array_filter($valid, fn($v) => !in_array($v['__row_number'], $constraint['rows']));
            }
        }

        $valid = array_values($valid);

        $job->update([
            'valid_rows'        => count($valid),
            'error_rows'        => count($errors),
            'validation_errors' => $errors,
            'validated_at'      => now(),
            'status'            => 'validated',
        ]);

        return [
            'valid'  => $valid,
            'errors' => $errors,
            'total'  => $job->total_rows,
        ];
    }

    public function previewRows(ImportJob $job): array
    {
        $validation = $this->validateRows($job);
        $validRows = $validation['valid'];

        $byClass = [];

        foreach ($validRows as $row) {
            $classKey = $row['__class_name_raw'] ?: 'Unknown Class';
            $streamKey = $row['__stream_raw'] ?: 'No Stream';

            if (!isset($byClass[$classKey])) {
                $byClass[$classKey] = [
                    'class_id'   => $row['__class_id'],
                    'level'      => $row['__level'],
                    'streams'    => [],
                    'counts'     => ['compulsory' => 0, 'elective' => 0, 'selective' => 0],
                    'total'      => 0,
                ];
            }

            if (!isset($byClass[$classKey]['streams'][$streamKey])) {
                $byClass[$classKey]['streams'][$streamKey] = [
                    'section_id' => $row['__section_id'],
                    'subjects'   => [],
                    'counts'     => ['compulsory' => 0, 'elective' => 0, 'selective' => 0],
                    'total'      => 0,
                    'groups'     => [],
                ];
            }

            $type = $row['__subject_type'];

            $byClass[$classKey]['counts'][$type]++;
            $byClass[$classKey]['total']++;

            $byClass[$classKey]['streams'][$streamKey]['counts'][$type]++;
            $byClass[$classKey]['streams'][$streamKey]['total']++;

            $byClass[$classKey]['streams'][$streamKey]['subjects'][] = [
                'code'            => $row['__subject_code'],
                'name'            => $row['__subject_name'],
                'type'            => $type,
                'selection_group' => $row['__selection_group'],
                'is_required'     => $row['__is_required'],
                'min_selection'   => $row['__min_selection'],
                'max_selection'   => $row['__max_selection'],
            ];

            if ($row['__selection_group'] !== '') {
                $gKey = $row['__selection_group'];
                if (!isset($byClass[$classKey]['streams'][$streamKey]['groups'][$gKey])) {
                    $byClass[$classKey]['streams'][$streamKey]['groups'][$gKey] = [
                        'min'         => $row['__min_selection'],
                        'max'         => $row['__max_selection'],
                        'subject_count' => 0,
                    ];
                }
                $byClass[$classKey]['streams'][$streamKey]['groups'][$gKey]['subject_count']++;
                $byClass[$classKey]['streams'][$streamKey]['groups'][$gKey]['min'] = max(
                    $byClass[$classKey]['streams'][$streamKey]['groups'][$gKey]['min'],
                    $row['__min_selection']
                );
                $byClass[$classKey]['streams'][$streamKey]['groups'][$gKey]['max'] = min(
                    $byClass[$classKey]['streams'][$streamKey]['groups'][$gKey]['max'],
                    $row['__max_selection']
                );
            }
        }

        return [
            'classes'     => $byClass,
            'total_rows'  => $validation['total'],
            'valid_rows'  => count($validRows),
            'error_rows'  => $validation['errors'] ? count($validation['errors']) : 0,
            'errors'      => $validation['errors'],
        ];
    }

    public function executeImport(ImportJob $job): array
    {
        $validation = $this->validateRows($job);
        $validRows = $validation['valid'];

        if (empty($validRows)) {
            $job->update([
                'status'         => 'completed',
                'imported_rows'  => 0,
                'import_summary' => ['message' => 'No valid rows to import.'],
                'imported_at'    => now(),
            ]);

            return ['offerings_created' => 0, 'classes_created' => 0, 'sections_created' => 0, 'departments_created' => 0, 'errors' => []];
        }

        $job->update(['status' => 'importing']);

        $summary = [
            'offerings_created' => 0,
            'classes_created'   => 0,
            'sections_created'  => 0,
            'departments_created' => 0,
            'per_class'         => [],
            'errors'            => [],
        ];

        $autoCreate = $job->import_options['auto_create_classes'] ?? false;

        $classCache = [];
        $sectionCache = [];
        $deptCache = [];

        foreach ($validRows as $row) {
            try {
                DB::transaction(function () use ($row, $autoCreate, &$classCache, &$sectionCache, &$deptCache, &$summary) {
                    $classId = $this->resolveClassId($row, $autoCreate, $classCache, $summary);
                    $sectionId = $this->resolveSectionId($row, $classId, $autoCreate, $sectionCache, $summary);
                    $deptId = $this->resolveDepartmentId($row, $autoCreate, $deptCache, $summary);

                    $subjectId = $row['__subject_id'];
                    if ($subjectId === null) {
                        $subjectId = Subject::create([
                            'school_id'     => $this->schoolId,
                            'class_id'      => $classId,
                            'name'          => $row['__subject_name'],
                            'code'          => $row['__subject_code'],
                            'department_id' => $deptId,
                            'school_level'  => $row['__level'],
                            'is_core'       => $row['__subject_type'] === 'compulsory',
                        ])->id;
                    }

                    SubjectOffering::create([
                        'school_id'         => $this->schoolId,
                        'academic_year_id'  => $row['__academic_year_id'],
                        'class_id'          => $classId,
                        'section_id'        => $sectionId,
                        'department_id'     => $deptId,
                        'subject_id'        => $subjectId,
                        'subject_name'      => $row['__subject_name'],
                        'subject_code'      => $row['__subject_code'],
                        'subject_type'      => $row['__subject_type'],
                        'selection_group'   => $row['__selection_group'] ?: null,
                        'is_required'       => $row['__is_required'],
                        'min_selection'     => $row['__min_selection'],
                        'max_selection'     => $row['__max_selection'],
                        'sort_order'        => $summary['offerings_created'] + 1,
                        'is_active'         => true,
                    ]);

                    $summary['offerings_created']++;

                    $classLabel = $row['__class_name_raw'] ?: $row['__class_name_lower'];
                    $streamLabel = $row['__stream_raw'] ?: 'No Stream';

                    if (!isset($summary['per_class'][$classLabel])) {
                        $summary['per_class'][$classLabel] = ['streams' => [], 'total' => 0];
                    }
                    if (!isset($summary['per_class'][$classLabel]['streams'][$streamLabel])) {
                        $summary['per_class'][$classLabel]['streams'][$streamLabel] = 0;
                    }
                    $summary['per_class'][$classLabel]['streams'][$streamLabel]++;
                    $summary['per_class'][$classLabel]['total']++;
                });
            } catch (\Throwable $e) {
                $summary['errors'][$row['__row_number']] = $e->getMessage();
            }
        }

        $job->update([
            'status'         => 'completed',
            'imported_rows'  => $summary['offerings_created'],
            'import_summary' => $summary,
            'imported_at'    => now(),
        ]);

        return $summary;
    }

    private function resolveClassId(array $row, bool $autoCreate, array &$cache, array &$summary): int
    {
        $className = $row['__class_name_lower'];

        if (isset($cache[$className])) {
            return $cache[$className];
        }

        $existing = SchoolClass::where('school_id', $this->schoolId)
            ->whereRaw('LOWER(name) = ?', [$className])
            ->first();

        if ($existing) {
            $cache[$className] = $existing->id;
            return $existing->id;
        }

        if (!$autoCreate) {
            throw new \RuntimeException("Class '{$row['__class_name_raw']}' not found.");
        }

        $newClass = SchoolClass::create([
            'school_id'    => $this->schoolId,
            'name'         => $row['__class_name_raw'] ?: $row['__class_name_lower'],
            'school_level' => $row['__level'] ?: null,
            'is_active'    => true,
        ]);

        $summary['classes_created']++;
        $cache[$className] = $newClass->id;

        return $newClass->id;
    }

    private function resolveSectionId(array $row, int $classId, bool $autoCreate, array &$cache, array &$summary): ?int
    {
        $stream = $row['__stream_raw'];

        if ($stream === '') {
            return null;
        }

        $cacheKey = $classId . '|' . strtolower($stream);

        if (isset($cache[$cacheKey])) {
            return $cache[$cacheKey];
        }

        $existing = Section::where('school_id', $this->schoolId)
            ->where('class_id', $classId)
            ->whereRaw('LOWER(name) = ?', [strtolower($stream)])
            ->first();

        if ($existing) {
            $cache[$cacheKey] = $existing->id;
            return $existing->id;
        }

        if (!$autoCreate) {
            throw new \RuntimeException("Stream '{$stream}' not found for class ID {$classId}.");
        }

        $newSection = Section::create([
            'school_id'  => $this->schoolId,
            'class_id'   => $classId,
            'name'       => $stream,
            'is_active'  => true,
        ]);

        $summary['sections_created']++;
        $cache[$cacheKey] = $newSection->id;

        return $newSection->id;
    }

    private function resolveDepartmentId(array $row, bool $autoCreate, array &$cache, array &$summary): ?int
    {
        $department = $row['__department_raw'];

        if ($department === '') {
            return null;
        }

        $deptLower = strtolower($department);

        if (isset($cache[$deptLower])) {
            return $cache[$deptLower];
        }

        $existing = Department::where('school_id', $this->schoolId)
            ->whereRaw('LOWER(name) = ?', [$deptLower])
            ->first();

        if ($existing) {
            $cache[$deptLower] = $existing->id;
            return $existing->id;
        }

        if (!$autoCreate) {
            throw new \RuntimeException("Department '{$department}' not found.");
        }

        $newDept = Department::create([
            'school_id'  => $this->schoolId,
            'name'       => $department,
            'type'       => 'academic',
            'is_active'  => true,
        ]);

        $summary['departments_created']++;
        $cache[$deptLower] = $newDept->id;

        return $newDept->id;
    }
}
