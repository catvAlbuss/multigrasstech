<?php

declare(strict_types=1);

namespace Tests\Feature\Tenant;

use App\Models\Field;

class FieldCrudTest extends TenantTestCase
{
    private array $payload = [
        'name' => 'Cancha Principal',
        'description' => 'Cancha de futbol 7',
        'surface_type' => 'grass',
        'sport_type' => 'futbol',
        'capacity' => 14,
        'hourly_rate' => 80,
        'status' => 'active',
    ];

    public function test_admin_can_create_a_field(): void
    {
        $tenant = $this->createTenant();
        $admin = $this->createTenantUser($tenant, 'admin');

        $response = $this->actingAs($admin)->post($this->tenantUrl($tenant, 'fields'), $this->payload);

        $response->assertRedirect();
        $response->assertSessionHas('success');
        $this->assertDatabaseHas('fields', [
            'name' => 'Cancha Principal',
            'tenant_id' => $tenant->id,
        ]);
    }

    public function test_creating_a_field_requires_valid_data(): void
    {
        $tenant = $this->createTenant();
        $admin = $this->createTenantUser($tenant, 'admin');

        $response = $this->actingAs($admin)->post($this->tenantUrl($tenant, 'fields'), [
            'name' => '',
            'surface_type' => 'not-a-surface',
            'capacity' => -1,
            'hourly_rate' => 80,
            'status' => 'active',
        ]);

        $response->assertSessionHasErrors(['name', 'surface_type', 'capacity']);
    }

    public function test_admin_can_update_and_delete_a_field(): void
    {
        $tenant = $this->createTenant();
        $admin = $this->createTenantUser($tenant, 'admin');
        $field = Field::create(array_merge($this->payload, ['tenant_id' => $tenant->id]));

        $response = $this->actingAs($admin)->put(
            $this->tenantUrl($tenant, "fields/{$field->id}"),
            array_merge($this->payload, ['name' => 'Cancha Renovada'])
        );
        $response->assertRedirect();
        $this->assertDatabaseHas('fields', ['id' => $field->id, 'name' => 'Cancha Renovada']);

        $response = $this->actingAs($admin)->delete($this->tenantUrl($tenant, "fields/{$field->id}"));
        $response->assertRedirect();
        $this->assertDatabaseMissing('fields', ['id' => $field->id]);
    }

    public function test_viewer_cannot_create_update_or_delete_fields(): void
    {
        $tenant = $this->createTenant();
        $viewer = $this->createTenantUser($tenant, 'viewer');
        $field = Field::create(array_merge($this->payload, ['tenant_id' => $tenant->id]));

        $this->actingAs($viewer)->post($this->tenantUrl($tenant, 'fields'), $this->payload)
            ->assertForbidden();

        $this->actingAs($viewer)->put($this->tenantUrl($tenant, "fields/{$field->id}"), $this->payload)
            ->assertForbidden();

        $this->actingAs($viewer)->delete($this->tenantUrl($tenant, "fields/{$field->id}"))
            ->assertForbidden();
    }

    public function test_operator_can_create_and_update_but_not_delete_fields(): void
    {
        $tenant = $this->createTenant();
        $operator = $this->createTenantUser($tenant, 'operator');
        $field = Field::create(array_merge($this->payload, ['tenant_id' => $tenant->id]));

        $this->actingAs($operator)->post($this->tenantUrl($tenant, 'fields'), $this->payload)
            ->assertRedirect();

        $this->actingAs($operator)->put(
            $this->tenantUrl($tenant, "fields/{$field->id}"),
            array_merge($this->payload, ['name' => 'Actualizada por operador'])
        )->assertRedirect();

        $this->actingAs($operator)->delete($this->tenantUrl($tenant, "fields/{$field->id}"))
            ->assertForbidden();
        $this->assertDatabaseHas('fields', ['id' => $field->id]);
    }

    public function test_users_cannot_edit_or_delete_a_field_belonging_to_another_tenant(): void
    {
        $tenantA = $this->createTenant(['slug' => 'tenant-a']);
        $tenantB = $this->createTenant(['slug' => 'tenant-b']);
        $adminA = $this->createTenantUser($tenantA, 'admin');
        $fieldB = Field::create(array_merge($this->payload, ['tenant_id' => $tenantB->id]));

        $this->actingAs($adminA)->put(
            $this->tenantUrl($tenantA, "fields/{$fieldB->id}"),
            $this->payload
        )->assertNotFound();

        $this->actingAs($adminA)->delete($this->tenantUrl($tenantA, "fields/{$fieldB->id}"))
            ->assertNotFound();

        $this->assertDatabaseHas('fields', ['id' => $fieldB->id, 'tenant_id' => $tenantB->id]);
    }
}
