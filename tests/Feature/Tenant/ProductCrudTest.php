<?php

declare(strict_types=1);

namespace Tests\Feature\Tenant;

use App\Models\Product;
use App\Models\ProductVariant;

class ProductCrudTest extends TenantTestCase
{
    private array $payload = [
        'name' => 'Agua mineral',
        'category' => 'bebida',
        'is_active' => true,
        'igv_type' => 'gravado',
        'has_variants' => false,
        'sku' => 'AGU-001',
        'unit' => 'unidad',
        'stock' => 50,
        'price' => 3.5,
    ];

    public function test_admin_can_create_a_simple_product(): void
    {
        $tenant = $this->createTenant();
        $admin = $this->createTenantUser($tenant, 'admin');

        $response = $this->actingAs($admin)->post($this->tenantUrl($tenant, 'products'), $this->payload);

        $response->assertRedirect();
        $this->assertDatabaseHas('products', ['name' => 'Agua mineral', 'tenant_id' => $tenant->id]);
    }

    public function test_admin_can_create_a_product_with_variants(): void
    {
        $tenant = $this->createTenant();
        $admin = $this->createTenantUser($tenant, 'admin');

        $payload = array_merge($this->payload, [
            'has_variants' => true,
            'variants' => [
                ['label' => '355ml', 'unit' => 'unidad', 'price' => 2.5, 'stock' => 10],
                ['label' => '1.5L', 'unit' => 'unidad', 'price' => 5, 'stock' => 5],
            ],
        ]);

        $response = $this->actingAs($admin)->post($this->tenantUrl($tenant, 'products'), $payload);

        $response->assertRedirect();
        $product = Product::where('name', 'Agua mineral')->firstOrFail();
        $this->assertSame(2, $product->variants()->count());
        $this->assertDatabaseHas('product_variants', ['label' => '355ml', 'tenant_id' => $tenant->id]);
    }

    public function test_creating_a_product_requires_valid_data(): void
    {
        $tenant = $this->createTenant();
        $admin = $this->createTenantUser($tenant, 'admin');

        $response = $this->actingAs($admin)->post($this->tenantUrl($tenant, 'products'), [
            'name' => '',
            'category' => 'not-a-category',
            'igv_type' => 'gravado',
        ]);

        $response->assertSessionHasErrors(['name', 'category']);
    }

    public function test_admin_can_update_and_delete_a_product(): void
    {
        $tenant = $this->createTenant();
        $admin = $this->createTenantUser($tenant, 'admin');
        $product = Product::create(array_merge($this->payload, ['tenant_id' => $tenant->id]));

        $this->actingAs($admin)->put(
            $this->tenantUrl($tenant, "products/{$product->id}"),
            array_merge($this->payload, ['name' => 'Agua sin gas'])
        )->assertRedirect();
        $this->assertDatabaseHas('products', ['id' => $product->id, 'name' => 'Agua sin gas']);

        $this->actingAs($admin)->delete($this->tenantUrl($tenant, "products/{$product->id}"))
            ->assertRedirect();
        $this->assertDatabaseMissing('products', ['id' => $product->id]);
    }

    public function test_viewer_cannot_mutate_products(): void
    {
        $tenant = $this->createTenant();
        $viewer = $this->createTenantUser($tenant, 'viewer');
        $product = Product::create(array_merge($this->payload, ['tenant_id' => $tenant->id]));

        $this->actingAs($viewer)->post($this->tenantUrl($tenant, 'products'), $this->payload)
            ->assertForbidden();
        $this->actingAs($viewer)->put($this->tenantUrl($tenant, "products/{$product->id}"), $this->payload)
            ->assertForbidden();
        $this->actingAs($viewer)->delete($this->tenantUrl($tenant, "products/{$product->id}"))
            ->assertForbidden();
    }

    public function test_operator_cannot_delete_products(): void
    {
        $tenant = $this->createTenant();
        $operator = $this->createTenantUser($tenant, 'operator');
        $product = Product::create(array_merge($this->payload, ['tenant_id' => $tenant->id]));

        $this->actingAs($operator)->put($this->tenantUrl($tenant, "products/{$product->id}"), $this->payload)
            ->assertRedirect();
        $this->actingAs($operator)->delete($this->tenantUrl($tenant, "products/{$product->id}"))
            ->assertForbidden();
    }

    public function test_a_product_variant_cannot_be_updated_through_another_tenants_product(): void
    {
        $tenantA = $this->createTenant(['slug' => 'tenant-a']);
        $tenantB = $this->createTenant(['slug' => 'tenant-b']);
        $adminA = $this->createTenantUser($tenantA, 'admin');

        $productB = Product::create(array_merge($this->payload, ['has_variants' => true, 'tenant_id' => $tenantB->id]));
        $variantB = ProductVariant::create([
            'tenant_id' => $tenantB->id,
            'product_id' => $productB->id,
            'label' => '600ml',
            'unit' => 'unidad',
            'price' => 3,
            'stock' => 20,
        ]);

        // adminA cannot even reach productB's update route (route model binding is tenant-scoped).
        $response = $this->actingAs($adminA)->put(
            $this->tenantUrl($tenantA, "products/{$productB->id}"),
            array_merge($this->payload, [
                'has_variants' => true,
                'variants' => [['id' => $variantB->id, 'label' => 'hacked', 'unit' => 'unidad', 'price' => 1, 'stock' => 1]],
            ])
        );

        $response->assertNotFound();
        $this->assertDatabaseHas('product_variants', ['id' => $variantB->id, 'label' => '600ml']);
    }
}
