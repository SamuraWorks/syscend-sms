<?php

namespace App\Models;

use App\Traits\BelongsToSchool;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InterventionNote extends Model
{
    use BelongsToSchool;

    protected $fillable = [
        'school_id', 'intervention_id', 'author_id', 'note', 'note_type',
        'visibility',
    ];

    public function intervention(): BelongsTo { return $this->belongsTo(Intervention::class); }
    public function author(): BelongsTo { return $this->belongsTo(Staff::class, 'author_id'); }
}
