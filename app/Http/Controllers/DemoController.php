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

    public function portal(string $role): Response|RedirectResponse
    {
        abort_unless(in_array($role, self::ROLES, true), 404);
        return Inertia::render('Demo/Portal', ['role' => $role]);
    }

    public function exit(Request $request): RedirectResponse
    {
        $request->session()->forget('demo_role');
        return redirect()->route('login');
    }
}
