<?php

declare(strict_types=1);

namespace Tests\Feature\Tenant;

use App\Models\User;

class StaffCrudTest extends TenantTestCase
{
    public function test_admin_can_create_update_and_delete_staff(): void
    {
        $tenant = $this->createTenant();
        $admin = $this->createTenantUser($tenant, 'admin');

        $response = $this->actingAs($admin)->post($this->tenantUrl($tenant, 'staff'), [
            'name' => 'Nuevo Operador',
            'email' => 'nuevo@example.com',
            'password' => 'password123',
            'role' => 'operator',
        ]);
        $response->assertRedirect();
        $staff = User::where('email', 'nuevo@example.com')->firstOrFail();
        $this->assertSame($tenant->id, $staff->tenant_id);

        $this->actingAs($admin)->put($this->tenantUrl($tenant, "staff/{$staff->id}"), [
            'name' => 'Operador Editado',
            'email' => 'nuevo@example.com',
            'role' => 'viewer',
        ])->assertRedirect();
        $this->assertDatabaseHas('users', ['id' => $staff->id, 'name' => 'Operador Editado']);

        $this->actingAs($admin)->delete($this->tenantUrl($tenant, "staff/{$staff->id}"))
            ->assertRedirect();
        $this->assertDatabaseMissing('users', ['id' => $staff->id]);
    }

    public function test_operator_and_viewer_cannot_access_staff_routes(): void
    {
        $tenant = $this->createTenant();
        $operator = $this->createTenantUser($tenant, 'operator');
        $viewer = $this->createTenantUser($tenant, 'viewer');

        $this->actingAs($operator)->get($this->tenantUrl($tenant, 'staff'))->assertForbidden();
        $this->actingAs($viewer)->get($this->tenantUrl($tenant, 'staff'))->assertForbidden();
    }

    public function test_an_admin_cannot_manage_staff_belonging_to_another_tenant(): void
    {
        $tenantA = $this->createTenant(['slug' => 'tenant-a']);
        $tenantB = $this->createTenant(['slug' => 'tenant-b']);
        $adminA = $this->createTenantUser($tenantA, 'admin');
        $staffB = $this->createTenantUser($tenantB, 'operator');

        $this->actingAs($adminA)->put($this->tenantUrl($tenantA, "staff/{$staffB->id}"), [
            'name' => 'hacked',
            'email' => $staffB->email,
            'role' => 'admin',
        ])->assertForbidden();

        $this->actingAs($adminA)->delete($this->tenantUrl($tenantA, "staff/{$staffB->id}"))
            ->assertForbidden();

        $this->assertDatabaseHas('users', ['id' => $staffB->id, 'tenant_id' => $tenantB->id]);
    }
}
