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
        'ancho',
        'largo',
        'zona_tribuna',
        'image_path',
        'shared_group_id',
    ];

    protected $casts = [
        'hourly_rate' => 'decimal:2',
        'capacity' => 'integer',
        'is_featured' => 'boolean',
        'ancho' => 'decimal:2',
        'largo' => 'decimal:2',
        'zona_tribuna' => 'boolean',
    ];

    protected $appends = ['image_url', 'area_label', 'zona_tribuna_label'];

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

    protected function areaLabel(): Attribute
    {
        return Attribute::make(
            get: function () {
                if (! $this->ancho || ! $this->largo) {
                    return null;
                }

                $area = round((float) $this->ancho * (float) $this->largo, 2);
                $perimetro = round(2 * ((float) $this->ancho + (float) $this->largo), 2);

                return "{$area} m² | {$perimetro} m";
            },
        );
    }

    protected function zonaTribunaLabel(): Attribute
    {
        return Attribute::make(
            get: fn () => $this->zona_tribuna ? 'Con tribuna' : null,
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
