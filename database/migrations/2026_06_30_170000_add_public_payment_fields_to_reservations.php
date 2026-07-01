<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('reservations', function (Blueprint $table) {
            $table->string('payment_method', 20)->nullable()->after('amount');
            $table->decimal('advance_amount', 10, 2)->default(0)->after('payment_method');
            $table->string('payment_operation_number', 80)->nullable()->after('advance_amount');
            $table->timestamp('payment_expires_at')->nullable()->after('payment_operation_number');
        });
    }

    public function down(): void
    {
        Schema::table('reservations', function (Blueprint $table) {
            $table->dropColumn([
                'payment_method',
                'advance_amount',
                'payment_operation_number',
                'payment_expires_at',
            ]);
        });
    }
};
