<?php

declare(strict_types=1);

namespace Tests\Feature\Tenant;

use App\Actions\Tenancy\ProvisionTenantRoles;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

abstract class TenantTestCase extends TestCase
{
    use RefreshDatabase;

    private static int $tenantSequence = 0;

    protected function setUp(): void
    {
        parent::setUp();

        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }

    protected function createTenant(array $attributes = []): Tenant
    {
        $slug = $attributes['slug'] ?? 'tenant-'.(++static::$tenantSequence);

        /** @var Tenant $tenant */
        $tenant = Tenant::create(array_merge([
            'name' => 'Tenant '.$slug,
            'slug' => $slug,
            'plan' => 'basic',
            'is_active' => true,
        ], $attributes));

        $tenant->domains()->create(['domain' => $slug]);

        // The TenantCreated listener already provisions roles/permissions, but tests
        // call this explicitly too so they don't depend on event-dispatch timing.
        (new ProvisionTenantRoles)->handle($tenant);

        return $tenant;
    }

    protected function createTenantUser(Tenant $tenant, string $role = 'admin', array $attributes = []): User
    {
        /** @var User $user */
        $user = User::factory()->create(array_merge([
            'tenant_id' => $tenant->id,
        ], $attributes));

        setPermissionsTeamId($tenant->id);
        $user->assignRole($role);

        return $user;
    }

    protected function tenantUrl(Tenant $tenant, string $path = ''): string
    {
        $domain = $tenant->domains()->first()->domain;

        return 'http://'.$domain.'.multigrass.test/'.ltrim($path, '/');
    }
}
