<?php

declare(strict_types=1);

namespace Tests\Feature\Tenant;

class ReportTest extends TenantTestCase
{
    public function test_authenticated_users_can_view_reports(): void
    {
        $tenant = $this->createTenant();
        $admin = $this->createTenantUser($tenant, 'admin');

        $this->actingAs($admin)->get($this->tenantUrl($tenant, 'reports'))->assertOk();
    }

    public function test_viewer_can_view_reports(): void
    {
        $tenant = $this->createTenant();
        $viewer = $this->createTenantUser($tenant, 'viewer');

        $this->actingAs($viewer)->get($this->tenantUrl($tenant, 'reports'))->assertOk();
    }

    public function test_guests_are_redirected_to_login(): void
    {
        $tenant = $this->createTenant();

        $this->get($this->tenantUrl($tenant, 'reports'))->assertRedirect(route('login'));
    }
}
