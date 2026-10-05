<?php

namespace Database\Seeders;

use App\Models\Package;
use Illuminate\Database\Seeder;

/**
 * Seeds the packages that schools can subscribe to.
 *
 * A single "Free" package priced at 0.00 is provided and grants every module,
 * so module gating never blocks a school during the free period. Paid packages
 * can be added alongside it without affecting this one.
 */
class PackageSeeder extends Seeder
{
    /**
     * Every module slug gated by EnforceSubscriptionModules, plus any extra
     * module the application knows about.
     */
    private const ALL_MODULES = [
        'academics',
        'alumni',
        'assets',
        'attendance',
        'communication',
        'examinations',
        'fees',
        'hr',
        'inventory',
        'library',
        'proposals',
        'transport',
    ];

    public function run(): void
    {
        $package = Package::updateOrCreate(
            ['slug' => 'free'],
            [
                'name'           => 'Free',
                'description'    => 'All modules enabled at no cost.',
                'price_monthly'  => 0,
                'price_yearly'   => 0,
                'price_per_term' => 0,
                // 0 is treated as "unlimited" by the quota checks.
                'max_students'   => 0,
                'max_staff'      => 0,
                'storage_gb'     => 0,
                'is_active'      => true,
                'features'       => self::ALL_MODULES,
            ],
        );

        foreach (self::ALL_MODULES as $slug) {
            $package->modules()->firstOrCreate(['module_slug' => $slug]);
        }

        // Drop module rows that are no longer part of the free tier so the
        // seeder stays correct if the list above shrinks later.
        $package->modules()
            ->whereNotIn('module_slug', self::ALL_MODULES)
            ->delete();
    }
}