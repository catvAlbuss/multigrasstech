<?php

namespace Tests\Feature\Admin;

use App\Models\Plan;
use App\Models\Tenant;
use App\Models\User;
use Database\Seeders\PlanSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PlanCrudTest extends TestCase
{
    use RefreshDatabase;

    public function test_default_plans_are_seeded_and_legacy_tenants_are_linked(): void
    {
        $tenant = Tenant::create([
            'name' => 'Empresa existente',
            'slug' => 'empresa-existente',
            'plan' => 'pro',
            'is_active' => true,
        ]);

        $this->seed(PlanSeeder::class);

        $this->assertDatabaseHas('plans', ['slug' => 'basic', 'name' => 'Básico']);
        $this->assertDatabaseHas('plans', ['slug' => 'premium', 'name' => 'Premium']);
        $this->assertDatabaseHas('plans', ['slug' => 'contact', 'name' => 'Contáctenos']);
        $this->assertSame('premium', $tenant->fresh()->paymentPlan->slug);
    }

    public function test_super_admin_can_create_and_update_a_plan(): void
    {
        $admin = User::factory()->create(['tenant_id' => null]);

        $response = $this->actingAs($admin)->post(route('admin.plans.store'), [
            'name' => 'Premium',
            'slug' => 'premium',
            'description' => 'Plan premium',
            'price' => 79.90,
            'billing_period' => 'monthly',
            'is_active' => true,
            'sort_order' => 20,
        ]);

        $plan = Plan::where('slug', 'premium')->firstOrFail();
        $response->assertRedirect(route('admin.plans.index'));

        $response = $this->actingAs($admin)->put(route('admin.plans.update', $plan), [
            'name' => 'Premium anual',
            'slug' => 'premium',
            'description' => 'Plan premium anual',
            'price' => 799,
            'billing_period' => 'yearly',
            'is_active' => true,
            'sort_order' => 20,
        ]);

        $response->assertRedirect(route('admin.plans.index'));
        $this->assertDatabaseHas('plans', [
            'id' => $plan->id,
            'name' => 'Premium anual',
            'billing_period' => 'yearly',
        ]);
    }

    public function test_an_assigned_plan_can_not_be_deleted(): void
    {
        $admin = User::factory()->create(['tenant_id' => null]);
        $plan = Plan::create([
            'name' => 'Básico',
            'slug' => 'basic',
            'billing_period' => 'monthly',
            'is_active' => true,
            'sort_order' => 10,
        ]);
        Tenant::create([
            'name' => 'Empresa',
            'slug' => 'empresa',
            'plan' => $plan->slug,
            'plan_id' => $plan->id,
            'is_active' => true,
        ]);

        $response = $this->actingAs($admin)->delete(route('admin.plans.destroy', $plan));

        $response->assertSessionHas('error');
        $this->assertDatabaseHas('plans', ['id' => $plan->id]);
    }
}
