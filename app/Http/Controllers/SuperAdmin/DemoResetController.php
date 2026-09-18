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
        return inertia('SuperAdmin/DemoReset', []);
    }

    public function execute(Request $request)
    {
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
