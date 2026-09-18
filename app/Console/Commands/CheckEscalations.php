<?php

namespace App\Console\Commands;

use App\Services\ApprovalEscalationService;
use Illuminate\Console\Command;

class CheckEscalations extends Command
{
    protected $signature = 'syscend:check-escalations';
    protected $description = 'Check for overdue approvals and escalate';

    public function handle(): int
    {
        $escalated = ApprovalEscalationService::checkEscalations();
        $this->info("Escalated " . count($escalated) . " items.");
        return Command::SUCCESS;
    }
}
