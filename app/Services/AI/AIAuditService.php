<?php

namespace App\Services\AI;

use App\Models\AiAuditLog;

/**
 * Persistent audit trail for every AI action taken (generate, edit, approve,
 * publish...) so that nothing an AI feature does happens invisibly.
 */
class AIAuditService
{
    public function record(array $attributes): AiAuditLog
    {
        $user = auth()->user();

        return AiAuditLog::create([
            'school_id'       => $attributes['school_id'] ?? $user?->school_id,
            'user_id'         => $attributes['user_id'] ?? $user?->id,
            'feature'         => $attributes['feature'],
            'action'          => $attributes['action'] ?? 'generate',
            'subject_type'    => $attributes['subject_type'] ?? null,
            'subject_id'      => $attributes['subject_id'] ?? null,
            'input_summary'   => $attributes['input_summary'] ?? null,
            'result_status'   => $attributes['result_status'] ?? 'ok',
            'published_applied' => (bool) ($attributes['published_applied'] ?? false),
            'metadata'        => $attributes['metadata'] ?? null,
            'performed_at'    => $attributes['performed_at'] ?? now(),
        ]);
    }
}