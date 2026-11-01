<?php

namespace App\Models;

use App\Traits\BelongsToSchool;
use Illuminate\Database\Eloquent\Model;

class SchoolModule extends Model
{
    use BelongsToSchool;

    protected $fillable = ['school_id', 'module_slug', 'is_enabled'];

    protected $casts = ['is_enabled' => 'boolean'];
}
