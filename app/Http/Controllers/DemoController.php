<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DemoController extends Controller
{
    private const ROLES = ['super-admin','ministry-admin','district-officer','school-admin','principal','proprietor','teacher','student','parent','accountant','librarian','receptionist','driver','warden','store-manager'];

    public function index(): Response
    {
        return Inertia::render('Demo/Selection');
    }

    public function portal(Request $request, string $role): Response|RedirectResponse
    {
        abort_unless(in_array($role, self::ROLES, true), 404);

        // Use the real authenticated demo environment whenever that role has a seeded
        // identity. This keeps the demo on the same layout, controllers, policies,
        // data and interactive flows as production instead of a parallel mock portal.
        $productionRoles = self::ROLES;

        if (in_array($role, $productionRoles, true)) {
            return app(DemoEnvironmentController::class)->enter($request, $role);
        }

        return Inertia::render('Demo/Portal', ['role' => $role]);
    }

    public function exit(Request $request): RedirectResponse
    {
        $request->session()->forget('demo_role');
        return redirect()->route('login');
    }
}
