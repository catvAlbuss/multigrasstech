<?php

declare(strict_types=1);

namespace Tests\Feature\Tenant;

use App\Models\TenantProfile;
use Illuminate\Http\UploadedFile;

class LandingSettingsTest extends TenantTestCase
{
    private array $payload = [
        'tagline' => 'La mejor cancha de la ciudad',
        'description' => 'Complejo deportivo con canchas de futbol y voley.',
        'phone' => '999999999',
        'address' => 'Av. Principal 123',
        'email' => 'contacto@grassverde.com',
        'show_calendar' => true,
        'booking_start_time' => '06:00',
        'booking_end_time' => '23:00',
    ];

    public function test_admin_can_view_and_update_landing_settings(): void
    {
        $tenant = $this->createTenant();
        $admin = $this->createTenantUser($tenant, 'admin');

        $this->actingAs($admin)->get($this->tenantUrl($tenant, 'settings/landing'))->assertOk();

        $response = $this->actingAs($admin)->post($this->tenantUrl($tenant, 'settings/landing'), $this->payload);

        $response->assertRedirect();
        $this->assertDatabaseHas('tenant_profiles', [
            'tenant_id' => $tenant->id,
            'tagline' => 'La mejor cancha de la ciudad',
        ]);
    }

    public function test_admin_can_upload_and_delete_hero_images(): void
    {
        $tenant = $this->createTenant();
        $admin = $this->createTenantUser($tenant, 'admin');

        $response = $this->actingAs($admin)->post($this->tenantUrl($tenant, 'settings/landing'), array_merge(
            $this->payload,
            ['hero_images' => [UploadedFile::fake()->image('hero.jpg')]]
        ));
        $response->assertRedirect();

        $profile = TenantProfile::where('tenant_id', $tenant->id)->firstOrFail();
        $media = $profile->getFirstMedia('hero');
        $this->assertNotNull($media);

        $this->actingAs($admin)->delete($this->tenantUrl($tenant, "settings/landing/media/{$media->id}"))
            ->assertRedirect();
        $this->assertDatabaseMissing('media', ['id' => $media->id]);
    }

    public function test_admin_cannot_delete_media_belonging_to_another_tenant(): void
    {
        $tenantA = $this->createTenant(['slug' => 'tenant-a']);
        $tenantB = $this->createTenant(['slug' => 'tenant-b']);
        $adminA = $this->createTenantUser($tenantA, 'admin');
        $adminB = $this->createTenantUser($tenantB, 'admin');

        $this->actingAs($adminB)->post($this->tenantUrl($tenantB, 'settings/landing'), array_merge(
            $this->payload,
            ['hero_images' => [UploadedFile::fake()->image('hero.jpg')]]
        ));
        $profileB = TenantProfile::where('tenant_id', $tenantB->id)->firstOrFail();
        $mediaB = $profileB->getFirstMedia('hero');

        $this->actingAs($adminA)->delete($this->tenantUrl($tenantA, "settings/landing/media/{$mediaB->id}"))
            ->assertNotFound();

        $this->assertDatabaseHas('media', ['id' => $mediaB->id]);
    }

    public function test_operator_and_viewer_cannot_access_landing_settings(): void
    {
        $tenant = $this->createTenant();
        $operator = $this->createTenantUser($tenant, 'operator');
        $viewer = $this->createTenantUser($tenant, 'viewer');

        $this->actingAs($operator)->get($this->tenantUrl($tenant, 'settings/landing'))->assertForbidden();
        $this->actingAs($viewer)->get($this->tenantUrl($tenant, 'settings/landing'))->assertForbidden();
    }

    public function test_updating_landing_settings_requires_valid_booking_hours(): void
    {
        $tenant = $this->createTenant();
        $admin = $this->createTenantUser($tenant, 'admin');

        $response = $this->actingAs($admin)->post($this->tenantUrl($tenant, 'settings/landing'), array_merge(
            $this->payload,
            ['booking_start_time' => '23:00', 'booking_end_time' => '06:00']
        ));

        $response->assertSessionHasErrors(['booking_end_time']);
    }
}
