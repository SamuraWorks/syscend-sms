<?php

namespace App\Http\Controllers\SchoolAdmin;

use App\Http\Controllers\Controller;
use App\Models\{AssessmentComponent, SchoolAssessmentConfig, AcademicYear};
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class AssessmentConfigController extends Controller
{
    /**
     * Assessment configuration dashboard — shows configs for current year.
     */
    public function index(Request $request): Response
    {
        $yearId = $request->academic_year_id;

        if (!$yearId) {
            $currentYear = AcademicYear::where('school_id', $this->getSchoolId())->where('is_current', true)->first();
            $yearId = $currentYear?->id;
        }

        $configs = SchoolAssessmentConfig::with([])
            ->where('school_id', $this->getSchoolId())
            ->when($yearId, fn ($q) => $q->where('academic_year_id', $yearId))
            ->latest()
            ->get();

        $components = AssessmentComponent::where('school_id', $this->getSchoolId())
            ->when($yearId, fn ($q) => $q->where('academic_year_id', $yearId))
            ->orderBy('sort_order')
            ->get();

        return Inertia::render('SchoolAdmin/AssessmentConfig/Index', [
            'configs'    => $configs,
            'components' => $components,
            'years'      => AcademicYear::where('school_id', $this->getSchoolId())->orderByDesc('is_current')->orderByDesc('name')->get(),
            'filters'    => ['academic_year_id' => $yearId],
        ]);
    }

    /**
     * Create a new assessment config.
     */
    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'name'        => 'required|string|max:100',
            'description' => 'nullable|string|max:500',
            'academic_year_id' => 'required|exists:academic_years,id',
        ]);

        try {
            $config = SchoolAssessmentConfig::create(array_merge($data, [
                'school_id' => $this->getSchoolId(),
                'is_default' => !SchoolAssessmentConfig::where('school_id', $this->getSchoolId())
                    ->where('academic_year_id', $data['academic_year_id'])->exists(),
            ]));

            return back()->with('success', 'Assessment configuration created.');
        } catch (\Throwable $e) {
            return back()->withInput()->with('error', 'Failed to create config: ' . $e->getMessage());
        }
    }

    /**
     * Update assessment config.
     */
    public function update(Request $request, SchoolAssessmentConfig $config): RedirectResponse
    {
        $data = $request->validate([
            'name'        => 'required|string|max:100',
            'description' => 'nullable|string|max:500',
            'is_default'  => 'boolean',
            'require_approval_before_publishing' => 'boolean',
        ]);

        try {
            if ($data['is_default'] ?? false) {
                SchoolAssessmentConfig::where('school_id', $this->getSchoolId())
                    ->where('academic_year_id', $config->academic_year_id)
                    ->update(['is_default' => false]);
            }

            $config->update($data);

            return back()->with('success', 'Assessment configuration updated.');
        } catch (\Throwable $e) {
            return back()->withInput()->with('error', 'Failed to update config: ' . $e->getMessage());
        }
    }

    /**
     * Delete assessment config.
     */
    public function destroy(SchoolAssessmentConfig $config): RedirectResponse
    {
        try {
            $config->delete();
            return back()->with('success', 'Assessment configuration deleted.');
        } catch (\Throwable $e) {
            return back()->with('error', 'Failed to delete config: ' . $e->getMessage());
        }
    }

    /**
     * Store a new assessment component.
     */
    public function storeComponent(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'name'        => 'required|string|max:100',
            'slug'        => 'required|string|max:100',
            'category'    => 'required|string|in:coursework,examination',
            'description' => 'nullable|string|max:500',
            'academic_year_id' => 'required|exists:academic_years,id',
            'max_marks'   => 'required|numeric|min:1',
            'weight_percentage' => 'required|numeric|min:0|max:100',
            'sort_order'  => 'nullable|integer',
            'is_active'   => 'boolean',
            'include_in_final_result' => 'boolean',
            'include_in_promotion' => 'boolean',
            'require_approval' => 'boolean',
        ]);

        try {
            $component = AssessmentComponent::create(array_merge($data, [
                'school_id' => $this->getSchoolId(),
                'slug'      => \Str::slug($data['slug']),
            ]));

            return back()->with('success', 'Assessment component added.');
        } catch (\Throwable $e) {
            return back()->withInput()->with('error', 'Failed to add component: ' . $e->getMessage());
        }
    }

    /**
     * Update an assessment component.
     */
    public function updateComponent(Request $request, AssessmentComponent $component): RedirectResponse
    {
        $data = $request->validate([
            'name'        => 'required|string|max:100',
            'category'    => 'required|string|in:coursework,examination',
            'description' => 'nullable|string|max:500',
            'max_marks'   => 'required|numeric|min:1',
            'weight_percentage' => 'required|numeric|min:0|max:100',
            'sort_order'  => 'nullable|integer',
            'is_active'   => 'boolean',
            'include_in_final_result' => 'boolean',
            'include_in_promotion' => 'boolean',
            'require_approval' => 'boolean',
        ]);

        try {
            $component->update($data);
            return back()->with('success', 'Assessment component updated.');
        } catch (\Throwable $e) {
            return back()->withInput()->with('error', 'Failed to update component: ' . $e->getMessage());
        }
    }

    /**
     * Delete an assessment component.
     */
    public function destroyComponent(AssessmentComponent $component): RedirectResponse
    {
        try {
            $component->delete();
            return back()->with('success', 'Assessment component deleted.');
        } catch (\Throwable $e) {
            return back()->with('error', 'Failed to delete component: ' . $e->getMessage());
        }
    }

    /**
     * Set default config.
     */
    public function setDefault(SchoolAssessmentConfig $config): RedirectResponse
    {
        try {
            SchoolAssessmentConfig::where('school_id', $this->getSchoolId())
                ->where('academic_year_id', $config->academic_year_id)
                ->update(['is_default' => false]);

            $config->update(['is_default' => true]);

            return back()->with('success', 'Default assessment configuration set.');
        } catch (\Throwable $e) {
            return back()->with('error', 'Failed to set default: ' . $e->getMessage());
        }
    }
}
