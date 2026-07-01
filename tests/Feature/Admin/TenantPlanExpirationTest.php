<?php

namespace Tests\Feature\Admin;

use App\Models\Plan;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TenantPlanExpirationTest extends TestCase
{
    use RefreshDatabase;

    public function test_monthly_plan_expiration_is_calculated_automatically(): void
    {
        $admin = User::factory()->create(['tenant_id' => null]);
        $plan = $this->createPlan('Mensual', 'monthly', 'monthly');
        $this->actingAs($admin);
        $expectedExpiration = now()->addMonthNoOverflow()->format('Y-m-d H:i');

        $this->post(route('admin.tenants.store'), [
            'name' => 'Empresa mensual',
            'slug' => 'empresa-mensual',
            'plan' => $plan->slug,
            'is_active' => true,
        ])->assertRedirect(route('admin.tenants.index'));

        $tenant = Tenant::where('slug', 'empresa-mensual')->firstOrFail();
        $this->assertSame($expectedExpiration, $tenant->plan_expires_at?->format('Y-m-d H:i'));
    }

    public function test_lifetime_plan_has_no_expiration(): void
    {
        $admin = User::factory()->create(['tenant_id' => null]);
        $plan = $this->createPlan('De por vida', 'lifetime', 'lifetime');
        $this->actingAs($admin);

        $this->post(route('admin.tenants.store'), [
            'name' => 'Empresa vitalicia',
            'slug' => 'empresa-vitalicia',
            'plan' => $plan->slug,
            'is_active' => true,
        ]);

        $this->assertNull(Tenant::where('slug', 'empresa-vitalicia')->firstOrFail()->plan_expires_at);
    }

    public function test_editing_other_data_does_not_extend_the_current_plan(): void
    {
        $admin = User::factory()->create(['tenant_id' => null]);
        $plan = $this->createPlan('Mensual', 'monthly', 'monthly');
        $tenant = Tenant::create([
            'name' => 'Empresa',
            'slug' => 'empresa',
            'plan' => $plan->slug,
            'plan_id' => $plan->id,
            'plan_expires_at' => '2026-07-10 08:00:00',
            'is_active' => true,
        ]);
        $this->actingAs($admin);

        $this->put(route('admin.tenants.update', $tenant), [
            'name' => 'Empresa actualizada',
            'plan' => $plan->slug,
            'is_active' => true,
        ]);

        $this->assertSame(
            '2026-07-10 08:00:00',
            $tenant->fresh()->plan_expires_at?->format('Y-m-d H:i:s'),
        );
    }

    private function createPlan(string $name, string $slug, string $period): Plan
    {
        return Plan::create([
            'name' => $name,
            'slug' => $slug,
            'billing_period' => $period,
            'is_active' => true,
            'sort_order' => 10,
        ]);
    }
}
