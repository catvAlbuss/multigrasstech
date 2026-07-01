<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Guarded with hasTable(): some environments already had this table
        // created out-of-band before this migration existed.
        if (Schema::hasTable('sales')) {
            return;
        }

        Schema::create('sales', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('tenant_id')->nullable()->index();
            $table->foreign('tenant_id')->references('id')->on('tenants')->nullOnDelete();
            $table->string('sale_number');
            $table->enum('document_type', ['boleta', 'factura']);
            $table->enum('customer_doc_type', ['dni', 'ruc', 'pasaporte', 'sin_documento']);
            $table->string('customer_doc_number')->nullable();
            $table->string('customer_name');
            $table->string('customer_address', 500)->nullable();
            $table->string('customer_email')->nullable();
            $table->boolean('igv_applied')->default(false);
            $table->decimal('subtotal', 10, 2)->default(0);
            $table->decimal('igv_amount', 10, 2)->default(0);
            $table->decimal('total', 10, 2)->default(0);
            $table->decimal('payment_amount', 10, 2)->default(0);
            $table->decimal('change_amount', 10, 2)->default(0);
            $table->text('notes')->nullable();
            $table->enum('status', ['completed', 'cancelled'])->default('completed');
            $table->timestamp('sold_at')->nullable();
            $table->timestamps();

            $table->index(['tenant_id', 'document_type']);
            $table->index('sold_at');
            $table->unique(['tenant_id', 'sale_number']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sales');
    }
};
