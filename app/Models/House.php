<?php

namespace App\Models;

use App\Traits\BelongsToSchool;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class House extends Model
{
    use BelongsToSchool;

    protected $fillable = [
        'school_id', 'name', 'color', 'house_master_id', 'is_active',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }

    public function houseMaster(): BelongsTo
    {
        return $this->belongsTo(Staff::class, 'house_master_id');
    }

    public function students(): HasMany
    {
        return $this->hasMany(Student::class);
    }
}
