<?php

namespace Tests\Feature\Admin;

use App\Http\Controllers\Admin\TenantController;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class TenantActivationTest extends TestCase
{
    use RefreshDatabase;

    protected function tearDown(): void
    {
        config()->set('session.driver', 'array');

        parent::tearDown();
    }

    public function test_deactivating_a_tenant_invalidates_its_user_sessions(): void
    {
        config()->set('session.driver', 'database');

        $tenant = Tenant::create([
            'name' => 'Empresa activa',
            'slug' => 'empresa-activa',
            'plan' => 'basic',
            'is_active' => true,
        ]);
        $user = User::factory()->create([
            'tenant_id' => $tenant->id,
            'remember_token' => 'remember-me',
        ]);

        DB::table('sessions')->insert([
            'id' => 'tenant-session',
            'user_id' => $user->id,
            'payload' => 'payload',
            'last_activity' => now()->timestamp,
        ]);

        (new TenantController)->toggle($tenant);

        $this->assertFalse($tenant->fresh()->is_active);
        $this->assertNull($user->fresh()->remember_token);
        $this->assertDatabaseMissing('sessions', ['id' => 'tenant-session']);
    }
}
