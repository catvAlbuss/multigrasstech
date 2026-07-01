<?php

declare(strict_types=1);

namespace App\Actions\Tenancy;

use App\Models\Tenant;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

/**
 * Creates the admin/operator/viewer roles for a tenant and grants each role
 * its permission set. Runs both from the DatabaseSeeder (dev/example tenant)
 * and from the TenantCreated event listener, so every tenant — seeded or
 * created via the admin panel — is immediately ready to manage staff.
 */
class ProvisionTenantRoles
{
    /** @var array<string, list<string>> */
    private const ROLE_PERMISSIONS = [
        'admin' => [
            'manage-fields', 'delete-fields',
            'manage-clients', 'delete-clients',
            'manage-products', 'delete-products',
            'manage-reservations',
            'manage-attendance',
            'manage-caja',
            'manage-transactions',
            'manage-staff',
            'manage-landing',
        ],
        'operator' => [
            'manage-fields',
            'manage-clients',
            'manage-products',
            'manage-reservations',
            'manage-attendance',
            'manage-caja',
        ],
        'viewer' => [],
    ];

    public function handle(Tenant $tenant): void
    {
        $this->ensurePermissionsExist();

        $previousTeamId = getPermissionsTeamId();
        setPermissionsTeamId($tenant->id);

        foreach (self::ROLE_PERMISSIONS as $roleName => $permissions) {
            $role = Role::firstOrCreate(['name' => $roleName, 'guard_name' => 'web']);
            $role->syncPermissions($permissions);
        }

        setPermissionsTeamId($previousTeamId);
        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }

    private function ensurePermissionsExist(): void
    {
        collect(self::ROLE_PERMISSIONS)
            ->flatten()
            ->unique()
            ->each(fn (string $permission) => Permission::firstOrCreate([
                'name' => $permission,
                'guard_name' => 'web',
            ]));
    }
}
