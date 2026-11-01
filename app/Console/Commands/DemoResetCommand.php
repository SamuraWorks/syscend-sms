<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Artisan;

class DemoResetCommand extends Command
{
    protected $signature = 'syscend:demo-reset {--fresh : Wipe ALL data including Super Admin}';
    protected $description = 'Reset the demo environment and seed with fresh Sierra Leone school data';

    public function handle(): int
    {
        if (app()->environment('production')) {
            $this->error('This command cannot be run in production.');
            return self::FAILURE;
        }

        $this->info('');
        $this->info('╔══════════════════════════════════════════════╗');
        $this->info('║   Syscend Campus — Demo Environment Reset   ║');
        $this->info('╚══════════════════════════════════════════════╝');
        $this->info('');

        if ($this->option('fresh')) {
            if (!$this->confirm('This will DELETE ALL DATA including the Super Admin. Continue?', false)) {
                $this->info('Aborted.');
                return self::SUCCESS;
            }
        } else {
            if (!$this->confirm('This will reset the demo school and all demo data. The Super Admin will be preserved. Continue?', true)) {
                $this->info('Aborted.');
                return self::SUCCESS;
            }
        }

        $start = microtime(true);

        // Step 1: Platform reset
        $this->line('');
        $this->info('▶ Step 1/2: Platform reset...');
        Artisan::call('db:seed', ['--class' => 'Database\\Seeders\\DemoResetSeeder', '--force' => true], $this->getOutput());
        $this->info(Artisan::output());

        // Step 2: Demo data
        $this->info('▶ Step 2/2: Seeding demo environment...');
        Artisan::call('db:seed', ['--class' => 'Database\\Seeders\\DemoSeeder', '--force' => true], $this->getOutput());
        $this->info(Artisan::output());

        $elapsed = round(microtime(true) - $start, 1);

        $this->info('');
        $this->info('══════════════════════════════════════════════');
        $this->info(' Demo environment ready! (took '.$elapsed.'s)');
        $this->info('══════════════════════════════════════════════');
        $this->info('');
        $this->info(' Login Credentials:');
        $this->info(' ─────────────────');
        $this->info(' Super Admin : syscend@gmail.com / Demo@123');
        $this->info(' School Admin: admin@freetownacademy.edu / Demo@123');
        $this->info(' Principal   : principal@freetownacademy.edu / Demo@123');
        $this->info(' Teacher     : amara.kamara@freetownacademy.edu / Demo@123');
        $this->info(' Accountant  : accountant@freetownacademy.edu / Demo@123');
        $this->info(' Librarian   : librarian@freetownacademy.edu / Demo@123');
        $this->info(' Student     : student1@freetownacademy.edu / Demo@123');
        $this->info(' Parent      : parent1@freetownacademy.edu / Demo@123');
        $this->info('');

        return self::SUCCESS;
    }
}
