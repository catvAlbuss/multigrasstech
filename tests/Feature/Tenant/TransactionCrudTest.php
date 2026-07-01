<?php

declare(strict_types=1);

namespace Tests\Feature\Tenant;

use App\Models\Transaction;

class TransactionCrudTest extends TenantTestCase
{
    private array $payload = [
        'type' => 'expense',
        'category' => 'servicios',
        'description' => 'Pago de luz',
        'amount' => 120.50,
        'date' => '2026-07-01',
    ];

    public function test_admin_can_create_a_transaction(): void
    {
        $tenant = $this->createTenant();
        $admin = $this->createTenantUser($tenant, 'admin');

        $response = $this->actingAs($admin)->post($this->tenantUrl($tenant, 'transactions'), $this->payload);

        $response->assertRedirect();
        $this->assertDatabaseHas('transactions', ['description' => 'Pago de luz', 'tenant_id' => $tenant->id]);
    }

    public function test_admin_can_update_and_delete_a_transaction(): void
    {
        $tenant = $this->createTenant();
        $admin = $this->createTenantUser($tenant, 'admin');
        $transaction = Transaction::create(array_merge($this->payload, ['tenant_id' => $tenant->id]));

        $this->actingAs($admin)->put(
            $this->tenantUrl($tenant, "transactions/{$transaction->id}"),
            array_merge($this->payload, ['description' => 'Pago de agua'])
        )->assertRedirect();
        $this->assertDatabaseHas('transactions', ['id' => $transaction->id, 'description' => 'Pago de agua']);

        $this->actingAs($admin)->delete($this->tenantUrl($tenant, "transactions/{$transaction->id}"))
            ->assertRedirect();
        $this->assertDatabaseMissing('transactions', ['id' => $transaction->id]);
    }

    public function test_operator_cannot_access_transactions_at_all(): void
    {
        $tenant = $this->createTenant();
        $operator = $this->createTenantUser($tenant, 'operator');
        $transaction = Transaction::create(array_merge($this->payload, ['tenant_id' => $tenant->id]));

        $this->actingAs($operator)->get($this->tenantUrl($tenant, 'transactions'))->assertForbidden();
        $this->actingAs($operator)->post($this->tenantUrl($tenant, 'transactions'), $this->payload)->assertForbidden();
        $this->actingAs($operator)->put($this->tenantUrl($tenant, "transactions/{$transaction->id}"), $this->payload)->assertForbidden();
        $this->actingAs($operator)->delete($this->tenantUrl($tenant, "transactions/{$transaction->id}"))->assertForbidden();
    }

    public function test_viewer_cannot_access_transactions_at_all(): void
    {
        $tenant = $this->createTenant();
        $viewer = $this->createTenantUser($tenant, 'viewer');

        $this->actingAs($viewer)->get($this->tenantUrl($tenant, 'transactions'))->assertForbidden();
    }

    public function test_users_cannot_access_a_transaction_belonging_to_another_tenant(): void
    {
        $tenantA = $this->createTenant(['slug' => 'tenant-a']);
        $tenantB = $this->createTenant(['slug' => 'tenant-b']);
        $adminA = $this->createTenantUser($tenantA, 'admin');
        $transactionB = Transaction::create(array_merge($this->payload, ['tenant_id' => $tenantB->id]));

        $this->actingAs($adminA)->put($this->tenantUrl($tenantA, "transactions/{$transactionB->id}"), $this->payload)
            ->assertNotFound();
        $this->actingAs($adminA)->delete($this->tenantUrl($tenantA, "transactions/{$transactionB->id}"))
            ->assertNotFound();

        $this->assertDatabaseHas('transactions', ['id' => $transactionB->id, 'tenant_id' => $tenantB->id]);
    }
}
