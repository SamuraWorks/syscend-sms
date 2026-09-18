<?php

namespace App\Models;

use App\Scopes\SchoolScope;
use App\Traits\{BelongsToSchool, HasAuditLog};
use Illuminate\Database\Eloquent\Model;

class SchoolSetting extends Model
{
    use BelongsToSchool, HasAuditLog;

    protected $table = 'school_settings';

    protected $fillable = ['school_id', 'key', 'value', 'group'];

    public static function get(int $schoolId, string $key, mixed $default = null): mixed
    {
        return static::withoutGlobalScope(SchoolScope::class)
            ->where('school_id', $schoolId)->where('key', $key)->value('value') ?? $default;
    }

    public static function set(int $schoolId, string $key, mixed $value, string $group = 'general'): void
    {
        static::withoutGlobalScope(SchoolScope::class)->updateOrCreate(
            ['school_id' => $schoolId, 'key' => $key],
            ['value' => $value, 'group' => $group],
        );
    }

    public static function allFor(int $schoolId): array
    {
        return static::withoutGlobalScope(SchoolScope::class)
            ->where('school_id', $schoolId)->pluck('value', 'key')->toArray();
    }
}
