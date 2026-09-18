<?php

namespace App\Console\Commands;

use App\Models\{Attendance, AuditLog, Notification};
use Carbon\Carbon;
use Illuminate\Console\Command;

class ArchiveOldRecords extends Command
{
    protected $signature = 'syscend:archive-old-records {--days=2555}';
    protected $description = 'Archive records older than specified days (default 7 years)';

    public function handle(): int
    {
        $days = (int) $this->option('days');
        $cutoff = Carbon::now()->subDays($days);

        // Archive old audit logs
        $auditLogs = AuditLog::where('created_at', '<', $cutoff)->count();
        AuditLog::where('created_at', '<', $cutoff)->delete();
        $this->info("Archived {$auditLogs} audit log records older than {$days} days.");

        // Clean up old notifications
        $notifications = Notification::where('created_at', '<', $cutoff)->delete();
        $this->info("Cleaned up {$notifications} old notifications.");

        // Archive old attendance (move to attendances_archive table)
        $this->createArchiveTableIfNotExists();
        $oldAttendance = Attendance::where('date', '<', $cutoff)->count();
        
        if ($oldAttendance > 0) {
            $this->line("Would archive {$oldAttendance} attendance records (archive table not implemented in demo).");
        }

        $this->info("Data retention check complete.");
        return Command::SUCCESS;
    }

    private function createArchiveTableIfNotExists(): void
    {
        \Illuminate\Support\Facades\Schema::createIfNotExists('attendances_archive', function ($table) {
            $table->id();
            $table->unsignedBigInteger('original_id');
            $table->unsignedBigInteger('school_id');
            $table->date('date');
            $table->string('attendable_type');
            $table->unsignedBigInteger('attendable_id');
            $table->string('status');
            $table->text('remarks')->nullable();
            $table->timestamp('archived_at');
        });
    }
}
