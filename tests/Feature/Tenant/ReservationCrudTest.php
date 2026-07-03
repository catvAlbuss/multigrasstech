<?php

declare(strict_types=1);

namespace Tests\Feature\Tenant;

use App\Models\Field;
use App\Models\Reservation;

class ReservationCrudTest extends TenantTestCase
{
    private function fieldPayload(): array
    {
        return [
            'name' => 'Cancha 1',
            'surface_type' => 'grass',
            'capacity' => 10,
            'hourly_rate' => 50,
            'status' => 'active',
        ];
    }

    public function test_admin_can_create_a_reservation(): void
    {
        $tenant = $this->createTenant();
        $admin = $this->createTenantUser($tenant, 'admin');
        $field = Field::create(array_merge($this->fieldPayload(), ['tenant_id' => $tenant->id]));

        $response = $this->actingAs($admin)->post($this->tenantUrl($tenant, 'reservations'), [
            'field_id' => $field->id,
            'date' => now()->addDay()->toDateString(),
            'start_time' => '10:00',
            'end_time' => '11:00',
            'status' => 'pending',
            'amount' => 50,
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('reservations', ['field_id' => $field->id, 'tenant_id' => $tenant->id]);
    }

    public function test_admin_can_create_a_reservation_when_field_id_is_submitted_as_a_string(): void
    {
        $tenant = $this->createTenant();
        $admin = $this->createTenantUser($tenant, 'admin');
        $field = Field::create(array_merge($this->fieldPayload(), ['tenant_id' => $tenant->id]));

        $response = $this->actingAs($admin)->post($this->tenantUrl($tenant, 'reservations'), [
            'field_id' => (string) $field->id,
            'date' => now()->addDay()->toDateString(),
            'start_time' => '10:00',
            'end_time' => '11:00',
            'status' => 'pending',
            'amount' => '50',
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('reservations', ['field_id' => $field->id, 'tenant_id' => $tenant->id]);
    }

    public function test_overlapping_reservations_are_rejected(): void
    {
        $tenant = $this->createTenant();
        $admin = $this->createTenantUser($tenant, 'admin');
        $field = Field::create(array_merge($this->fieldPayload(), ['tenant_id' => $tenant->id]));

        Reservation::create([
            'tenant_id' => $tenant->id,
            'field_id' => $field->id,
            'date' => '2026-08-01',
            'start_time' => '10:00',
            'end_time' => '11:00',
            'status' => 'confirmed',
            'amount' => 50,
        ]);

        $response = $this->actingAs($admin)->post($this->tenantUrl($tenant, 'reservations'), [
            'field_id' => $field->id,
            'date' => '2026-08-01',
            'start_time' => '10:30',
            'end_time' => '11:30',
            'status' => 'pending',
            'amount' => 50,
        ]);

        $response->assertSessionHasErrors(['start_time']);
    }

    public function test_admin_can_approve_reject_and_delete_a_reservation(): void
    {
        $tenant = $this->createTenant();
        $admin = $this->createTenantUser($tenant, 'admin');
        $field = Field::create(array_merge($this->fieldPayload(), ['tenant_id' => $tenant->id]));
        $reservation = Reservation::create([
            'tenant_id' => $tenant->id,
            'field_id' => $field->id,
            'date' => '2026-08-01',
            'start_time' => '10:00',
            'end_time' => '11:00',
            'status' => 'pending',
            'amount' => 50,
        ]);

        $this->actingAs($admin)->patch($this->tenantUrl($tenant, "reservations/{$reservation->id}/approve"))
            ->assertRedirect();
        $this->assertDatabaseHas('reservations', ['id' => $reservation->id, 'status' => 'confirmed']);

        $this->actingAs($admin)->patch($this->tenantUrl($tenant, "reservations/{$reservation->id}/reject"))
            ->assertRedirect();
        $this->assertDatabaseHas('reservations', ['id' => $reservation->id, 'status' => 'cancelled']);

        $this->actingAs($admin)->delete($this->tenantUrl($tenant, "reservations/{$reservation->id}"))
            ->assertRedirect();
        $this->assertDatabaseMissing('reservations', ['id' => $reservation->id]);
    }

    public function test_viewer_cannot_mutate_reservations(): void
    {
        $tenant = $this->createTenant();
        $viewer = $this->createTenantUser($tenant, 'viewer');
        $field = Field::create(array_merge($this->fieldPayload(), ['tenant_id' => $tenant->id]));
        $reservation = Reservation::create([
            'tenant_id' => $tenant->id,
            'field_id' => $field->id,
            'date' => '2026-08-01',
            'start_time' => '10:00',
            'end_time' => '11:00',
            'status' => 'pending',
            'amount' => 50,
        ]);

        $this->actingAs($viewer)->patch($this->tenantUrl($tenant, "reservations/{$reservation->id}/approve"))
            ->assertForbidden();
        $this->actingAs($viewer)->delete($this->tenantUrl($tenant, "reservations/{$reservation->id}"))
            ->assertForbidden();
    }

    public function test_operator_can_manage_reservations_fully(): void
    {
        $tenant = $this->createTenant();
        $operator = $this->createTenantUser($tenant, 'operator');
        $field = Field::create(array_merge($this->fieldPayload(), ['tenant_id' => $tenant->id]));
        $reservation = Reservation::create([
            'tenant_id' => $tenant->id,
            'field_id' => $field->id,
            'date' => '2026-08-01',
            'start_time' => '10:00',
            'end_time' => '11:00',
            'status' => 'pending',
            'amount' => 50,
        ]);

        $this->actingAs($operator)->patch($this->tenantUrl($tenant, "reservations/{$reservation->id}/approve"))
            ->assertRedirect();
        $this->actingAs($operator)->delete($this->tenantUrl($tenant, "reservations/{$reservation->id}"))
            ->assertRedirect();
        $this->assertDatabaseMissing('reservations', ['id' => $reservation->id]);
    }

    public function test_a_reservation_cannot_be_created_for_a_field_belonging_to_another_tenant(): void
    {
        $tenantA = $this->createTenant(['slug' => 'tenant-a']);
        $tenantB = $this->createTenant(['slug' => 'tenant-b']);
        $adminA = $this->createTenantUser($tenantA, 'admin');
        $fieldB = Field::create(array_merge($this->fieldPayload(), ['tenant_id' => $tenantB->id]));

        $response = $this->actingAs($adminA)->post($this->tenantUrl($tenantA, 'reservations'), [
            'field_id' => $fieldB->id,
            'date' => now()->addDay()->toDateString(),
            'start_time' => '10:00',
            'end_time' => '11:00',
            'status' => 'pending',
            'amount' => 50,
        ]);

        $response->assertSessionHasErrors(['field_id']);
    }

    public function test_users_cannot_access_a_reservation_belonging_to_another_tenant(): void
    {
        $tenantA = $this->createTenant(['slug' => 'tenant-a']);
        $tenantB = $this->createTenant(['slug' => 'tenant-b']);
        $adminA = $this->createTenantUser($tenantA, 'admin');
        $fieldB = Field::create(array_merge($this->fieldPayload(), ['tenant_id' => $tenantB->id]));
        $reservationB = Reservation::create([
            'tenant_id' => $tenantB->id,
            'field_id' => $fieldB->id,
            'date' => '2026-08-01',
            'start_time' => '10:00',
            'end_time' => '11:00',
            'status' => 'pending',
            'amount' => 50,
        ]);

        $this->actingAs($adminA)->patch($this->tenantUrl($tenantA, "reservations/{$reservationB->id}/approve"))
            ->assertNotFound();
        $this->actingAs($adminA)->delete($this->tenantUrl($tenantA, "reservations/{$reservationB->id}"))
            ->assertNotFound();

        $this->assertDatabaseHas('reservations', ['id' => $reservationB->id, 'status' => 'pending']);
    }
}
