<?php

namespace App\Services\AI\Contracts;

/**
 * Provider contract — keeps feature code decoupled from a specific vendor.
 *
 * The normalized request is deliberately small:
 *
 *   [
 *     'model'            => 'gpt-4o-mini',
 *     'instructions'     => 'system-style instructions text',
 *     'input'            => 'primary prompt/content to process',
 *     'temperature'      => 0.4,
 *     'max_tokens'       => 4096,
 *     'response_format'  => ['type' => 'json_schema', 'schema' => [...]] | null,
 *     'extra'            => provider-specific passthrough,
 *   ]
 *
 * The normalized response is:
 *
 *   [
 *     'content'        => string,
 *     'finish_reason'  => 'stop'|'length'|'content_filter'|...,
 *     'model'          => string,
 *     'usage'          => ['input_tokens'=>int,'output_tokens'=>int,'total_tokens'=>int],
 *   ]
 */
interface AIProvider
{
    public function clientName(): string;

    public function supports(array $capabilities): bool;

    public function generate(array $params): array;

    public function hasCredentials(): bool;
}