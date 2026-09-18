<?php

namespace App\Services;

use App\Models\SchoolSetting;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SmsService
{
    private int $schoolId;
    private array $settings;

    public function __construct(int $schoolId)
    {
        $this->schoolId = $schoolId;
        $this->settings = SchoolSetting::allFor($schoolId);
    }

    public function send(string $to, string $message): array
    {
        $provider = $this->settings['sms_provider'] ?? 'vonage';

        return match($provider) {
            'twilio'  => $this->sendViaTwilio($to, $message),
            'vonage'  => $this->sendViaVonage($to, $message),
            default   => ['success' => false, 'error' => "Unknown provider: {$provider}"],
        };
    }

    public function sendBatch(array $recipients, string $message): array
    {
        $results = ['sent' => 0, 'failed' => 0, 'errors' => []];

        foreach ($recipients as $phone) {
            $result = $this->send($phone, $message);
            if ($result['success']) {
                $results['sent']++;
            } else {
                $results['failed']++;
                $results['errors'][$phone] = $result['error'] ?? 'Unknown error';
            }
        }

        return $results;
    }

    private function sendViaVonage(string $to, string $message): array
    {
        $apiKey    = $this->settings['sms_api_key'] ?? '';
        $apiSecret = $this->settings['sms_api_secret'] ?? '';
        $from      = $this->settings['sms_sender_id'] ?? $this->settings['sms_from_number'] ?? '';

        if (blank($apiKey) || blank($apiSecret)) {
            return ['success' => false, 'error' => 'Vonage API key or secret not configured.'];
        }

        try {
            $response = Http::timeout(10)->post('https://rest.nexmo.com/sms/json', [
                'api_key'    => $apiKey,
                'api_secret' => $apiSecret,
                'from'       => $from,
                'to'         => $to,
                'text'       => $message,
            ]);

            $body = $response->json();

            if ($response->successful() && isset($body['messages'][0]['status']) && $body['messages'][0]['status'] === '0') {
                Log::info('SMS sent via Vonage', ['to' => $to, 'school_id' => $this->schoolId, 'message_id' => $body['messages'][0]['message-id'] ?? null]);
                return ['success' => true, 'message_id' => $body['messages'][0]['message-id'] ?? null];
            }

            $error = $body['messages'][0]['error-text'] ?? 'Unknown Vonage error';
            Log::warning('Vonage SMS failed', ['to' => $to, 'error' => $error, 'response' => $body]);
            return ['success' => false, 'error' => $error];
        } catch (\Throwable $e) {
            Log::error('Vonage SMS exception', ['to' => $to, 'error' => $e->getMessage()]);
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    private function sendViaTwilio(string $to, string $message): array
    {
        $accountSid = $this->settings['sms_account_sid'] ?? '';
        $authToken  = $this->settings['sms_auth_token'] ?? '';
        $from       = $this->settings['sms_from_number'] ?? '';

        if (blank($accountSid) || blank($authToken)) {
            return ['success' => false, 'error' => 'Twilio Account SID or Auth Token not configured.'];
        }

        try {
            $response = Http::withBasicAuth($accountSid, $authToken)
                ->timeout(10)
                ->post("https://api.twilio.com/2010-04-01/Accounts/{$accountSid}/Messages.json", [
                    'From' => $from,
                    'To'   => $to,
                    'Body' => $message,
                ]);

            $body = $response->json();

            if ($response->successful() && !isset($body['code'])) {
                Log::info('SMS sent via Twilio', ['to' => $to, 'school_id' => $this->schoolId, 'sid' => $body['sid'] ?? null]);
                return ['success' => true, 'message_id' => $body['sid'] ?? null];
            }

            $error = $body['message'] ?? 'Unknown Twilio error';
            Log::warning('Twilio SMS failed', ['to' => $to, 'error' => $error, 'response' => $body]);
            return ['success' => false, 'error' => $error];
        } catch (\Throwable $e) {
            Log::error('Twilio SMS exception', ['to' => $to, 'error' => $e->getMessage()]);
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    public static function isConfigured(int $schoolId): bool
    {
        $settings = SchoolSetting::allFor($schoolId);
        $provider = $settings['sms_provider'] ?? 'vonage';

        return match($provider) {
            'twilio' => !blank($settings['sms_account_sid'] ?? '') && !blank($settings['sms_auth_token'] ?? ''),
            'vonage' => !blank($settings['sms_api_key'] ?? '') && !blank($settings['sms_api_secret'] ?? ''),
            default  => false,
        };
    }
}
