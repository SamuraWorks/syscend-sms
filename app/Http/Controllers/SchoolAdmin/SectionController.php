<?php

namespace App\Http\Controllers\SchoolAdmin;

use App\Http\Controllers\Controller;
use App\Models\SchoolClass;
use App\Models\Section;
use App\Models\Staff;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SectionController extends Controller
{
    public function index(Request $request): Response
    {
        $query = SchoolClass::where('school_id', auth()->user()->school_id)->with(['sections' => function ($q) {
            $q->withCount('students')->with('formMaster')->orderBy('name');
        }]);

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'ilike', "%{$search}%")
                  ->orWhere('short_name', 'ilike', "%{$search}%");
            });
        }

        if ($level = $request->input('level')) {
            $query->where('school_level', $level);
        }

        $classes = $query->orderBy('school_level')
            ->orderBy('level_order')
            ->orderBy('numeric_name')
            ->orderBy('name')
            ->get();

        $staff = Staff::where('school_id', auth()->user()->school_id)
            ->where('status', 'active')
            ->select('id', 'first_name', 'last_name')
            ->get()
            ->map(fn ($s) => ['id' => $s->id, 'name' => $s->full_name]);

        return Inertia::render('SchoolAdmin/Sections/Index', [
            'classes' => $classes,
            'staff'   => $staff,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $schoolId = auth()->user()->school_id;

        $data = $request->validate([
            'class_id'       => ['required', 'exists:classes,id'],
            'name'           => ['required', 'string', 'max:100', 'not_regex:/[<>]/'],

            'section_code'   => 'nullable|string|max:20',
            'capacity'       => 'nullable|integer|min:0',
            'form_master_id' => 'nullable|exists:staff,id',
            'classroom'      => 'nullable|string|max:50',
            'is_active'      => 'boolean',
        ]);

        if (!empty($data['form_master_id'])) {
            $teacher = Staff::where('school_id', $schoolId)->find($data['form_master_id']);
            if (!$teacher) {
                return back()->withErrors(['form_master_id' => 'The selected teacher is not available in your school.'])->withInput();
            }
            if ($teacher->status !== 'active') {
                return back()->withErrors(['form_master_id' => 'Cannot assign an inactive teacher as form master.'])->withInput();
            }
        }

        $class = SchoolClass::where('school_id', $schoolId)->find($data['class_id']);
        if (!$class) {
            return back()->withErrors(['class_id' => 'The selected class is not available in your school.'])->withInput();
        }

        if ($class->sections()->count() >= 4) {
            return back()->withErrors(['name' => 'A class can have no more than four streams.'])->withInput();
        }

        $exists = Section::where('school_id', $schoolId)
            ->where('class_id', $data['class_id'])
            ->whereRaw('LOWER(name) = ?', [mb_strtolower($data['name'])])
            ->exists();
        if ($exists) {
            return back()->withErrors(['name' => 'A section with this name already exists in this class.'])->withInput();
        }

        Section::create(array_merge($data, ['school_id' => $schoolId]));

        return back()->with('success', 'Section created.');
    }

    public function update(Request $request, Section $section): RedirectResponse
    {
        $schoolId = auth()->user()->school_id;

        $data = $request->validate([
            'class_id'       => ['required', 'exists:classes,id'],
            'name'           => ['required', 'string', 'max:100', 'not_regex:/[<>]/'],

            'section_code'   => 'nullable|string|max:20',
            'capacity'       => 'nullable|integer|min:0',
            'form_master_id' => 'nullable|exists:staff,id',
            'classroom'      => 'nullable|string|max:50',
            'is_active'      => 'boolean',
        ]);

        if (!empty($data['form_master_id'])) {
            $teacher = Staff::where('school_id', $schoolId)->find($data['form_master_id']);
            if (!$teacher) {
                return back()->withErrors(['form_master_id' => 'The selected teacher is not available in your school.'])->withInput();
            }
            if ($teacher->status !== 'active') {
                return back()->withErrors(['form_master_id' => 'Cannot assign an inactive teacher as form master.'])->withInput();
            }
        }

        if ($section->school_id !== $schoolId) {
            abort(404);
        }

        $class = SchoolClass::where('school_id', $schoolId)->find($data['class_id']);
        if (!$class) {
            return back()->withErrors(['class_id' => 'The selected class is not available in your school.'])->withInput();
        }

        $exists = Section::where('school_id', $schoolId)
            ->where('class_id', $data['class_id'])
            ->whereRaw('LOWER(name) = ?', [mb_strtolower($data['name'])])
            ->where('id', '!=', $section->id)
            ->exists();
        if ($exists) {
            return back()->withErrors(['name' => 'A section with this name already exists in this class.'])->withInput();
        }

        $section->update($data);

        return back()->with('success', 'Section updated.');
    }

    public function destroy(Section $section): RedirectResponse
    {
        if ($section->school_id !== auth()->user()->school_id) {
            abort(404);
        }

        $section->delete();

        return back()->with('success', 'Section deleted.');
    }
}
