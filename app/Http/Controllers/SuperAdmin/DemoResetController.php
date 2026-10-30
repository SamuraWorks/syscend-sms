<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Log;

class DemoResetController extends Controller
{
    public function index()
    {
        if (app()->environment('production') && env('ALLOW_DEMO_RESET') !== 'true') {
            abort(404);
        }

        return inertia('SuperAdmin/DemoReset', []);
    }

    public function execute(Request $request)
    {
        // Server-side environment guard: the demo reset is a destructive,
        // browser-accessible operation. It must never run against production
        // unless ALLOW_DEMO_RESET=true has been set on the server explicitly.
        if (app()->environment('production') && env('ALLOW_DEMO_RESET') !== 'true') {
            abort(403, 'Demo reset is disabled in the production environment.');
        }

        $request->validate([
            'confirm' => 'required|accepted',
        ]);

        Log::warning('Demo reset triggered by user ' . auth()->id());

        $start = microtime(true);

        Artisan::call('db:seed', [
            '--class' => 'Database\\Seeders\\DemoResetSeeder',
            '--force' => true,
        ]);

        Artisan::call('db:seed', [
            '--class' => 'Database\\Seeders\\DemoSeeder',
            '--force' => true,
        ]);

        $elapsed = round(microtime(true) - $start, 1);

        return back()->with('success', "Demo environment reset successfully in {$elapsed}s.");
    }
}
