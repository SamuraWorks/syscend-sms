<?php

namespace App\Services\AI\Prompts;

/**
 * Base class for feature prompts.
 *
 * Each feature prompt controls:
 *  - system(): the behavioural contract sent to the model
 *  - build($context): the user-role input assembled ONLY from real school data
 *  - schema() + schemaName(): the strict JSON output contract (for providers
 *    that support structured outputs)
 *
 * Guardrails live here so feature controllers stay thin.
 */
abstract class Prompt
{
    /**
     * Behavioural contract (system-level) transmitted before the user prompt.
     */
    abstract public function system(): string;

    /**
     * Render the feature-specific user prompt from validated context. The
     * context builder guarantees fields exist; prompts never invent facts —
     * anything missing must be replaced with a placeholder the user fills in.
     */
    abstract public function build(array $context): string;

    /**
     * Strict JSON Schema for the output object (additionalProperties: false so
     * it is compatible with structured-output modes).
     */
    abstract public function schema(): array;

    /**
     * Top-level object name used by providers that require one.
     */
    public function schemaName(): string
    {
        return 'structured_output';
    }

    /**
     * Maximum characters the assembled user prompt may reach. Feature
     * controllers may preshrink context to this ceiling before calling the
     * provider.
     */
    public function maxPromptChars(): int
    {
        return (int) config('ai.limits.max_prompt_chars', 20000);
    }
}