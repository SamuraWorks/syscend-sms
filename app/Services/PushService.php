<?php

namespace App\Services;

use App\Models\PushSubscription;
use App\Models\User;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use App\Models\PlatformSetting;
use Minishlink\WebPush\Subscription;
use Minishlink\WebPush\WebPush;
use Throwable;

class PushService
{
    public function __construct()
    {
        $this->ensureOpenSslConfig();
    }

    public function isEnabled(): bool
    {
        return (bool) config('services.webpush.vapid.public_key')
            && (bool) config('services.webpush.vapid.private_key');
    }

    public function sendToUser(User $user, string $title, string $message, ?string $url = null): bool
    {
        if (! $this->isEnabled()) return false;

        $subscriptions = PushSubscription::where('user_id', $user->id)->get();
        if ($subscriptions->isEmpty()) return false;

        $branding = $this->brandingFor($user);
        $payload = json_encode([
            'title'   => $title,
            'message' => $message,
            'url'     => $url,
            'icon'    => $branding['icon'],
            'badge'   => $branding['badge'],
        ]);

        try {
            $webPush = new WebPush(['VAPID' => [
                'subject'    => config('services.webpush.vapid.subject', 'mailto:syscend-campus@example.com'),
                'publicKey'  => config('services.webpush.vapid.public_key'),
                'privateKey' => config('services.webpush.vapid.private_key'),
            ]]);

            foreach ($subscriptions as $subscription) {
                $webPush->queueNotification(
                    Subscription::create([
                        'endpoint' => $subscription->endpoint,
                        'keys'     => ['p256dh' => $subscription->p256dh, 'auth' => $subscription->auth_token],
                    ]),
                    $payload,
                    ['TTL' => 2419200, 'urgency' => 'high']
                );
            }

            foreach ($webPush->flush() as $report) {
                $endpoint = $report->getEndpoint();

                if ($report->isSubscriptionExpired()) {
                    PushSubscription::where('endpoint', $endpoint)->delete();
                } elseif (! $report->isSuccess()) {
                    Log::warning('Web push delivery failed', [
                        'endpoint' => $endpoint,
                        'reason'   => $report->getReason(),
                    ]);
                }
            }

            return true;
        } catch (Throwable $e) {
            Log::warning('Web push send failed', ['error' => $e->getMessage()]);

            return false;
        }
    }

    /** @return array{icon: string, badge: string} */
    private function brandingFor(User $user): array
    {
        $fallback = asset('images/logo.png');
        $school = $user->school;

        if ($school) {
            $icon = $school->logo_url ?: $school->badge_url;
            if ($icon) {
                return ['icon' => $icon, 'badge' => $school->badge_url ?: $icon];
            }
        }

        $platformLogo = PlatformSetting::get('platform_logo');
        $platformUrl = $platformLogo ? Storage::disk('public')->url($platformLogo) : $fallback;

        return ['icon' => $platformUrl, 'badge' => $platformUrl];
    }

    private function ensureOpenSslConfig(): void
    {
        if (getenv('OPENSSL_CONF')) return;

        $binary = getenv('PHP_BINARY') ?: (defined('PHP_BINARY') ? PHP_BINARY : null);
        if ($binary && is_file(dirname($binary) . '/extras/ssl/openssl.cnf')) {
            putenv('OPENSSL_CONF=' . dirname($binary) . '/extras/ssl/openssl.cnf');
        }
    }
}
