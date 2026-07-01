<?php

declare(strict_types=1);

namespace Tests\Feature\Tenant;

class TenantDashboardTest extends TenantTestCase
{
    public function test_authenticated_users_can_view_the_tenant_dashboard(): void
    {
        $tenant = $this->createTenant();
        $admin = $this->createTenantUser($tenant, 'admin');

        $this->actingAs($admin)->get($this->tenantUrl($tenant, 'dashboard'))->assertOk();
    }

    public function test_guests_are_redirected_to_login(): void
    {
        $tenant = $this->createTenant();

        $this->get($this->tenantUrl($tenant, 'dashboard'))->assertRedirect(route('login'));
    }
}
