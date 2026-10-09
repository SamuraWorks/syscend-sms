<?php

namespace App\Http\Controllers\SchoolAdmin;

use App\Http\Controllers\Controller;
use App\Models\Department;
use App\Models\Guardian;
use App\Models\House;
use App\Models\SchoolClass;
use App\Models\Section;
use App\Models\Student;
use App\Models\StudentDocument;
use App\Services\NotificationDispatchService;
use App\Services\StudentIdService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class StudentController extends Controller
{
    public function index(Request $request): Response
    {
        $schoolId = $this->getSchoolId();

        $students = Student::with([
                'schoolClass:id,name', 'section:id,name', 'guardian:id,name,phone',
                'house:id,name,color', 'department:id,name',
            ])
            ->where('school_id', $schoolId)
            ->when($request->search, fn ($q) => $q->where(function ($q) use ($request) {
                $q->where('first_name', 'like', "%{$request->search}%")
                  ->orWhere('last_name',  'like', "%{$request->search}%")
                  ->orWhere('admission_no', 'like', "%{$request->search}%");
            }))
            ->when($request->class_id,  fn ($q) => $q->where('class_id',  $request->class_id))
            ->when($request->section_id, fn ($q) => $q->where('section_id', $request->section_id))
            ->when($request->status,    fn ($q) => $q->where('status',    $request->status))
            ->latest()
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('SchoolAdmin/Students/Index', [
            'students' => [
                'data'  => $students->items(),
                'meta'  => [
                    'total'        => $students->total(),
                    'per_page'     => $students->perPage(),
                    'current_page' => $students->currentPage(),
                    'last_page'    => $students->lastPage(),
                    'from'         => $students->firstItem(),
                    'to'           => $students->lastItem(),
                ],
                'links' => [
                    'prev' => $students->previousPageUrl(),
                    'next' => $students->nextPageUrl(),
                ],
            ],
            'filters'  => $request->only('search', 'class_id', 'section_id', 'status'),
            'classes'  => SchoolClass::where('school_id', $schoolId)->orderBy('numeric_name')->get(['id', 'name']),
            'sections' => Section::where('school_id', $schoolId)->orderBy('name')->get(['id', 'class_id', 'name']),
            'stats'    => [
                'total'       => Student::where('school_id', $schoolId)->count(),
                'active'      => Student::where('school_id', $schoolId)->where('status', 'active')->count(),
                'alumni'      => Student::where('school_id', $schoolId)->where('status', 'alumni')->count(),
                'transferred' => Student::where('school_id', $schoolId)->where('status', 'transferred')->count(),
            ],
        ]);
    }

    public function create(): Response
    {
        $schoolId = $this->getSchoolId();

        return Inertia::render('SchoolAdmin/Students/Create', [
            'classes'          => SchoolClass::where('school_id', $schoolId)->orderBy('numeric_name')->get(['id', 'name', 'school_level']),
            'sections'         => Section::where('school_id', $schoolId)->orderBy('name')->get(['id', 'class_id', 'name']),
            'houses'           => House::where('is_active', true)->where('school_id', $schoolId)->orderBy('name')->get(['id', 'name', 'color']),
            'departments'      => Department::where('type', 'academic')->where('is_active', true)
                                    ->where('school_id', $schoolId)->orderBy('name')->get(['id', 'name']),
            'next_admission_no'=> StudentIdService::nextPreview($schoolId),
            'id_generation_enabled' => StudentIdService::generationEnabled($schoolId),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $schoolId = $this->getSchoolId();

        $data = $request->validate([
            // Personal
            'first_name'      => 'required|string|max:100',
            'last_name'       => 'nullable|string|max:100',
            'gender'          => 'required|in:male,female,other',
            'date_of_birth'   => 'nullable|date',
            'place_of_birth'  => 'nullable|string|max:150',
            'blood_group'     => 'nullable|string|max:5',
            'religion'        => 'nullable|string|max:50',
            'nationality'     => 'nullable|string|max:50',
            'phone'           => 'nullable|string|max:20',
            'email'           => 'nullable|email|max:150',
            'address'         => 'nullable|string|max:500',
            'photo'           => 'nullable|image|mimes:jpg,jpeg,png,webp|max:2048',
            'category'        => 'required|in:general,disabled,quota',
            'status'          => 'required|in:active,alumni,transferred,inactive',
            'admission_date'  => 'nullable|date',
            'admission_type'  => ['nullable', Rule::in(['new', 'transfer', 'returning'])],
            'previous_school' => 'nullable|string|max:200',
            'roll_no'         => 'nullable|string|max:50',
            // Student identifiers — admission_no is THE school-issued Student ID.
            // Required unless the school enabled auto-generation, in which case a
            // blank value is generated from the school's configured format.
            'admission_no'    => [
                Rule::requiredIf(fn () => ! StudentIdService::generationEnabled($schoolId)),
                'nullable', 'string', 'max:50',
                Rule::unique('students', 'admission_no')
                    ->where('school_id', $schoolId)
                    ->whereNull('deleted_at'),
            ],
            'student_id'      => [
                'nullable', 'string', 'max:30',
                Rule::unique('students', 'student_id')
                    ->where('school_id', $schoolId)
                    ->whereNull('deleted_at'),
            ],
            // Placement — class/section MUST belong to the current school
            'class_id'        => ['required', Rule::exists('classes', 'id')->where('school_id', $schoolId)->whereNull('deleted_at')],
            'section_id'      => ['nullable', Rule::exists('sections', 'id')->where('school_id', $schoolId)],
            'house_id'        => ['nullable', Rule::exists('houses', 'id')->where('school_id', $schoolId)],
            'department_id'   => ['nullable', Rule::exists('departments', 'id')->where('school_id', $schoolId)],
            // Guardian
            'guardian.name'       => 'required|string|max:150',
            'guardian.relation'   => 'required|string|max:50',
            'guardian.phone'      => 'nullable|string|max:20',
            'guardian.email'      => 'nullable|email|max:150',
            'guardian.occupation' => 'nullable|string|max:100',
            'guardian.address'    => 'nullable|string|max:500',
        ]);

        // Blank identifiers mean "auto-generate" — normalise before create.
        foreach (['admission_no', 'student_id'] as $idField) {
            if (isset($data[$idField]) && trim((string) $data[$idField]) === '') {
                $data[$idField] = null;
            }
        }

        // A section, when provided, must belong to the selected class.
        if (!empty($data['section_id'])) {
            $sectionClassId = Section::where('school_id', $schoolId)->where('id', $data['section_id'])->value('class_id');
            if (!$sectionClassId || (int) $sectionClassId !== (int) $data['class_id']) {
                return back()->withInput()
                    ->with('error', 'The selected section does not belong to the selected class.');
            }
        }

        // Departments are only valid for senior secondary (SSS) classes
        if (!empty($data['department_id'])) {
            $class = SchoolClass::find($data['class_id']);
            if (!$class || $class->school_level !== 'senior_secondary') {
                return back()->withInput()
                    ->with('error', 'Departments can only be assigned to Senior Secondary (SSS) students.');
            }
        }

        if ($request->hasFile('photo')) {
            $data['photo'] = $request->file('photo')->store("students/{$schoolId}/photos", 'public');
        }

        try {
            $schoolId = $this->getSchoolId();

            DB::transaction(function () use ($data, $schoolId) {
                $guardian = Guardian::create(array_merge(
                    $data['guardian'],
                    ['school_id' => $schoolId],
                ));

                $student = Student::create(array_merge(
                    collect($data)->except('guardian')->toArray(),
                    ['guardian_id' => $guardian->id, 'school_id' => $schoolId],
                ));

                $student->guardians()->syncWithoutDetaching([
                    $guardian->id => ['relationship' => $data['guardian']['relation'], 'is_primary' => true, 'school_id' => $schoolId],
                ]);
            });

            NotificationDispatchService::notifyRole(
                $schoolId, 'school-admin',
                'New Student Admission',
                "A new student {$data['first_name']} " . ($data['last_name'] ?? '') . " has been admitted.",
                '/school/students'
            );

            $msg = 'Student admitted successfully. The student and their parent can now sign up for their own logins through the school portal.';

            return redirect()->route('school.students.index')
                ->with('success', $msg);
        } catch (\Throwable $e) {
            return back()->withInput()->with('error', 'Failed to admit student: ' . $e->getMessage());
        }
    }

    public function show(Student $student): Response
    {
        $student->load([
            'schoolClass:id,name,school_level', 'section', 'guardian', 'documents',
            'house.houseMaster:id,first_name,last_name', 'department:id,name', 'guardians',
        ]);

        return Inertia::render('SchoolAdmin/Students/Show', [
            'student' => $student,
        ]);
    }

    public function edit(Student $student): Response
    {
        $student->load('guardian');

        return Inertia::render('SchoolAdmin/Students/Edit', [
            'student'     => $student,
            'classes'     => SchoolClass::where('school_id', $student->school_id)->orderBy('numeric_name')->get(['id', 'name', 'school_level']),
            'sections'    => Section::where('school_id', $student->school_id)->orderBy('name')->get(['id', 'class_id', 'name']),
            'houses'      => House::where('is_active', true)->where('school_id', $student->school_id)->orderBy('name')->get(['id', 'name', 'color']),
            'departments' => Department::where('type', 'academic')->where('is_active', true)
                                ->where('school_id', $student->school_id)->orderBy('name')->get(['id', 'name']),
            'id_generation_enabled' => StudentIdService::generationEnabled($student->school_id),
        ]);
    }

    public function update(Request $request, Student $student): RedirectResponse
    {
        $schoolId = (int) $student->school_id;

        $data = $request->validate([
            'first_name'      => 'required|string|max:100',
            'last_name'       => 'nullable|string|max:100',
            'gender'          => 'required|in:male,female,other',
            'date_of_birth'   => 'nullable|date',
            'place_of_birth'  => 'nullable|string|max:150',
            'blood_group'     => 'nullable|string|max:5',
            'religion'        => 'nullable|string|max:50',
            'nationality'     => 'nullable|string|max:50',
            'phone'           => 'nullable|string|max:20',
            'email'           => 'nullable|email|max:150',
            'address'         => 'nullable|string|max:500',
            'photo'           => 'nullable|image|mimes:jpg,jpeg,png,webp|max:2048',
            'category'        => 'required|in:general,disabled,quota',
            'status'          => 'required|in:active,alumni,transferred,inactive',
            'admission_date'  => 'nullable|date',
            'admission_type'  => ['nullable', Rule::in(['new', 'transfer', 'returning'])],
            'previous_school' => 'nullable|string|max:200',
            'roll_no'         => 'nullable|string|max:50',
            // Student ID is editable but must stay unique within the school
            'admission_no'    => [
                'required', 'string', 'max:50',
                Rule::unique('students', 'admission_no')
                    ->where('school_id', $student->school_id)
                    ->whereNull('deleted_at')
                    ->ignore($student->id),
            ],
            'student_id'      => [
                'nullable', 'string', 'max:30',
                Rule::unique('students', 'student_id')
                    ->where('school_id', $student->school_id)
                    ->whereNull('deleted_at')
                    ->ignore($student->id),
            ],
            // Placement — class/section MUST belong to the student's school
            'class_id'        => ['required', Rule::exists('classes', 'id')->where('school_id', $student->school_id)->whereNull('deleted_at')],
            'section_id'      => ['nullable', Rule::exists('sections', 'id')->where('school_id', $student->school_id)],
            'house_id'        => ['nullable', Rule::exists('houses', 'id')->where('school_id', $student->school_id)],
            'department_id'   => ['nullable', Rule::exists('departments', 'id')->where('school_id', $student->school_id)],
            'guardian.name'       => 'required|string|max:150',
            'guardian.relation'   => 'required|string|max:50',
            'guardian.phone'      => 'nullable|string|max:20',
            'guardian.email'      => 'nullable|email|max:150',
            'guardian.occupation' => 'nullable|string|max:100',
            'guardian.address'    => 'nullable|string|max:500',
        ]);

        foreach (['student_id'] as $idField) {
            if (isset($data[$idField]) && trim((string) $data[$idField]) === '') {
                $data[$idField] = null;
            }
        }

        if (!empty($data['section_id'])) {
            $sectionClassId = Section::where('school_id', $schoolId)->where('id', $data['section_id'])->value('class_id');
            if (!$sectionClassId || (int) $sectionClassId !== (int) $data['class_id']) {
                return back()->withInput()
                    ->with('error', 'The selected section does not belong to the selected class.');
            }
        }

        if (!empty($data['department_id'])) {
            $class = SchoolClass::find($data['class_id']);
            if (!$class || $class->school_level !== 'senior_secondary') {
                return back()->withInput()
                    ->with('error', 'Departments can only be assigned to Senior Secondary (SSS) students.');
            }
        }

        if ($request->hasFile('photo')) {
            if ($student->photo && Storage::disk('public')->exists($student->photo)) {
                Storage::disk('public')->delete($student->photo);
            }
            $data['photo'] = $request->file('photo')->store("students/{$student->school_id}/photos", 'public');
        } elseif ($request->boolean('remove_photo')) {
            if ($student->photo && Storage::disk('public')->exists($student->photo)) {
                Storage::disk('public')->delete($student->photo);
            }
            $data['photo'] = null;
        }

        try {
            DB::transaction(function () use ($data, $student, $schoolId) {
                $student->update(collect($data)->except('guardian')->toArray());

                $guardian = $student->guardian;
                if ($guardian) {
                    $guardian->update($data['guardian']);
                } else {
                    $guardian = Guardian::create(array_merge(
                        $data['guardian'],
                        ['school_id' => $student->school_id],
                    ));
                    $student->update(['guardian_id' => $guardian->id]);
                }

                $student->guardians()->syncWithoutDetaching([
                    $guardian->id => ['relationship' => $data['guardian']['relation'], 'is_primary' => true, 'school_id' => $schoolId],
                ]);
            });

            return redirect()->route('school.students.show', $student)->with('success', 'Student updated.');
        } catch (\Throwable $e) {
            return back()->withInput()->with('error', 'Failed to update student: ' . $e->getMessage());
        }
    }

    public function destroy(Student $student): RedirectResponse
    {
        try {
            $student->delete();
            return redirect()->route('school.students.index')->with('success', 'Student removed.');
        } catch (\Throwable $e) {
            return back()->with('error', 'Failed to delete student: ' . $e->getMessage());
        }
    }

    public function uploadDocument(Request $request, Student $student): RedirectResponse
    {
        $request->validate([
            'title' => 'required|string|max:150',
            'file'  => 'required|file|mimes:pdf,jpg,jpeg,png|max:5120',
            'visible_to_parent' => 'sometimes|boolean',
        ]);

        $path = $request->file('file')->store("students/{$student->id}/documents", 'private');

        StudentDocument::create([
            'school_id'  => $student->school_id,
            'student_id' => $student->id,
            'title'      => $request->title,
            'file_path'  => $path,
            'file_type'  => $request->file('file')->getMimeType(),
            'file_size'  => $request->file('file')->getSize(),
            'visible_to_parent' => (bool) $request->boolean('visible_to_parent'),
        ]);

        return back()->with('success', 'Document uploaded.');
    }

    public function toggleDocumentVisibility(StudentDocument $document): RedirectResponse
    {
        abort_unless((int) $document->school_id === (int) $this->getSchoolId(), 404);

        $document->update(['visible_to_parent' => !$document->visible_to_parent]);

        activity()
            ->performedOn($document)
            ->withProperties(['visible_to_parent' => $document->visible_to_parent, 'school_id' => $document->school_id])
            ->log('Document parent visibility toggled');

        return back()->with('success', $document->visible_to_parent ? 'Document is now visible to parents.' : 'Document hidden from parents.');
    }

    public function downloadDocument(StudentDocument $document)
    {
        abort_unless($document->school_id === (int) $this->getSchoolId(), 404);

        return Storage::disk('private')->download($document->file_path, $this->documentFilename($document));
    }

    private function documentFilename(StudentDocument $document): string
    {
        $ext = pathinfo($document->file_path, PATHINFO_EXTENSION);

        return Str::slug($document->title) . ($ext ? ".{$ext}" : '');
    }

    public function deleteDocument(StudentDocument $document): RedirectResponse
    {
        if (!$document->school_id || (int) $document->school_id === (int) $this->getSchoolId()) {
            Storage::disk('private')->delete($document->file_path);
            $document->delete();
        }

        return back()->with('success', 'Document deleted.');
    }

    public function bulkImport(Request $request): RedirectResponse
    {
        $request->validate([
            'csv_file'  => 'required|file|mimes:csv,txt|max:5120',
            'class_id'  => 'required|exists:classes,id',
            'section_id'=> 'nullable|exists:sections,id',
        ]);

        try {
            $schoolId = $this->getSchoolId();
            $file = $request->file('csv_file');
            $rows = array_map('str_getcsv', file($file->getRealPath()));
            $headers = array_map('strtolower', array_map('trim', array_shift($rows)));

            $class = SchoolClass::findOrFail($request->class_id);
            $imported = 0;
            $skipped = 0;
            $errors = [];

            DB::transaction(function () use ($rows, $headers, $schoolId, $class, $request, &$imported, &$skipped, &$errors) {
                foreach ($rows as $idx => $row) {
                    if (count($row) < 2 || empty($row[0])) {
                        $skipped++;
                        continue;
                    }

                    $data = array_combine($headers, $row);

                    $firstName = trim($data['first_name'] ?? '');
                    $lastName  = trim($data['last_name'] ?? '');

                    if (empty($firstName)) {
                        $errors[$idx + 2] = 'Missing first_name';
                        $skipped++;
                        continue;
                    }

                    $gender = strtolower(trim($data['gender'] ?? 'male'));
                    if (!in_array($gender, ['male', 'female', 'other'])) $gender = 'male';

                    // Find class by name or use default
                    $className = trim($data['class'] ?? $data['class_name'] ?? '');
                    $targetClass = $class;
                    if (!empty($className)) {
                        $found = SchoolClass::where('school_id', $schoolId)->where('name', 'like', "%{$className}%")->first();
                        if ($found) $targetClass = $found;
                    }

                    // Department (SSS only)
                    $departmentId = null;
                    $deptName = trim($data['department'] ?? $data['department_name'] ?? '');
                    if ($deptName !== '') {
                        if ($targetClass->school_level !== 'senior_secondary') {
                            $errors[$idx + 2] = "Row has department '{$deptName}' but class is not Senior Secondary";
                            $skipped++;
                            continue;
                        }
                        $foundDept = Department::where('school_id', $schoolId)->where('name', 'like', "%{$deptName}%")->first();
                        if (!$foundDept) {
                            $errors[$idx + 2] = "Department '{$deptName}' not found";
                            $skipped++;
                            continue;
                        }
                        $departmentId = $foundDept->id;
                    }

                    // Find section
                    $sectionId = $request->section_id;
                    $sectionName = trim($data['section'] ?? $data['section_name'] ?? '');
                    if (!empty($sectionName)) {
                        $found = Section::where('school_id', $schoolId)->where('name', 'like', "%{$sectionName}%")->first();
                        if ($found) $sectionId = $found->id;
                    }

                    // Create guardian first
                    $guardianName = trim($data['guardian_name'] ?? $data['parent_name'] ?? '');
                    $guardian = null;
                    if (!empty($guardianName)) {
                        $guardian = Guardian::create([
                            'school_id'  => $schoolId,
                            'name'       => $guardianName,
                            'relation'   => trim($data['guardian_relation'] ?? $data['relation'] ?? 'Parent'),
                            'phone'      => trim($data['guardian_phone'] ?? $data['parent_phone'] ?? ''),
                            'email'      => trim($data['guardian_email'] ?? $data['parent_email'] ?? ''),
                            'occupation' => trim($data['guardian_occupation'] ?? ''),
                            'address'    => trim($data['guardian_address'] ?? $data['address'] ?? ''),
                        ]);
                    }

                    // Generate admission number
                    $lastStudent = Student::where('school_id', $schoolId)->latest('id')->first();
                    $nextNum = $lastStudent ? intval(substr($lastStudent->admission_no, -4)) + 1 : 1;
                    $admissionNo = 'ADM-' . str_pad($nextNum, 4, '0', STR_PAD_LEFT);

                    Student::create([
                        'school_id'       => $schoolId,
                        'first_name'      => $firstName,
                        'last_name'       => $lastName,
                        'gender'          => $gender,
                        'date_of_birth'   => !empty($data['date_of_birth'] ?? '') ? $data['date_of_birth'] : null,
                        'class_id'        => $targetClass->id,
                        'section_id'      => $sectionId,
                        'guardian_id'     => $guardian?->id,
                        'admission_no'    => $admissionNo,
                        'admission_date'  => !empty($data['admission_date'] ?? '') ? $data['admission_date'] : now()->toDateString(),
                        'phone'           => trim($data['phone'] ?? ''),
                        'email'           => trim($data['email'] ?? ''),
                        'address'         => trim($data['address'] ?? ''),
                        'roll_no'         => trim($data['roll_no'] ?? ''),
                        'category'        => 'general',
                        'status'          => 'active',
                        'blood_group'     => trim($data['blood_group'] ?? ''),
                        'religion'        => trim($data['religion'] ?? ''),
                        'nationality'     => trim($data['nationality'] ?? 'Sierra Leonean'),
                        'previous_school' => trim($data['previous_school'] ?? ''),
                        'department_id'   => $departmentId,
                    ]);

                    $imported++;
                }
            });

            NotificationDispatchService::notifyRole(
                $schoolId, 'school-admin',
                'Bulk Student Import',
                "{$imported} students imported, {$skipped} skipped.",
                '/school/students'
            );

            $message = "{$imported} students imported successfully.";
            if ($skipped > 0) $message .= " {$skipped} rows skipped.";
            if (!empty($errors)) {
                $summary = implode(' | ', array_map(
                    fn ($row, $err) => "Row {$row}: {$err}",
                    array_slice(array_keys($errors), 0, 5, true),
                    array_slice($errors, 0, 5, true),
                ));
                $message .= ' Errors: ' . $summary . (count($errors) > 5 ? ' (+' . (count($errors) - 5) . ' more)' : '');
            }

            return back()->with('success', $message);
        } catch (\Throwable $e) {
            return back()->withInput()->with('error', 'Failed to import students: ' . $e->getMessage());
        }
    }
}
