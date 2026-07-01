<?php

declare(strict_types=1);

namespace Tests\Feature\Tenant;

use App\Models\Attendance;
use App\Models\Client;

class AttendanceCrudTest extends TenantTestCase
{
    public function test_admin_can_register_attendance(): void
    {
        $tenant = $this->createTenant();
        $admin = $this->createTenantUser($tenant, 'admin');
        $client = Client::create(['name' => 'Cliente', 'is_active' => true, 'tenant_id' => $tenant->id]);

        $response = $this->actingAs($admin)->post($this->tenantUrl($tenant, 'attendance'), [
            'client_id' => $client->id,
            'date' => now()->toDateString(),
            'check_in' => '09:00',
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('attendance', ['client_id' => $client->id, 'tenant_id' => $tenant->id]);
    }

    public function test_a_client_from_another_tenant_cannot_be_used(): void
    {
        $tenantA = $this->createTenant(['slug' => 'tenant-a']);
        $tenantB = $this->createTenant(['slug' => 'tenant-b']);
        $adminA = $this->createTenantUser($tenantA, 'admin');
        $clientB = Client::create(['name' => 'Cliente B', 'is_active' => true, 'tenant_id' => $tenantB->id]);

        $response = $this->actingAs($adminA)->post($this->tenantUrl($tenantA, 'attendance'), [
            'client_id' => $clientB->id,
            'date' => now()->toDateString(),
            'check_in' => '09:00',
        ]);

        $response->assertSessionHasErrors(['client_id']);
    }

    public function test_admin_can_update_and_delete_attendance(): void
    {
        $tenant = $this->createTenant();
        $admin = $this->createTenantUser($tenant, 'admin');
        $attendance = Attendance::create([
            'tenant_id' => $tenant->id,
            'date' => now()->toDateString(),
            'check_in' => '09:00',
        ]);

        $this->actingAs($admin)->patch($this->tenantUrl($tenant, "attendance/{$attendance->id}"), [
            'check_out' => '10:00',
        ])->assertRedirect();
        $this->assertDatabaseHas('attendance', ['id' => $attendance->id, 'check_out' => '10:00']);

        $this->actingAs($admin)->delete($this->tenantUrl($tenant, "attendance/{$attendance->id}"))
            ->assertRedirect();
        $this->assertDatabaseMissing('attendance', ['id' => $attendance->id]);
    }

    public function test_viewer_cannot_mutate_attendance(): void
    {
        $tenant = $this->createTenant();
        $viewer = $this->createTenantUser($tenant, 'viewer');
        $attendance = Attendance::create([
            'tenant_id' => $tenant->id,
            'date' => now()->toDateString(),
            'check_in' => '09:00',
        ]);

        $this->actingAs($viewer)->post($this->tenantUrl($tenant, 'attendance'), [
            'date' => now()->toDateString(),
            'check_in' => '09:00',
        ])->assertForbidden();

        $this->actingAs($viewer)->delete($this->tenantUrl($tenant, "attendance/{$attendance->id}"))
            ->assertForbidden();
    }

    public function test_users_cannot_access_attendance_belonging_to_another_tenant(): void
    {
        $tenantA = $this->createTenant(['slug' => 'tenant-a']);
        $tenantB = $this->createTenant(['slug' => 'tenant-b']);
        $adminA = $this->createTenantUser($tenantA, 'admin');
        $attendanceB = Attendance::create([
            'tenant_id' => $tenantB->id,
            'date' => now()->toDateString(),
            'check_in' => '09:00',
        ]);

        $this->actingAs($adminA)->delete($this->tenantUrl($tenantA, "attendance/{$attendanceB->id}"))
            ->assertNotFound();

        $this->assertDatabaseHas('attendance', ['id' => $attendanceB->id]);
    }
}
