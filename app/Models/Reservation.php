<?php

declare(strict_types=1);

namespace App\Models;

use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

class Reservation extends Model implements HasMedia
{
    use BelongsToTenant, InteractsWithMedia;

    protected $fillable = [
        'tenant_id',
        'code',
        'field_id',
        'client_id',
        'date',
        'start_time',
        'end_time',
        'status',
        'amount',
        'payment_method',
        'advance_amount',
        'payment_operation_number',
        'payment_expires_at',
        'notes',
    ];

    protected $casts = [
        'date' => 'date:Y-m-d',
        'amount' => 'decimal:2',
        'advance_amount' => 'decimal:2',
        'payment_expires_at' => 'datetime',
    ];

    protected $appends = ['payment_proof_url'];

    public function registerMediaConversions(?Media $media = null): void
    {
        $this->addMediaConversion('thumb')
            ->width(480)
            ->height(480)
            ->nonQueued();
    }

    protected function paymentProofUrl(): Attribute
    {
        return Attribute::make(
            get: fn () => $this->getFirstMediaUrl('payment_proof', 'thumb') ?: ($this->getFirstMediaUrl('payment_proof') ?: null),
        );
    }

    public function field(): BelongsTo
    {
        return $this->belongsTo(Field::class);
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    public function attendance(): HasMany
    {
        return $this->hasMany(Attendance::class);
    }

    public function transactions(): HasMany
    {
        return $this->hasMany(Transaction::class);
    }

    protected static function booted(): void
    {
        static::creating(function (self $reservation) {
            if (empty($reservation->code)) {
                $tenantId = tenant('id') ?? 0;
                $count = static::where('tenant_id', $tenantId)->count() + 1;
                $reservation->code = 'RSVR' . str_pad((string) $count, 4, '0', STR_PAD_LEFT);
            }
        });
    }
}
