<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('fields', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('tenant_id')->nullable()->index();
            $table->foreign('tenant_id')->references('id')->on('tenants')->nullOnDelete();
            $table->string('name');
            $table->text('description')->nullable();
            $table->enum('surface_type', ['artificial', 'grass', 'concrete', 'clay'])->default('artificial');
            $table->unsignedInteger('capacity')->default(0);
            $table->decimal('hourly_rate', 10, 2)->default(0);
            $table->enum('status', ['active', 'maintenance', 'inactive', 'blocked'])->default('active');
            $table->string('image_path')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('fields');
    }
};
