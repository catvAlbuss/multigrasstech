<?php

declare(strict_types=1);

namespace App\Models;

use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Transaction extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'tenant_id',
        'type',
        'category',
        'document_type',
        'description',
        'amount',
        'date',
        'reservation_id',
        'attended_by',
        'notes',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'date' => 'date',
    ];

    public function reservation(): BelongsTo
    {
        return $this->belongsTo(Reservation::class);
    }

    public function attendant(): BelongsTo
    {
        return $this->belongsTo(User::class, 'attended_by');
    }
}
