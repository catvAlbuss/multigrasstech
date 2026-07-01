<?php

declare(strict_types=1);

namespace App\Models;

use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

class TenantProfile extends Model implements HasMedia
{
    use BelongsToTenant, InteractsWithMedia;

    protected $fillable = [
        'tenant_id',
        'tagline',
        'description',
        'phone',
        'address',
        'email',
        'show_calendar',
        'booking_start_time',
        'booking_end_time',
    ];

    protected $casts = [
        'show_calendar' => 'boolean',
    ];

    public function registerMediaCollections(): void
    {
        $this->addMediaCollection('hero');
        $this->addMediaCollection('gallery');
        $this->addMediaCollection('payment_qr')->singleFile();
    }

    public function registerMediaConversions(?Media $media = null): void
    {
        $this->addMediaConversion('optimized')
            ->width(1920)
            ->height(1080)
            ->nonQueued();

        $this->addMediaConversion('thumb')
            ->width(800)
            ->height(500)
            ->nonQueued();
    }
}
