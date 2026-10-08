<?php

namespace App\Http\Controllers;

use App\Models\PlatformSetting;
use App\Models\School;
use App\Services\SchoolPublicProfileService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Serves the per-school public website (/{schoolSlug}) and the Web App
 * Manifest used for installable, school-branded PWA identities.
 */
class SchoolPublicController extends Controller
{
    public function show(Request $request, string $schoolSlug): Response
    {
        $school = School::where('slug', $schoolSlug)
            ->where('status', 'active')
            ->first();

        // Respect the existing public_profile_enabled opt-in: an approved school
        // decides whether it appears on the central site / its public homepage.
        if (! $school || ! $school->public_profile_enabled) {
            abort(404);
        }

        return Inertia::render('Public/SchoolHomepage', [
            'school' => SchoolPublicProfileService::for($school),
        ]);
    }

    public function manifest(Request $request, string $schoolSlug): JsonResponse
    {
        $school = School::where('slug', $schoolSlug)
            ->where('status', 'active')
            ->first();

        if (! $school) {
            abort(404);
        }

        return $this->manifestResponse([
            'name'        => $school->name,
            'short_name'  => $school->short_name ?? $school->name,
            'start_url'   => '/' . $school->slug,
            'theme_color' => $school->primary_color ?? '#1e40af',
            'icon'        => $school->logo_url,
            'fallback'    => false,
        ]);
    }

    public function platformManifest(Request $request): JsonResponse
    {
        $platformName = PlatformSetting::get('platform_name') ?? config('app.name', 'Syscend Campus');
        $platformFavicon = PlatformSetting::get('platform_favicon');

        return $this->manifestResponse([
            'name'        => $platformName,
            'short_name'  => $platformName,
            'start_url'   => '/login',
            'theme_color' => '#1e40af',
            'icon'        => $platformFavicon
                ? \Illuminate\Support\Facades\Storage::disk('public')->url($platformFavicon)
                : asset('images/logo.png'),
            'fallback'    => false,
        ]);
    }

    private function manifestResponse(array $data): JsonResponse
    {
        $icon = $data['icon'] ?? null;

        // Chrome/Edge/Android installability needs real 192x192 and 512x512
        // PNG icons. Ship the static brand icons always, then add the school's
        // logo as an extra 512 entry when one exists.
        $icons = [
            ['src' => asset('icons/icon-192.png'), 'sizes' => '192x192', 'type' => 'image/png',  'purpose' => 'any'],
            ['src' => asset('icons/icon-512.png'), 'sizes' => '512x512', 'type' => 'image/png',  'purpose' => 'any'],
            ['src' => asset('icons/icon-512.png'), 'sizes' => '512x512', 'type' => 'image/png',  'purpose' => 'maskable'],
        ];

        if ($icon) {
            $icons[] = ['src' => $icon, 'sizes' => '1024x1024', 'type' => 'image/png', 'purpose' => 'any'];
        }

        return response()->json([
            'name'             => $data['name'],
            'short_name'       => $data['short_name'],
            'id'               => $data['start_url'],
            'start_url'        => $data['start_url'],
            'scope'            => '/',
            'display'          => 'standalone',
            'display_override' => ['standalone', 'minimal-ui'],
            'background_color' => '#ffffff',
            'theme_color'      => $data['theme_color'] ?? '#1e40af',
            'description'      => $data['name'] . ' — Syscend Campus',
            'icons'            => $icons,
        ], 200, [], JSON_UNESCAPED_SLASHES)->header('Content-Type', 'application/manifest+json');
    }
}