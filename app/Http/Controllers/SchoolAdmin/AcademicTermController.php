<?php

namespace App\Http\Controllers\SchoolAdmin;

use App\Http\Controllers\Controller;
use App\Models\AcademicTerm;
use App\Models\AcademicYear;
use App\Services\NotificationDispatchService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AcademicTermController extends Controller
{
    public function index(Request $request): Response
    {
        $terms = AcademicTerm::with('academicYear:id,name')
            ->when($request->academic_year_id, fn ($q) => $q->where('academic_year_id', $request->academic_year_id))
            ->latest('start_date')
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('SchoolAdmin/AcademicTerms/Index', [
            'terms' => [
                'data' => $terms->items(),
                'meta' => [
                    'total'        => $terms->total(),
                    'per_page'     => $terms->perPage(),
                    'current_page' => $terms->currentPage(),
                    'last_page'    => $terms->lastPage(),
                ],
            ],
            'academicYears' => AcademicYear::where('school_id', $this->getSchoolId())->orderByDesc('is_current')->get(['id', 'name', 'is_current']),
            'filters'       => $request->only('academic_year_id'),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'academic_year_id' => 'required|exists:academic_years,id',
            'name'             => 'required|string|max:50',
            'start_date'       => 'required|date',
            'end_date'         => 'required|date|after:start_date',
            'mid_term_start'   => 'nullable|date',
            'mid_term_end'     => 'nullable|date|after_or_equal:mid_term_start',
            'is_current'       => 'boolean',
        ]);

        try {
            $schoolId = $this->getSchoolId();
            $term = AcademicTerm::create(array_merge($data, ['school_id' => $schoolId]));

            if ($request->boolean('is_current')) {
                $term->makeCurrent();
            }

            NotificationDispatchService::notifyRole(
                $schoolId, 'principal',
                'New Academic Term',
                "A new term '{$data['name']}' has been created starting " . \Carbon\Carbon::parse($data['start_date'])->format('d M Y') . '.',
                '/school/academic-terms'
            );

            NotificationDispatchService::notifyRole(
                $schoolId, 'teacher',
                'New Academic Term',
                "A new term '{$data['name']}' has been created starting " . \Carbon\Carbon::parse($data['start_date'])->format('d M Y') . '.',
                '/school/academic-terms'
            );

            return back()->with('success', 'Academic term created.');
        } catch (\Throwable $e) {
            return back()->withInput()->with('error', 'Failed to create term: ' . $e->getMessage());
        }
    }

    public function update(Request $request, AcademicTerm $academicTerm): RedirectResponse
    {
        $data = $request->validate([
            'name'           => 'required|string|max:50',
            'start_date'     => 'required|date',
            'end_date'       => 'required|date|after:start_date',
            'mid_term_start' => 'nullable|date',
            'mid_term_end'   => 'nullable|date|after_or_equal:mid_term_start',
            'is_current'     => 'boolean',
        ]);

        try {
            $academicTerm->update($data);

            if ($request->boolean('is_current')) {
                $academicTerm->makeCurrent();
            }

            return back()->with('success', 'Academic term updated.');
        } catch (\Throwable $e) {
            return back()->withInput()->with('error', 'Failed to update term: ' . $e->getMessage());
        }
    }

    public function destroy(AcademicTerm $academicTerm): RedirectResponse
    {
        try {
            $academicTerm->delete();
            return back()->with('success', 'Academic term deleted.');
        } catch (\Throwable $e) {
            return back()->with('error', 'Failed to delete term: ' . $e->getMessage());
        }
    }
}
