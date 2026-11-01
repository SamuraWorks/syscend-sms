<?php

namespace App\Jobs;

use App\Services\SmsService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class SendSmsBlast implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;
    public int $backoff = 30;

    public function __construct(
        public readonly array  $recipients,
        public readonly string $message,
        public readonly int    $schoolId,
    ) {}

    public function handle(): void
    {
        $sms = new SmsService($this->schoolId);
        $result = $sms->sendBatch($this->recipients, $this->message);

        Log::info('SMS Blast completed', [
            'school_id'  => $this->schoolId,
            'sent'       => $result['sent'],
            'failed'     => $result['failed'],
            'total'      => count($this->recipients),
        ]);

        if ($result['failed'] > 0 && $result['failed'] === count($this->recipients)) {
            throw new \RuntimeException('All SMS deliveries failed: ' . json_encode($result['errors']));
        }
    }
}
