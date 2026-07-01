<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Support\Carbon;
use Stancl\Tenancy\Database\Concerns\HasDomains;
use Stancl\Tenancy\Database\Models\Tenant as BaseTenant;

/**
 * @property int $id
 * @property string $name
 * @property string $slug
 * @property string|null $email
 * @property string|null $phone
 * @property string $plan
 * @property int|null $plan_id
 * @property Carbon|null $plan_expires_at
 * @property bool $is_active
 */
class Tenant extends BaseTenant
{
    use HasDomains;

    protected $keyType = 'int';

    public $incrementing = true;

    public static function getCustomColumns(): array
    {
        return ['id', 'name', 'slug', 'email', 'phone', 'plan', 'plan_id', 'plan_expires_at', 'is_active'];
    }

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'plan_expires_at' => 'datetime',
        ];
    }

    public function paymentPlan()
    {
        return $this->belongsTo(Plan::class, 'plan_id');
    }

    public function users()
    {
        return $this->hasMany(User::class, 'tenant_id');
    }
}
