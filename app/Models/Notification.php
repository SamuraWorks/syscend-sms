<?php

namespace App\Models;

use App\Services\PushService;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Notifications\DatabaseNotification;

class Notification extends DatabaseNotification
{
    protected $table = 'notifications';

    protected $fillable = [
        'id',
        'type',
        'notifiable_type',
        'notifiable_id',
        'data',
        'read_at',
    ];

    protected function casts(): array
    {
        return [
            'data' => 'array',
            'read_at' => 'datetime',
        ];
    }

    protected static function booted(): void
    {
        static::created(function (self $notification) {
            $notifiable = $notification->notifiable()->first();
            if (! $notifiable instanceof User) return;

            $data = $notification->data;
            if (! is_array($data)) {
                $data = json_decode((string) $data, true);
            }
            if (! is_array($data)) return;

            app(PushService::class)->sendToUser(
                $notifiable,
                (string) ($data['title'] ?? 'Syscend Campus'),
                (string) ($data['message'] ?? ''),
                isset($data['url']) ? (string) $data['url'] : null,
            );
        });
    }
}
