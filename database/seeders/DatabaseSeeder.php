<?php

namespace Database\Seeders;

use App\Actions\Tenancy\ProvisionTenantRoles;
use App\Models\Plan;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        $this->call(PlanSeeder::class);

        // ── Super Admin (plataforma, sin tenant) ──────────────────────────
        $superAdmin = User::firstOrCreate(
            ['email' => 'superadmin@multigrass.com'],
            [
                'name' => 'Super Admin',
                'password' => bcrypt('password'),
                'tenant_id' => null,
            ]
        );

        // team_id = 0 → rol global (sin tenant). Spatie teams requiere NOT NULL.
        setPermissionsTeamId(0);
        $superAdminRole = Role::firstOrCreate(['name' => 'super-admin', 'guard_name' => 'web']);
        $superAdmin->assignRole($superAdminRole);

        // ── Tenant de ejemplo: GrassVerde ─────────────────────────────────
        /** @var Tenant $tenant */
        $tenant = Tenant::firstOrCreate(
            ['slug' => 'grassverde'],
            [
                'name' => 'GrassVerde SAS',
                'email' => 'admin@grassverde.com',
                'plan' => 'basic',
                'is_active' => true,
            ]
        );

        $tenant->update([
            'plan_id' => Plan::where('slug', 'basic')->value('id'),
        ]);

        // Dominio para identificación por subdominio
        $tenant->domains()->firstOrCreate(['domain' => 'grassverde']);

        // Roles + permisos dentro del tenant (team = tenant). Se usa explícitamente porque
        // este seeder usa WithoutModelEvents, así que el listener de TenantCreated no dispara.
        (new ProvisionTenantRoles)->handle($tenant);
        setPermissionsTeamId($tenant->id);

        // Admin del tenant
        $adminUser = User::firstOrCreate(
            ['email' => 'admin@grassverde.com'],
            [
                'name' => 'Admin GrassVerde',
                'password' => bcrypt('password'),
                'tenant_id' => $tenant->id,
            ]
        );
        $adminUser->assignRole('admin');
        // Operador del tenant
        $operatorUser = User::firstOrCreate(
            ['email' => 'operador@grassverde.com'],
            [
                'name' => 'Operador GrassVerde',
                'password' => bcrypt('password'),
                'tenant_id' => $tenant->id,
            ]
        );
        $operatorUser->assignRole('operator');
    }
}
