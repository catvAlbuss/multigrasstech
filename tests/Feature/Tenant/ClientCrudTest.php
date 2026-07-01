<?php

declare(strict_types=1);

namespace Tests\Feature\Tenant;

use App\Models\Client;

class ClientCrudTest extends TenantTestCase
{
    private array $payload = [
        'name' => 'Juan Perez',
        'email' => 'juan@example.com',
        'phone' => '999999999',
        'is_active' => true,
    ];

    public function test_admin_can_create_a_client(): void
    {
        $tenant = $this->createTenant();
        $admin = $this->createTenantUser($tenant, 'admin');

        $response = $this->actingAs($admin)->post($this->tenantUrl($tenant, 'clients'), $this->payload);

        $response->assertRedirect();
        $this->assertDatabaseHas('clients', ['name' => 'Juan Perez', 'tenant_id' => $tenant->id]);
    }

    public function test_creating_a_client_requires_valid_data(): void
    {
        $tenant = $this->createTenant();
        $admin = $this->createTenantUser($tenant, 'admin');

        $response = $this->actingAs($admin)->post($this->tenantUrl($tenant, 'clients'), [
            'name' => '',
            'email' => 'not-an-email',
            'is_active' => true,
        ]);

        $response->assertSessionHasErrors(['name', 'email']);
    }

    public function test_document_number_uniqueness_is_scoped_per_tenant(): void
    {
        $tenantA = $this->createTenant(['slug' => 'tenant-a']);
        $tenantB = $this->createTenant(['slug' => 'tenant-b']);
        $adminA = $this->createTenantUser($tenantA, 'admin');
        $adminB = $this->createTenantUser($tenantB, 'admin');

        $payload = array_merge($this->payload, [
            'document_type' => 'dni',
            'document_number' => '12345678',
        ]);

        $this->actingAs($adminA)->post($this->tenantUrl($tenantA, 'clients'), $payload)
            ->assertRedirect();

        // Same document number, different tenant: must be allowed.
        $this->actingAs($adminB)->post($this->tenantUrl($tenantB, 'clients'), $payload)
            ->assertRedirect();

        $this->assertDatabaseHas('clients', ['document_number' => '12345678', 'tenant_id' => $tenantA->id]);
        $this->assertDatabaseHas('clients', ['document_number' => '12345678', 'tenant_id' => $tenantB->id]);

        // Same tenant, duplicate document number: must be rejected.
        $this->actingAs($adminA)->post($this->tenantUrl($tenantA, 'clients'), $payload)
            ->assertSessionHasErrors(['document_number']);
    }

    public function test_admin_can_update_and_delete_a_client(): void
    {
        $tenant = $this->createTenant();
        $admin = $this->createTenantUser($tenant, 'admin');
        $client = Client::create(array_merge($this->payload, ['tenant_id' => $tenant->id]));

        $this->actingAs($admin)->put(
            $this->tenantUrl($tenant, "clients/{$client->id}"),
            array_merge($this->payload, ['name' => 'Juan Actualizado'])
        )->assertRedirect();
        $this->assertDatabaseHas('clients', ['id' => $client->id, 'name' => 'Juan Actualizado']);

        $this->actingAs($admin)->delete($this->tenantUrl($tenant, "clients/{$client->id}"))
            ->assertRedirect();
        $this->assertDatabaseMissing('clients', ['id' => $client->id]);
    }

    public function test_viewer_cannot_mutate_clients(): void
    {
        $tenant = $this->createTenant();
        $viewer = $this->createTenantUser($tenant, 'viewer');
        $client = Client::create(array_merge($this->payload, ['tenant_id' => $tenant->id]));

        $this->actingAs($viewer)->post($this->tenantUrl($tenant, 'clients'), $this->payload)
            ->assertForbidden();
        $this->actingAs($viewer)->put($this->tenantUrl($tenant, "clients/{$client->id}"), $this->payload)
            ->assertForbidden();
        $this->actingAs($viewer)->delete($this->tenantUrl($tenant, "clients/{$client->id}"))
            ->assertForbidden();
    }

    public function test_operator_can_create_and_update_but_not_delete_clients(): void
    {
        $tenant = $this->createTenant();
        $operator = $this->createTenantUser($tenant, 'operator');
        $client = Client::create(array_merge($this->payload, ['tenant_id' => $tenant->id]));

        $this->actingAs($operator)->post($this->tenantUrl($tenant, 'clients'), $this->payload)
            ->assertRedirect();
        $this->actingAs($operator)->put($this->tenantUrl($tenant, "clients/{$client->id}"), $this->payload)
            ->assertRedirect();
        $this->actingAs($operator)->delete($this->tenantUrl($tenant, "clients/{$client->id}"))
            ->assertForbidden();
    }

    public function test_users_cannot_access_a_client_belonging_to_another_tenant(): void
    {
        $tenantA = $this->createTenant(['slug' => 'tenant-a']);
        $tenantB = $this->createTenant(['slug' => 'tenant-b']);
        $adminA = $this->createTenantUser($tenantA, 'admin');
        $clientB = Client::create(array_merge($this->payload, ['tenant_id' => $tenantB->id]));

        $this->actingAs($adminA)->put($this->tenantUrl($tenantA, "clients/{$clientB->id}"), $this->payload)
            ->assertNotFound();
        $this->actingAs($adminA)->delete($this->tenantUrl($tenantA, "clients/{$clientB->id}"))
            ->assertNotFound();

        $this->assertDatabaseHas('clients', ['id' => $clientB->id, 'tenant_id' => $tenantB->id]);
    }
}
