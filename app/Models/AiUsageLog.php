<?php

namespace App\Models;

use App\Traits\BelongsToSchool;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AiUsageLog extends Model
{
    use BelongsToSchool;

    protected $table = 'ai_usage_logs';

    public $timestamps = false;

    protected $fillable = [
        'school_id', 'user_id', 'feature', 'status', 'model',
        'input_tokens', 'output_tokens', 'total_tokens', 'latency_ms',
        'error_code', 'cost_usd_cents', 'ip_address', 'request_id', 'performed_at',
    ];

    protected $casts = [
        'input_tokens'  => 'integer',
        'output_tokens' => 'integer',
        'total_tokens'  => 'integer',
        'latency_ms'    => 'integer',
        'cost_usd_cents' => 'integer',
        'performed_at'  => 'datetime',
    ];

    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class);
    }
}