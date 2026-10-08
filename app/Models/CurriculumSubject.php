<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CurriculumSubject extends Model
{
    use HasFactory;

    protected $fillable = [
        'school_level', 'section_group', 'name', 'code', 'is_core', 'sort_order',
    ];

    protected $casts = [
        'is_core' => 'boolean',
    ];
}