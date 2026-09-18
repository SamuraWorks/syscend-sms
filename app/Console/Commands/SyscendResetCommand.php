<?php

namespace App\Console\Commands;

use App\Services\SyscendResetService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;

class SyscendResetCommand extends Command
{
    protected $signature = 'syscend:reset {--dry-run : Simulate reset without making changes}';

    protected $description = 'Reset Syscend Campus to a clean state with only the super-admin account';

    public function handle(): int
    {
        // Production safety check
        if ($this->laravel->environment('production') && !$this->option('dry-run')) {
            if (!$this->confirm(
                '⚠️  PRODUCTION ENVIRONMENT DETECTED. Are you absolutely sure you want to proceed?',
                false
            )) {
                $this->error('Reset aborted.');
                return self::FAILURE;
            }
        }

        $this->displayBanner();
        $this->displayWarning();

        // Get confirmation
        if (!$this->getConfirmation()) {
            $this->info('Reset aborted.');
            return self::SUCCESS;
        }

        $isDryRun = $this->option('dry-run');

        if ($isDryRun) {
            $this->info('🔍 DRY RUN MODE — No changes will be made');
            $this->newLine();
        }

        try {
            $service = new SyscendResetService();
            $service->setDryRun($isDryRun);

            $this->info('Executing reset...');
            $this->newLine();

            $result = $service->reset();

            $this->displayResults($result);

            if (!$isDryRun) {
                $this->displayNewPassword($result['password']);
            }

            return self::SUCCESS;
        } catch (\Exception $e) {
            $this->error('Reset failed: ' . $e->getMessage());
            if ($this->laravel->environment('local')) {
                $this->error($e->getTraceAsString());
            }
            return self::FAILURE;
        }
    }

    protected function displayBanner(): void
    {
        $this->info('');
        $this->info('╔════════════════════════════════════════════════════════╗');
        $this->info('║                                                        ║');
        $this->info('║     SYSCEND CAMPUS — CONTROLLED FRESH DATABASE RESET   ║');
        $this->info('║                                                        ║');
        $this->info('╚════════════════════════════════════════════════════════╝');
        $this->info('');
    }

    protected function displayWarning(): void
    {
        $this->warn('⚠️  WARNING: THIS ACTION CANNOT BE UNDONE ⚠️');
        $this->newLine();

        $this->line('This will PERMANENTLY DELETE all Syscend Campus application data:');
        $this->newLine();

        $this->line('  • All schools and school configurations');
        $this->line('  • All students, parents, and staff members');
        $this->line('  • All academic records and results');
        $this->line('  • All attendance records');
        $this->line('  • All financial records (fees, payments, payroll)');
        $this->line('  • All communication records (announcements, messages)');
        $this->line('  • All inventory and asset records');
        $this->line('  • All library records');
        $this->line('  • All hostel and transport allocations');
        $this->line('  • All uploaded application data');
        $this->line('  • All activity logs');
        $this->newLine();

        $this->line('The database schema and system configuration will remain intact.');
        $this->line('A fresh Super Admin account will be created.');
        $this->newLine();
    }

    protected function getConfirmation(): bool
    {
        $response = $this->ask('Type the exact phrase to confirm', '');
        $expected = 'RESET SYSCEND CAMPUS';

        if ($response !== $expected) {
            $this->error("Invalid confirmation. Expected: \"{$expected}\" (you entered: \"{$response}\")");
            return false;
        }

        if ($this->option('dry-run')) {
            return true;
        }

        return $this->confirm('Proceed with the irreversible database reset?', false);
    }

    protected function displayResults(array $result): void
    {
        $this->newLine();
        $this->info('════════════════════════════════════════════════════════');
        $this->info(' RESET COMPLETE');
        $this->info('════════════════════════════════════════════════════════');
        $this->newLine();

        if ($result['dry_run']) {
            $this->warn('DRY RUN — The following would be cleared:');
            $this->newLine();
        } else {
            $this->info('DATABASE STATUS:');
            $this->newLine();
        }

        // Display statistics
        $this->line('  Reset Summary:');
        $this->line('  ─────────────────────────────────────');
        $this->line('  Tables cleared:           ' . $result['stats']['tables_cleared']);
        $this->line('  Records deleted:          ' . $result['stats']['records_deleted']);
        $this->newLine();

        // Display verification
        $verification = $result['verification'];
        $this->line('  Verification:');
        $this->line('  ─────────────────────────────────────');
        $this->line('  Schools:                  ' . $verification['schools_count']);
        $this->line('  Users:                    ' . $verification['users_count']);
        $this->line('  Roles:                    ' . $verification['roles_count']);
        $this->line('  Permissions:              ' . $verification['permissions_count']);
        $this->newLine();

        if ($verification['super_admin_exists']) {
            $this->line('  Super Admin Account:');
            $this->line('  ─────────────────────────────────────');
            $this->line('  Name:                     ' . $verification['super_admin_name']);
            $this->line('  Email:                    ' . $verification['super_admin_email']);
            $this->line('  Role assigned:            ' . ($verification['super_admin_role'] ? 'Yes' : 'No'));
            $this->newLine();
        }

        if (!$result['dry_run']) {
            $integrity = $verification['foreign_key_integrity'] ? 'VERIFIED' : 'ISSUES DETECTED';
            $this->line('  Foreign Key Integrity:    ' . $integrity);
            $this->newLine();

            $this->comment('✓ Fresh database state ready for deployment');
        }

        $this->newLine();
    }

    protected function displayNewPassword(string $password): void
    {
        $this->newLine();
        $this->info('════════════════════════════════════════════════════════');
        $this->warn(' TEMPORARY PASSWORD FOR SUPER ADMIN');
        $this->info('════════════════════════════════════════════════════════');
        $this->newLine();

        $this->line('  Email:               syscend@gmail.com');
        $this->line('  Name:                Syscend Campus');
        $this->line('  Temporary Password:  ' . $password);
        $this->newLine();

        $this->warn('⚠️  IMPORTANT SECURITY NOTES:');
        $this->line('  1. Save this password somewhere secure');
        $this->line('  2. User MUST change password on first login');
        $this->line('  3. This password is NOT stored in code or .env');
        $this->line('  4. Do NOT commit this output to version control');
        $this->newLine();
    }
}
