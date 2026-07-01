<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('clients', function (Blueprint $table) {
            $table->json('lookup_metadata')->nullable()->after('document_number');
            $table->unique(['tenant_id', 'document_type', 'document_number'], 'clients_tenant_document_unique');
        });
    }

    public function down(): void
    {
        Schema::table('clients', function (Blueprint $table) {
            $table->dropUnique('clients_tenant_document_unique');
            $table->dropColumn('lookup_metadata');
        });
    }
};
