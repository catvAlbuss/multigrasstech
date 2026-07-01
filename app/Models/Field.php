<?php

declare(strict_types=1);

namespace App\Models;

use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

class Field extends Model implements HasMedia
{
    use BelongsToTenant, InteractsWithMedia;

    protected $fillable = [
        'tenant_id',
        'name',
        'description',
        'surface_type',
        'sport_type',
        'capacity',
        'hourly_rate',
        'status',
        'is_featured',
        'image_path',
        'shared_group_id',
    ];

    protected $casts = [
        'hourly_rate' => 'decimal:2',
        'capacity' => 'integer',
        'is_featured' => 'boolean',
    ];

    protected $appends = ['image_url'];

    public function registerMediaConversions(?Media $media = null): void
    {
        $this->addMediaConversion('thumb')
              ->width(400)
              ->height(400)
              ->nonQueued();
              
        $this->addMediaConversion('optimized')
              ->width(1200)
              ->height(800)
              ->nonQueued();
    }

    protected function imageUrl(): Attribute
    {
        return Attribute::make(
            get: fn () => $this->getFirstMediaUrl('image', 'optimized') ?: ($this->getFirstMediaUrl('image') ?: null),
        );
    }

    public function reservations(): HasMany
    {
        return $this->hasMany(Reservation::class);
    }

    public function attendance(): HasMany
    {
        return $this->hasMany(Attendance::class);
    }

    /**
     * Get all other fields that share the same physical space as this field.
     */
    public function sharedFields()
    {
        return $this->hasMany(Field::class, 'shared_group_id', 'shared_group_id')
                    ->where('id', '!=', $this->id)
                    ->whereNotNull('shared_group_id');
    }
}
