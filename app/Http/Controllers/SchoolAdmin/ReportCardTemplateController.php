<?php

namespace App\Http\Controllers\SchoolAdmin;

use App\Http\Controllers\Controller;
use App\Models\ReportCardTemplate;
use App\Services\ReportCardTemplateAnalyzer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class ReportCardTemplateController extends Controller
{
    public function index()
    {
        $sid = $this->getSchoolId();

        $templates = ReportCardTemplate::where('school_id', $sid)
            ->with('creator:id,name', 'approver:id,name')
            ->latest()
            ->paginate(12)
            ->withQueryString();

        return Inertia::render('SchoolAdmin/ReportCardTemplates/Index', [
            'templates' => $templates,
        ]);
    }

    public function create()
    {
        $sid = $this->getSchoolId();

        $templates = ReportCardTemplate::where('school_id', $sid)
            ->latest()
            ->get(['id', 'name', 'status', 'version']);

        return Inertia::render('SchoolAdmin/ReportCardTemplates/Create', [
            'existingTemplates' => $templates,
        ]);
    }

    public function store(Request $request)
    {
        $sid = $this->getSchoolId();

        $data = $request->validate([
            'name'        => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'front_image' => 'required|file|mimes:jpg,jpeg,png,pdf|max:10240',
            'back_image'  => 'nullable|file|mimes:jpg,jpeg,png,pdf|max:10240',
        ]);

        $template = ReportCardTemplate::create([
            'school_id'  => $sid,
            'name'       => $data['name'],
            'description'=> $data['description'] ?? null,
            'status'     => 'draft',
            'created_by' => auth()->id(),
        ]);

        if ($request->hasFile('front_image')) {
            $path = $request->file('front_image')->store("school-{$sid}/templates/{$template->id}", 'public');
            $template->update(['front_image_path' => $path]);
        }

        if ($request->hasFile('back_image')) {
            $path = $request->file('back_image')->store("school-{$sid}/templates/{$template->id}", 'public');
            $template->update(['back_image_path' => $path]);
        }

        try {
            $analyzer = new ReportCardTemplateAnalyzer();
            $result = $analyzer->analyze($template);
            $template->update([
                'ai_extracted_data'   => $result['extracted_data'],
                'ai_confidence_score' => $result['confidence_score'],
                'template_config'     => $result['template_config'],
            ]);
        } catch (\Throwable $e) {
            // AI analysis failed — template saved as draft, admin can review manually
        }

        return redirect()->route('report-card-templates.show', $template)
            ->with('success', 'Template uploaded successfully. AI analysis ' . ($template->ai_confidence_score ? 'completed' : 'pending review') . '.');
    }

    public function show(ReportCardTemplate $reportCardTemplate)
    {
        $reportCardTemplate->load('creator:id,name', 'approver:id,name', 'previousVersion:id,name,version');

        $versions = ReportCardTemplate::where('school_id', $reportCardTemplate->school_id)
            ->where('name', $reportCardTemplate->name)
            ->orderByDesc('version')
            ->get(['id', 'name', 'version', 'status', 'created_at']);

        return Inertia::render('SchoolAdmin/ReportCardTemplates/Show', [
            'template' => $reportCardTemplate,
            'versions' => $versions,
        ]);
    }

    public function update(Request $request, ReportCardTemplate $reportCardTemplate)
    {
        $data = $request->validate([
            'name'        => 'sometimes|string|max:255',
            'description' => 'nullable|string|max:1000',
            'front_image' => 'nullable|file|mimes:jpg,jpeg,png,pdf|max:10240',
            'back_image'  => 'nullable|file|mimes:jpg,jpeg,png,pdf|max:10240',
            'template_config' => 'nullable|array',
        ]);

        $sid = $reportCardTemplate->school_id;

        if ($request->hasFile('front_image')) {
            if ($reportCardTemplate->front_image_path) {
                Storage::disk('public')->delete($reportCardTemplate->front_image_path);
            }
            $data['front_image_path'] = $request->file('front_image')->store("school-{$sid}/templates/{$reportCardTemplate->id}", 'public');
        }

        if ($request->hasFile('back_image')) {
            if ($reportCardTemplate->back_image_path) {
                Storage::disk('public')->delete($reportCardTemplate->back_image_path);
            }
            $data['back_image_path'] = $request->file('back_image')->store("school-{$sid}/templates/{$reportCardTemplate->id}", 'public');
        }

        unset($data['front_image'], $data['back_image']);
        $reportCardTemplate->update($data);

        return back()->with('success', 'Template updated.');
    }

    public function approve(ReportCardTemplate $reportCardTemplate)
    {
        $sid = $reportCardTemplate->school_id;

        ReportCardTemplate::where('school_id', $sid)
            ->where('status', 'active')
            ->update(['status' => 'archived', 'is_default' => false]);

        $reportCardTemplate->update([
            'status'      => 'active',
            'is_default'  => true,
            'approved_by' => auth()->id(),
            'approved_at' => now(),
        ]);

        return back()->with('success', 'Template approved and set as active.');
    }

    public function archive(ReportCardTemplate $reportCardTemplate)
    {
        $reportCardTemplate->update(['status' => 'archived', 'is_default' => false]);

        return back()->with('success', 'Template archived.');
    }

    public function duplicate(ReportCardTemplate $reportCardTemplate)
    {
        $sid = $reportCardTemplate->school_id;

        $newTemplate = $reportCardTemplate->replicate([
            'status'            => 'draft',
            'is_default'        => false,
            'approved_by'       => null,
            'approved_at'       => null,
            'version'           => $reportCardTemplate->version + 1,
            'previous_version_id' => $reportCardTemplate->id,
            'created_by'        => auth()->id(),
        ]);
        $newTemplate->name = $reportCardTemplate->name . ' (Copy)';
        $newTemplate->save();

        return redirect()->route('report-card-templates.show', $newTemplate)
            ->with('success', 'Template duplicated.');
    }

    public function restore(ReportCardTemplate $reportCardTemplate)
    {
        $reportCardTemplate->update(['status' => 'draft']);

        return back()->with('success', 'Template restored to draft.');
    }

    public function analyze(ReportCardTemplate $reportCardTemplate)
    {
        $sid = $this->getSchoolId();

        if ($reportCardTemplate->school_id !== $sid) {
            abort(403);
        }

        if (!$reportCardTemplate->front_image_path) {
            return response()->json(['error' => 'No image to analyze.'], 422);
        }

        try {
            $analyzer = app(ReportCardTemplateAnalyzer::class);
            $analysis = $analyzer->analyze($reportCardTemplate);

            $reportCardTemplate->update([
                'ai_analysis'    => $analysis,
                'ai_analyzed_at' => now(),
            ]);

            return response()->json(['analysis' => $analysis]);
        } catch (\Throwable $e) {
            return response()->json(['error' => 'AI analysis failed: ' . $e->getMessage()], 500);
        }
    }

    public function destroy(ReportCardTemplate $reportCardTemplate)
    {
        $sid = $this->getSchoolId();

        if ($reportCardTemplate->school_id !== $sid) {
            abort(403);
        }

        $reportCardTemplate->delete();

        return back()->with('success', 'Template deleted.');
    }

    public function versions(ReportCardTemplate $reportCardTemplate)
    {
        $versions = ReportCardTemplate::where('school_id', $reportCardTemplate->school_id)
            ->where('name', $reportCardTemplate->name)
            ->orderByDesc('version')
            ->get(['id', 'name', 'version', 'status', 'created_at', 'approved_at']);

        return response()->json(['versions' => $versions]);
    }
}
