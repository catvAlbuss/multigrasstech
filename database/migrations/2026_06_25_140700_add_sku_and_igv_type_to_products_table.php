<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Guarded with hasColumn(): some environments already had these columns
        // added out-of-band (manually) before this migration existed.
        Schema::table('products', function (Blueprint $table) {
            if (! Schema::hasColumn('products', 'sku')) {
                $table->string('sku')->nullable()->after('name');
            }

            if (! Schema::hasColumn('products', 'igv_type')) {
                $table->enum('igv_type', ['gravado', 'exonerado', 'inafecto'])->default('gravado')->after('is_active');
            }
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn(array_filter(['sku', 'igv_type'], fn ($column) => Schema::hasColumn('products', $column)));
        });
    }
};
