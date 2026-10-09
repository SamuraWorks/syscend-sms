<?php

namespace App\Http\Controllers;

use App\Models\PlatformSetting;
use App\Models\School;
use App\Services\RoleRegistry;
use App\Services\SchoolPublicProfileService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
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

        $logo  = $school->logo_url;
        $badge = $school->badge_url;

        return $this->manifestResponse([
            'name'        => $school->name,
            'short_name'  => $school->short_name ?: $school->name,
            'start_url'   => '/dashboard',
            'id'          => '/' . $school->slug . '/app',
            'theme_color' => $school->primary_color ?? '#1e40af',
            'icon'        => $logo ?: $badge,
            'alt_icon'    => ($logo && $badge) ? $badge : null,
        ]);
    }

    public function platformManifest(Request $request): JsonResponse
    {
        $user = $request->user();
        $isSuperAdmin = $user && method_exists($user, 'hasRole') && $user->hasRole(RoleRegistry::SUPER_ADMIN);

        $platformLogo = PlatformSetting::get('platform_logo');
        $platformFavicon = PlatformSetting::get('platform_favicon');
        $logoUrl = $platformLogo ? Storage::disk('public')->url($platformLogo) : null;
        $faviconUrl = $platformFavicon ? Storage::disk('public')->url($platformFavicon) : null;

        $platformName = PlatformSetting::get('platform_name') ?? config('app.name', 'Syscend Campus');
        $name = $isSuperAdmin ? 'Syscend Admin' : $platformName;

        return $this->manifestResponse([
            'name'        => $name,
            'short_name'  => $name,
            'start_url'   => $isSuperAdmin ? '/super-admin/dashboard' : '/login',
            'theme_color' => '#1e40af',
            'icon'        => $logoUrl ?: $faviconUrl ?: asset('images/logo.png'),
            'alt_icon'    => null,
        ]);
    }

    private function manifestResponse(array $data): JsonResponse
    {
        $icons = [];

        // The user's own identity icon goes first so it becomes the installed
        // app icon (school logo/badge, or the Syscend admin logo).
        if (! empty($data['icon'])) {
            $icons[] = [
                'src'     => $data['icon'],
                'sizes'   => '192x192 512x512',
                'type'    => $this->imageMime($data['icon']),
                'purpose' => 'any',
            ];
        }
        if (! empty($data['alt_icon'])) {
            $icons[] = [
                'src'     => $data['alt_icon'],
                'sizes'   => '192x192 512x512',
                'type'    => $this->imageMime($data['alt_icon']),
                'purpose' => 'any',
            ];
        }

        // Guaranteed real 192/512 PNGs keep the app installable in every
        // browser even when a custom logo is missing or unsupported.
        $icons[] = ['src' => asset('icons/icon-192.png'), 'sizes' => '192x192', 'type' => 'image/png', 'purpose' => 'any'];
        $icons[] = ['src' => asset('icons/icon-512.png'), 'sizes' => '512x512', 'type' => 'image/png', 'purpose' => 'any'];
        $icons[] = ['src' => asset('icons/icon-512.png'), 'sizes' => '512x512', 'type' => 'image/png', 'purpose' => 'maskable'];

        return response()->json([
            'name'             => $data['name'],
            'short_name'       => $data['short_name'],
            'id'               => $data['id'] ?? $data['start_url'],
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

    private function imageMime(string $url): string
    {
        $ext = strtolower(pathinfo(parse_url($url, PHP_URL_PATH) ?? '', PATHINFO_EXTENSION));

        return match ($ext) {
            'jpg', 'jpeg' => 'image/jpeg',
            'webp'        => 'image/webp',
            'svg'         => 'image/svg+xml',
            'gif'         => 'image/gif',
            default       => 'image/png',
        };
    }
}