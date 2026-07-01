<?php

declare(strict_types=1);

namespace App\Listeners;

use App\Actions\Tenancy\ProvisionTenantRoles;
use App\Models\Tenant;
use Stancl\Tenancy\Events\TenantCreated;

class ProvisionTenantRolesOnCreated
{
    public function handle(TenantCreated $event): void
    {
        /** @var Tenant $tenant */
        $tenant = $event->tenant;

        (new ProvisionTenantRoles)->handle($tenant);
    }
}
