<?php

declare(strict_types=1);

namespace Tests\Feature\Public;

use App\Actions\Tenancy\ProvisionTenantRoles;
use App\Models\Field;
use App\Models\Reservation;
use App\Models\Tenant;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Tests\TestCase;

class ReservationBookingTest extends TestCase
{
    use RefreshDatabase;

    private function createTenant(): Tenant
    {
        $tenant = Tenant::create([
            'name' => 'GrassVerde',
            'slug' => 'grassverde',
            'plan' => 'basic',
            'is_active' => true,
        ]);
        $tenant->domains()->create(['domain' => 'grassverde']);
        (new ProvisionTenantRoles)->handle($tenant);

        return $tenant;
    }

    private function url(Tenant $tenant, string $path): string
    {
        return 'http://grassverde.multigrass.test/'.ltrim($path, '/');
    }

    public function test_public_availability_lists_open_slots_for_a_field(): void
    {
        $tenant = $this->createTenant();
        $field = Field::create([
            'tenant_id' => $tenant->id,
            'name' => 'Cancha 1',
            'surface_type' => 'grass',
            'capacity' => 10,
            'hourly_rate' => 50,
            'status' => 'active',
        ]);

        $response = $this->getJson($this->url($tenant, "reservations/public/availability?field_id={$field->id}&date=".now()->addDay()->toDateString()));

        $response->assertOk();
        $response->assertJsonStructure(['field', 'date', 'slots']);
    }

    public function test_a_guest_can_submit_a_public_booking_request(): void
    {
        $tenant = $this->createTenant();
        $field = Field::create([
            'tenant_id' => $tenant->id,
            'name' => 'Cancha 1',
            'surface_type' => 'grass',
            'capacity' => 10,
            'hourly_rate' => 100,
            'status' => 'active',
        ]);

        $response = $this->postJson($this->url($tenant, 'reservations/public'), [
            'client_name' => 'Juan Perez',
            'client_phone' => '999999999',
            'field_id' => $field->id,
            'date' => now()->addDay()->toDateString(),
            'start_time' => '10:00',
            'duration_hours' => 1,
            'payment_method' => 'yape',
            'advance_amount' => 50,
            'payment_operation_number' => 'OP-123456',
            'payment_proof' => UploadedFile::fake()->image('proof.jpg'),
        ]);

        $response->assertCreated();
        $this->assertDatabaseHas('reservations', [
            'tenant_id' => $tenant->id,
            'field_id' => $field->id,
            'status' => 'pending',
        ]);
        $this->assertDatabaseHas('clients', ['phone' => '999999999', 'tenant_id' => $tenant->id]);
    }

    public function test_public_booking_rejects_an_incorrect_advance_amount(): void
    {
        $tenant = $this->createTenant();
        $field = Field::create([
            'tenant_id' => $tenant->id,
            'name' => 'Cancha 1',
            'surface_type' => 'grass',
            'capacity' => 10,
            'hourly_rate' => 100,
            'status' => 'active',
        ]);

        $response = $this->postJson($this->url($tenant, 'reservations/public'), [
            'client_name' => 'Juan Perez',
            'client_phone' => '999999999',
            'field_id' => $field->id,
            'date' => now()->addDay()->toDateString(),
            'start_time' => '10:00',
            'duration_hours' => 1,
            'payment_method' => 'yape',
            'advance_amount' => 10,
            'payment_operation_number' => 'OP-123456',
            'payment_proof' => UploadedFile::fake()->image('proof.jpg'),
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['advance_amount']);
    }

    public function test_public_booking_rejects_overlapping_slots(): void
    {
        $tenant = $this->createTenant();
        $field = Field::create([
            'tenant_id' => $tenant->id,
            'name' => 'Cancha 1',
            'surface_type' => 'grass',
            'capacity' => 10,
            'hourly_rate' => 100,
            'status' => 'active',
        ]);
        Reservation::create([
            'tenant_id' => $tenant->id,
            'field_id' => $field->id,
            'date' => now()->addDay()->toDateString(),
            'start_time' => '10:00',
            'end_time' => '11:00',
            'status' => 'confirmed',
            'amount' => 100,
        ]);

        $response = $this->postJson($this->url($tenant, 'reservations/public'), [
            'client_name' => 'Juan Perez',
            'client_phone' => '999999999',
            'field_id' => $field->id,
            'date' => now()->addDay()->toDateString(),
            'start_time' => '10:00',
            'duration_hours' => 1,
            'payment_method' => 'yape',
            'advance_amount' => 50,
            'payment_operation_number' => 'OP-123456',
            'payment_proof' => UploadedFile::fake()->image('proof.jpg'),
        ]);

        $response->assertStatus(422);
    }

    public function test_a_field_from_another_tenant_cannot_be_booked(): void
    {
        $tenantA = $this->createTenant();
        $tenantB = Tenant::create(['name' => 'Otro', 'slug' => 'otroclub', 'plan' => 'basic', 'is_active' => true]);
        $tenantB->domains()->create(['domain' => 'otroclub']);
        (new ProvisionTenantRoles)->handle($tenantB);

        $fieldB = Field::create([
            'tenant_id' => $tenantB->id,
            'name' => 'Cancha de otro club',
            'surface_type' => 'grass',
            'capacity' => 10,
            'hourly_rate' => 100,
            'status' => 'active',
        ]);

        $response = $this->postJson($this->url($tenantA, 'reservations/public'), [
            'client_name' => 'Juan Perez',
            'client_phone' => '999999999',
            'field_id' => $fieldB->id,
            'date' => now()->addDay()->toDateString(),
            'start_time' => '10:00',
            'duration_hours' => 1,
            'payment_method' => 'yape',
            'advance_amount' => 50,
            'payment_operation_number' => 'OP-123456',
            'payment_proof' => UploadedFile::fake()->image('proof.jpg'),
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['field_id']);
    }

    public function test_public_booking_endpoint_is_rate_limited(): void
    {
        $tenant = $this->createTenant();
        $field = Field::create([
            'tenant_id' => $tenant->id,
            'name' => 'Cancha 1',
            'surface_type' => 'grass',
            'capacity' => 10,
            'hourly_rate' => 100,
            'status' => 'active',
        ]);

        $payload = [
            'client_name' => 'Juan Perez',
            'client_phone' => '999999999',
            'field_id' => $field->id,
            'date' => now()->addDay()->toDateString(),
            'start_time' => '10:00',
            'duration_hours' => 1,
            'payment_method' => 'yape',
            'advance_amount' => 999999,
            'payment_operation_number' => 'OP-123456',
            'payment_proof' => UploadedFile::fake()->image('proof.jpg'),
        ];

        // The throttle is keyed by IP; 21 requests should trip the `throttle:20,1` limiter
        // regardless of the (deliberately wrong) advance amount causing 422s along the way.
        for ($i = 0; $i < 20; $i++) {
            $this->postJson($this->url($tenant, 'reservations/public'), $payload);
        }

        $response = $this->postJson($this->url($tenant, 'reservations/public'), $payload);

        $response->assertStatus(429);
    }
}
