<?php

namespace App\Models;

use App\Traits\BelongsToSchool;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InquiryFollowup extends Model
{
    use BelongsToSchool;

    protected $fillable = ['school_id', 'inquiry_id', 'staff_id', 'note', 'next_date'];

    protected $casts = [
        'next_date' => 'date',
    ];

    public function inquiry(): BelongsTo
    {
        return $this->belongsTo(AdmissionInquiry::class, 'inquiry_id');
    }

    public function staff(): BelongsTo
    {
        return $this->belongsTo(User::class, 'staff_id');
    }
}
