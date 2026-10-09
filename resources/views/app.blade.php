<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" suppressHydrationWarning>
    <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title inertia>{{ config('app.name', 'Syscend Campus') }}</title>
        @php
            use App\Models\PlatformSetting;
            use App\Models\School;

            $authUser = auth()->user();

            $platformFavicon = PlatformSetting::get('platform_favicon');
            $faviconHref = $platformFavicon ? \Illuminate\Support\Facades\Storage::disk('public')->url($platformFavicon) : asset('favicon.ico');

            // Match the manifest to the signed-in identity so an install picks
            // up the right name/icon (school branding vs Syscend admin).
            $manifestHref = '/manifest.webmanifest';
            $appleIconHref = null;
            if ($authUser && $authUser->school_id) {
                $school = School::withoutGlobalScopes()->find($authUser->school_id);
                if ($school) {
                    $manifestHref = '/' . $school->slug . '/manifest.webmanifest';
                    $appleIconHref = $school->badge_url ?: $school->logo_url;
                }
            }
            if (! $appleIconHref) {
                $platformLogo = PlatformSetting::get('platform_logo');
                $appleIconHref = $platformLogo
                    ? \Illuminate\Support\Facades\Storage::disk('public')->url($platformLogo)
                    : asset('images/logo.png');
            }
        @endphp
        <link id="app-favicon" rel="icon" type="image/x-icon" href="{{ $faviconHref }}" />
        <link id="app-manifest" rel="manifest" href="{{ $manifestHref }}" />
        <link id="app-apple-touch-icon" rel="apple-touch-icon" href="{{ $appleIconHref }}" />
        <meta id="theme-color-meta" name="theme-color" content="#1e40af" />
        @viteReactRefresh
        @vite(['resources/css/app.css', 'resources/js/app.tsx'])
        @inertiaHead
    </head>
    <body class="font-sans antialiased">
        @inertia
    </body>
</html>
