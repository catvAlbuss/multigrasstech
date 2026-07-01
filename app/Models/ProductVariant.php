<?php

declare(strict_types=1);

namespace App\Models;

use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

class ProductVariant extends Model implements HasMedia
{
    use BelongsToTenant, InteractsWithMedia;

    protected $fillable = [
        "product_id",
        "tenant_id",
        "label",
        "sku",
        "unit",
        "price",
        "stock",
        "is_active",
        "sort_order",
    ];

    protected $casts = [
        "price"      => "decimal:2",
        "stock"      => "integer",
        "is_active"  => "boolean",
        "sort_order" => "integer",
    ];

    protected $appends = ["image_url"];

    public function registerMediaConversions(?Media $media = null): void
    {
        $this->addMediaConversion("thumb")
              ->width(300)
              ->height(300)
              ->nonQueued();

        $this->addMediaConversion("optimized")
              ->width(800)
              ->height(800)
              ->nonQueued();
    }

    protected function imageUrl(): Attribute
    {
        return Attribute::make(
            get: function () {
                $own = $this->getFirstMediaUrl("image", "optimized")
                    ?: $this->getFirstMediaUrl("image");
                if ($own) {
                    return $own;
                }
                return $this->product?->getFirstMediaUrl("image", "optimized")
                    ?: $this->product?->getFirstMediaUrl("image")
                    ?: null;
            },
        );
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
