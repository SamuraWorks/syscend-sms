<?php

namespace App\Services\AI;

use RuntimeException;
use Throwable;

/**
 * Signals an expected AI failure that the controller translates into a stable
 * HTTP response (403 forbidden / 429 throttled / 503 unavailable / 500
 * misconfigured). Never exposes provider internals to the client.
 */
class AIUnavailableException extends RuntimeException
{
    public function __construct(
        string $message,
        public readonly string $type = 'unavailable',
        ?Throwable $previous = null,
    ) {
        parent::__construct($message, 0, $previous);
    }

    public function toHttpStatus(): int
    {
        return match ($this->type) {
            'forbidden'   => 403,
            'throttled'   => 429,
            'misconfigured' => 500,
            default       => 503,
        };
    }
}