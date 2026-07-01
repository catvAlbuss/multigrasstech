<?php

use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\PlanController;
use App\Http\Controllers\Admin\TenantController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'superadmin'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');

    Route::resource('tenants', TenantController::class)->except(['show']);
    Route::patch('tenants/{tenant}/toggle', [TenantController::class, 'toggle'])->name('tenants.toggle');
    Route::resource('plans', PlanController::class)->except(['show']);
});
