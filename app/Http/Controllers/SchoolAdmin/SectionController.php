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
        $query = SchoolClass::with(['sections' => function ($q) {
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

        $staff = Staff::where('status', 'active')
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
            'class_id'       => 'required|exists:classes,id',
            'name'           => 'required|string|max:100',
            'section_code'   => 'nullable|string|max:20',
            'capacity'       => 'nullable|integer|min:0',
            'form_master_id' => 'nullable|exists:staff,id',
            'classroom'      => 'nullable|string|max:50',
            'is_active'      => 'boolean',
        ]);

        if (!empty($data['form_master_id'])) {
            $teacher = Staff::find($data['form_master_id']);
            if ($teacher && $teacher->status !== 'active') {
                return back()->withErrors(['form_master_id' => 'Cannot assign an inactive teacher as form master.'])->withInput();
            }
        }

        $exists = Section::where('school_id', $schoolId)
            ->where('class_id', $data['class_id'])
            ->where('name', $data['name'])
            ->exists();
        if ($exists) {
            return back()->withErrors(['name' => 'A section with this name already exists in this class.'])->withInput();
        }

        Section::create($data);

        return back()->with('success', 'Section created.');
    }

    public function update(Request $request, Section $section): RedirectResponse
    {
        $schoolId = auth()->user()->school_id;

        $data = $request->validate([
            'class_id'       => 'required|exists:classes,id',
            'name'           => 'required|string|max:100',
            'section_code'   => 'nullable|string|max:20',
            'capacity'       => 'nullable|integer|min:0',
            'form_master_id' => 'nullable|exists:staff,id',
            'classroom'      => 'nullable|string|max:50',
            'is_active'      => 'boolean',
        ]);

        if (!empty($data['form_master_id'])) {
            $teacher = Staff::find($data['form_master_id']);
            if ($teacher && $teacher->status !== 'active') {
                return back()->withErrors(['form_master_id' => 'Cannot assign an inactive teacher as form master.'])->withInput();
            }
        }

        $exists = Section::where('school_id', $schoolId)
            ->where('class_id', $data['class_id'])
            ->where('name', $data['name'])
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
        $section->delete();

        return back()->with('success', 'Section deleted.');
    }
}
