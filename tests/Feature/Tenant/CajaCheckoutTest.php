<?php

declare(strict_types=1);

namespace Tests\Feature\Tenant;

use App\Models\Product;

class CajaCheckoutTest extends TenantTestCase
{
    private function product(int $tenantId, array $overrides = []): Product
    {
        return Product::create(array_merge([
            'tenant_id' => $tenantId,
            'name' => 'Gatorade',
            'category' => 'bebida',
            'is_active' => true,
            'igv_type' => 'gravado',
            'sku' => 'GAT-001',
            'unit' => 'unidad',
            'stock' => 10,
            'price' => 5,
        ], $overrides));
    }

    public function test_admin_can_checkout_and_stock_decrements(): void
    {
        $tenant = $this->createTenant();
        $admin = $this->createTenantUser($tenant, 'admin');
        $product = $this->product($tenant->id);

        $response = $this->actingAs($admin)->postJson($this->tenantUrl($tenant, 'caja/checkout'), [
            'document_type' => 'boleta',
            'customer_doc_type' => 'sin_documento',
            'customer_name' => 'Cliente Mostrador',
            'igv_applied' => false,
            'payment_amount' => 10,
            'items' => [
                ['product_id' => $product->id, 'quantity' => 2],
            ],
        ]);

        $response->assertSuccessful();
        $response->assertJson(['success' => true]);
        $this->assertSame(8, $product->fresh()->stock);
        $this->assertDatabaseHas('sales', ['tenant_id' => $tenant->id, 'total' => 10]);
        $this->assertDatabaseHas('sale_items', ['product_id' => $product->id, 'quantity' => 2]);
    }

    public function test_checkout_fails_when_stock_is_insufficient(): void
    {
        $tenant = $this->createTenant();
        $admin = $this->createTenantUser($tenant, 'admin');
        $product = $this->product($tenant->id, ['stock' => 1]);

        $response = $this->actingAs($admin)->postJson($this->tenantUrl($tenant, 'caja/checkout'), [
            'document_type' => 'boleta',
            'customer_doc_type' => 'sin_documento',
            'customer_name' => 'Cliente Mostrador',
            'igv_applied' => false,
            'payment_amount' => 10,
            'items' => [
                ['product_id' => $product->id, 'quantity' => 5],
            ],
        ]);

        $response->assertStatus(422);
        $this->assertSame(1, $product->fresh()->stock);
        $this->assertDatabaseCount('sales', 0);
    }

    public function test_a_product_from_another_tenant_cannot_be_purchased(): void
    {
        $tenantA = $this->createTenant(['slug' => 'tenant-a']);
        $tenantB = $this->createTenant(['slug' => 'tenant-b']);
        $adminA = $this->createTenantUser($tenantA, 'admin');
        $productB = $this->product($tenantB->id);

        $response = $this->actingAs($adminA)->postJson($this->tenantUrl($tenantA, 'caja/checkout'), [
            'document_type' => 'boleta',
            'customer_doc_type' => 'sin_documento',
            'customer_name' => 'Cliente Mostrador',
            'igv_applied' => false,
            'payment_amount' => 10,
            'items' => [
                ['product_id' => $productB->id, 'quantity' => 1],
            ],
        ]);

        $response->assertStatus(422);
        $this->assertDatabaseCount('sales', 0);
        $this->assertSame(10, $productB->fresh()->stock);
    }

    public function test_viewer_cannot_checkout_or_register_expenses(): void
    {
        $tenant = $this->createTenant();
        $viewer = $this->createTenantUser($tenant, 'viewer');
        $product = $this->product($tenant->id);

        $this->actingAs($viewer)->postJson($this->tenantUrl($tenant, 'caja/checkout'), [
            'document_type' => 'boleta',
            'customer_doc_type' => 'sin_documento',
            'customer_name' => 'Cliente Mostrador',
            'igv_applied' => false,
            'payment_amount' => 10,
            'items' => [['product_id' => $product->id, 'quantity' => 1]],
        ])->assertForbidden();

        $this->actingAs($viewer)->post($this->tenantUrl($tenant, 'caja/expense'), [
            'category' => 'servicios',
            'description' => 'Gasto',
            'amount' => 5,
        ])->assertForbidden();
    }

    public function test_operator_can_checkout_and_register_expenses(): void
    {
        $tenant = $this->createTenant();
        $operator = $this->createTenantUser($tenant, 'operator');
        $product = $this->product($tenant->id);

        $this->actingAs($operator)->postJson($this->tenantUrl($tenant, 'caja/checkout'), [
            'document_type' => 'boleta',
            'customer_doc_type' => 'sin_documento',
            'customer_name' => 'Cliente Mostrador',
            'igv_applied' => false,
            'payment_amount' => 10,
            'items' => [['product_id' => $product->id, 'quantity' => 1]],
        ])->assertSuccessful();

        $this->actingAs($operator)->post($this->tenantUrl($tenant, 'caja/expense'), [
            'category' => 'servicios',
            'description' => 'Gasto',
            'amount' => 5,
        ])->assertRedirect();
    }
}
