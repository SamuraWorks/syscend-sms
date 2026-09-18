<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Services\SchoolAdminOnboardingService;
use Illuminate\Http\{RedirectResponse, Request};
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Inertia\Response;

class SchoolWithAdminController extends Controller
{
    public function create(): Response
    {
        return Inertia::render('SuperAdmin/Schools/CreateWithAdmin');
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            // School fields
            'name'         => ['required', 'string', 'max:255'],
            'code'         => ['nullable', 'string', 'max:50', 'unique:schools,code'],
            'email'        => ['nullable', 'email', 'max:255'],
            'phone'        => ['nullable', 'string', 'max:20'],
            'address'      => ['nullable', 'string', 'max:500'],
            'city'         => ['nullable', 'string', 'max:100'],
            'state'        => ['nullable', 'string', 'max:100'],
            'country'      => ['nullable', 'string', 'max:100'],
            'website'      => ['nullable', 'url', 'max:255'],

            // Admin fields
            'admin_name'   => ['required', 'string', 'max:255'],
            'admin_email'  => ['required', 'email', 'unique:users,email'],
            'admin_phone'  => ['nullable', 'string', 'max:20'],
        ]);

        $service = new SchoolAdminOnboardingService();

        $result = $service->createSchoolWithAdmin(
            collect($data)->only(['name', 'code', 'email', 'phone', 'address', 'city', 'state', 'country', 'website'])->toArray(),
            collect($data)->only(['admin_name', 'admin_email', 'admin_phone'])->mapWithKeys(fn ($v, $k) => [str_replace('admin_', '', $k) => $v])->toArray(),
            $request->user()->id
        );

        activity()
            ->causedBy($request->user())
            ->performedOn($result['school'])
            ->withProperties([
                'admin_id'       => $result['admin']->id,
                'admin_email'    => $result['admin']->email,
                'temp_generated' => true,
            ])
            ->log('School and School Admin created');

        return redirect()
            ->route('super-admin.schools.index')
            ->with('success', "School \"{$result['school']->name}\" created. School Admin account provisioned with temporary credentials.");
    }
}
