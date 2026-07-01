<?php

use App\Http\Controllers\WelcomeController;
use Illuminate\Support\Facades\Route;
use Stancl\Tenancy\Middleware\InitializeTenancyBySubdomain;

Route::get('/', [WelcomeController::class, 'index'])
    ->middleware(InitializeTenancyBySubdomain::class)
    ->name('home');

require __DIR__.'/settings.php';
require __DIR__.'/admin.php';
