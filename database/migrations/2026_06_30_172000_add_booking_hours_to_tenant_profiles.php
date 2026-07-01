<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tenant_profiles', function (Blueprint $table) {
            $table->time('booking_start_time')->default('06:00')->after('show_calendar');
            $table->time('booking_end_time')->default('23:00')->after('booking_start_time');
        });
    }

    public function down(): void
    {
        Schema::table('tenant_profiles', function (Blueprint $table) {
            $table->dropColumn(['booking_start_time', 'booking_end_time']);
        });
    }
};
