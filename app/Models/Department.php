<?php

namespace App\Models;

use App\Traits\BelongsToSchool;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Department extends Model
{
    use BelongsToSchool, SoftDeletes;

    protected $fillable = ['school_id', 'name', 'code', 'description', 'type', 'is_active'];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function designations(): HasMany
    {
        return $this->hasMany(Designation::class);
    }

    public function staff(): HasMany
    {
        return $this->hasMany(Staff::class);
    }

    public function classes(): HasMany
    {
        return $this->hasMany(SchoolClass::class, 'department_id');
    }

    public function scopeAcademic($query)
    {
        return $query->where('type', 'academic');
    }

    public function scopeStaff($query)
    {
        return $query->where('type', 'staff');
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}
