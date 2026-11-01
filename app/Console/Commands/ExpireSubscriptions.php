<?php

namespace App\Console\Commands;

use App\Models\SchoolSubscription;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class ExpireSubscriptions extends Command
{
    protected $signature = 'subscriptions:expire';
    protected $description = 'Mark expired subscriptions and deactivate modules for schools with overdue payments';

    public function handle(): int
    {
        $expired = SchoolSubscription::where('status', 'active')
            ->where('end_date', '<', now())
            ->get();

        $count = 0;
        foreach ($expired as $sub) {
            $sub->update(['status' => 'expired']);
            Log::info("Subscription {$sub->id} expired for school {$sub->school_id}");
            $count++;
        }

        $suspended = SchoolSubscription::where('status', 'active')
            ->whereHas('confirmedPayments', function ($q) {
                $q->whereRaw('(SELECT COALESCE(SUM(amount),0) FROM subscription_payments WHERE subscription_id = school_subscriptions.id AND status = \'confirmed\') < school_subscriptions.price_per_term');
            })
            ->where('end_date', '<', now()->subDays(3))
            ->get();

        foreach ($suspended as $sub) {
            $sub->update(['status' => 'suspended']);
            Log::info("Subscription {$sub->id} suspended (unpaid after grace period) for school {$sub->school_id}");
            $count++;
        }

        $this->info("Processed {$count} expired/suspended subscriptions.");
        return self::SUCCESS;
    }
}
