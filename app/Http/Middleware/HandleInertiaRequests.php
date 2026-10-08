<?php

namespace App\Http\Middleware;

use App\Models\PlatformSetting;
use App\Models\School;
use App\Models\SchoolSetting;
use App\Services\RoleRegistry;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'auth' => [
                'user' => function () use ($request) {
                    $user = $request->user();
                    if (! $user) return null;

                    $roleNames = $user->getRoleNames();
                    $permissions = $user->getAllPermissions()->pluck('name')->toArray();

                    return [
                        'id'         => $user->id,
                        'name'       => $user->name,
                        'email'      => $user->email,
                        'phone'      => $user->phone ?? null,
                        'avatar'     => $user->avatar ?? null,
                        'avatar_url' => $user->avatar_url,
                        'role'       => $this->resolvePrimaryRoleFromCollection($roleNames),
                        'roles'      => $roleNames->toArray(),
                        'activeRole' => $this->resolveActiveRoleFromCollection($roleNames, $user),
                        'permissions'=> $permissions,
                        'school_id'  => $user->school_id ?? null,
                        'status'     => $user->status ?? null,
                    ];
                },
            ],
            'flash' => [
                'success'         => fn () => session('success'),
                'error'           => fn () => session('error'),
                'temp_password'   => fn () => session('temp_password'),
                'show_credentials'=> fn () => session('show_credentials'),
            ],
            'verified'           => fn () => session('verified'),
            'already_registered' => fn () => session('already_registered'),
            'webPush' => [
                'enabled'        => (bool) (config('services.webpush.vapid.public_key') && config('services.webpush.vapid.private_key')),
                'vapidPublicKey' => config('services.webpush.vapid.public_key'),
            ],
            'platformLogoUrl' => fn () => once(function () {
                $path = PlatformSetting::get('platform_logo');
                return $path ? \Illuminate\Support\Facades\Storage::disk('public')->url($path) : null;
            }),
            'faviconUrl' => fn () => once(function () use ($request) {
                $user = $request->user();

                $favicon = null;
                if ($user && $user->school_id) {
                    $favicon = SchoolSetting::get($user->school_id, 'favicon');
                } elseif ($slug = $request->route('schoolSlug')) {
                    $school = School::where('slug', $slug)->where('status', 'active')->first();
                    $favicon = $school ? SchoolSetting::get($school->id, 'favicon') : null;
                }

                if ($favicon) {
                    return \Illuminate\Support\Facades\Storage::disk('public')->url($favicon);
                }

                $path = PlatformSetting::get('platform_favicon');
                return $path ? \Illuminate\Support\Facades\Storage::disk('public')->url($path) : null;
            }),
            'schoolBranding' => fn () => once(function () use ($request) {
                $user = $request->user();
                if ($user && $user->school_id) {
                    $school = School::find($user->school_id);
                    return $school ? $school->branding : null;
                }
                $slug = $request->route('schoolSlug');
                if ($slug) {
                    $school = School::where('slug', $slug)->where('status', 'active')->first();
                    return $school ? $school->branding : null;
                }
                return null;
            }),
            'subscription' => fn () => once(function () use ($request) {
                $user = $request->user();
                if (! $user || ! $user->school_id) {
                    return null;
                }

                $school = School::find($user->school_id);
                $sub = $school?->currentSubscription;

                if (! $school || ! $sub) {
                    return null;
                }

                return [
                    'status'           => $sub->status,
                    'is_trial'         => (bool) $sub->is_trial,
                    'is_fully_paid'    => $sub->is_fully_paid,
                    'trial_ends_at'    => $sub->trial_ends_at?->toDateString(),
                    'end_date'         => $sub->end_date?->toDateString(),
                    'balance'          => (float) $sub->balance,
                    'package_name'     => $sub->package?->name,
                    'currency_symbol'  => $school->currency_symbol,
                ];
            }),
            'schoolConfig' => fn () => once(function () use ($request) {
                $user = $request->user();
                if (!$user || !$user->school_id) return null;
                $schoolId = $user->school_id;
                $school = School::find($schoolId);
                $settings = SchoolSetting::allFor($schoolId);
                return [
                    'primary_color'     => $school?->primary_color,
                    'secondary_color'   => $school?->secondary_color,
                    'currency'          => $settings['currency'] ?? $school?->currency,
                    'currency_symbol'   => $school?->currency_symbol,
                    'language'          => $settings['language'] ?? 'en',
                    'terms_per_year'    => (int) ($settings['terms_per_year'] ?? 3),
                    'ca_weight'         => (float) ($settings['ca_weight'] ?? 40),
                    'exam_weight'       => (float) ($settings['exam_weight'] ?? 60),
                    'grading_system'    => $settings['grading_system'] ?? 'wassce',
                    'pass_mark'         => (int) ($settings['pass_mark'] ?? 50),
                    'enable_ece'        => ($settings['enable_ece'] ?? '1') === '1',
                    'enable_primary'    => ($settings['enable_primary'] ?? '1') === '1',
                    'enable_jss'        => ($settings['enable_jss'] ?? '1') === '1',
                    'enable_sss'        => ($settings['enable_sss'] ?? '1') === '1',
                    'section_format'    => $settings['section_format'] ?? 'letter',
                    'school_level'      => $school?->school_level,
                    'school_type'       => $school?->school_type,
                    // Result display settings
                    'result_show_position'            => $settings['result_show_position'] ?? 'overall',
                    'result_position_type'            => $settings['result_position_type'] ?? 'rank',
                    'result_show_teacher_comment'     => ($settings['result_show_teacher_comment'] ?? '0') === '1',
                    'result_show_principal_comment'   => ($settings['result_show_principal_comment'] ?? '0') === '1',
                    'result_show_form_master_comment' => ($settings['result_show_form_master_comment'] ?? '0') === '1',
                    'result_show_conduct'            => ($settings['result_show_conduct'] ?? '0') === '1',
                    'result_show_behaviour'          => ($settings['result_show_behaviour'] ?? '0') === '1',
                ];
            }),
        ];
    }

    private function resolveActiveRoleFromCollection($roles, $user): ?string
    {
        $active = session('active_role');
        if ($active && $roles->contains($active)) {
            return $active;
        }
        return $this->resolvePrimaryRoleFromCollection($roles);
    }

    private function resolvePrimaryRoleFromCollection($roles): ?string
    {
        if ($roles->isEmpty()) return null;

        $priority = [
            RoleRegistry::SUPER_ADMIN,
            RoleRegistry::MINISTRY_ADMIN,
            RoleRegistry::DISTRICT_OFFICER,
            RoleRegistry::SCHOOL_ADMIN,
            RoleRegistry::PRINCIPAL,
            RoleRegistry::TEACHER,
            RoleRegistry::ACCOUNTANT,
            RoleRegistry::LIBRARIAN,
            RoleRegistry::RECEPTIONIST,
            RoleRegistry::DRIVER,
            RoleRegistry::WARDEN,
            RoleRegistry::STORE_MANAGER,
            RoleRegistry::PROPRIETOR,
            RoleRegistry::STUDENT,
            RoleRegistry::PARENT,
        ];

        foreach ($priority as $role) {
            if ($roles->contains($role)) {
                return $role;
            }
        }

        return $roles->sort()->first();
    }
}
