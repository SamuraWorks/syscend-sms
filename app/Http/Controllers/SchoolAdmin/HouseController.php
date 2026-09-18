<?php

namespace App\Http\Controllers\SchoolAdmin;

use App\Http\Controllers\Controller;
use App\Models\House;
use App\Models\Staff;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class HouseController extends Controller
{
    public function index(): Response
    {
        $schoolId = $this->getSchoolId();

        $houses = House::where('school_id', $schoolId)
            ->withCount('students')
            ->with('houseMaster:id,first_name,last_name')
            ->orderBy('name')
            ->get()
            ->map(fn ($h) => [
                'id'              => $h->id,
                'name'            => $h->name,
                'color'           => $h->color,
                'is_active'       => $h->is_active,
                'students_count'  => $h->students_count,
                'house_master'    => $h->houseMaster ? [
                    'id'   => $h->houseMaster->id,
                    'name' => trim("{$h->houseMaster->first_name} {$h->houseMaster->last_name}"),
                ] : null,
            ]);

        $staff = Staff::where('school_id', $schoolId)
            ->where('status', 'active')
            ->select('id', 'first_name', 'last_name')
            ->get()
            ->map(fn ($s) => ['id' => $s->id, 'name' => trim("{$s->first_name} {$s->last_name}")]);

        return Inertia::render('SchoolAdmin/Houses/Index', [
            'houses' => $houses,
            'staff'  => $staff,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name'            => 'required|string|max:100',
            'color'           => 'nullable|string|max:20',
            'house_master_id' => 'nullable|exists:staff,id',
        ]);

        House::create([
            ...$validated,
            'school_id' => $this->getSchoolId(),
        ]);

        return back()->with('success', 'House created successfully.');
    }

    public function update(Request $request, House $house): RedirectResponse
    {
        abort_unless($house->school_id === (int) $this->getSchoolId(), 404);

        $validated = $request->validate([
            'name'            => 'required|string|max:100',
            'color'           => 'nullable|string|max:20',
            'house_master_id' => 'nullable|exists:staff,id',
        ]);

        $house->update($validated);

        return back()->with('success', 'House updated successfully.');
    }

    public function destroy(House $house): RedirectResponse
    {
        abort_unless($house->school_id === (int) $this->getSchoolId(), 404);

        if ($house->students()->exists()) {
            return back()->with('error', 'This house has students assigned. Reassign them before deleting.');
        }

        $house->delete();

        return back()->with('success', 'House deleted successfully.');
    }
}
