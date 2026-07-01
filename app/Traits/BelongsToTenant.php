<?php

declare(strict_types=1);

namespace App\Traits;

use Illuminate\Database\Eloquent\Builder;

trait BelongsToTenant
{
    protected static function bootBelongsToTenant(): void
    {
        static::addGlobalScope('tenant', function (Builder $query) {
            if (tenancy()->initialized) {
                $query->where(static::getTenantForeignKey(), tenant('id'));
            }
        });

        static::creating(function ($model) {
            if (tenancy()->initialized && empty($model->{static::getTenantForeignKey()})) {
                $model->{static::getTenantForeignKey()} = tenant('id');
            }
        });
    }

    public static function getTenantForeignKey(): string
    {
        return 'tenant_id';
    }
}
