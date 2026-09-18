<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DemoRequestStatusHistory extends Model
{
    protected $fillable = ['demo_request_id', 'user_id', 'old_status', 'new_status', 'notes'];

    protected $table = 'demo_request_status_history';

    public function demoRequest(): BelongsTo
    {
        return $this->belongsTo(DemoRequest::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
