<?php

declare(strict_types=1);

use App\Http\Controllers\AttendanceController;
use App\Http\Controllers\CajaController;
use App\Http\Controllers\ClientController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\FieldController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\PublicCalendarController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\ReservationController;
use App\Http\Controllers\Settings\LandingController;
use App\Http\Controllers\StaffController;
use App\Http\Controllers\TransactionController;
use App\Http\Controllers\WelcomeController;
use App\Http\Middleware\RedirectSuperAdminToCentral;
use App\Http\Middleware\SetPermissionsTeamId;
use Illuminate\Support\Facades\Route;
use Stancl\Tenancy\Middleware\InitializeTenancyBySubdomain;

/*
|--------------------------------------------------------------------------
| Tenant Routes
|--------------------------------------------------------------------------
|
| All routes here are scoped to the tenant identified by subdomain.
| Example: empresa1.multigrass.test
|
| Middleware stack:
|   1. InitializeTenancyBySubdomain  → resolves tenant from subdomain
|   2. PreventAccessFromCentralDomains → blocks direct access from main domain
|   3. SetPermissionsTeamId          → scopes Spatie roles to current tenant
|
*/

Route::middleware([
    'web',
    InitializeTenancyBySubdomain::class,
    'tenant.active',
    SetPermissionsTeamId::class,
    RedirectSuperAdminToCentral::class,
])->group(function () {

    // Shadows web.php's home route on tenant subdomains.
    // WelcomeController::index checks tenancy()->initialized and redirects accordingly.
    Route::get('/', [WelcomeController::class, 'index'])->name('home');

    // Public JSON endpoint for availability calendar (no auth required)
    Route::get('/calendar', [PublicCalendarController::class, 'index'])
        ->middleware('throttle:60,1')
        ->name('public.calendar');
    Route::get('/calendar/day', [PublicCalendarController::class, 'day'])
        ->middleware('throttle:60,1')
        ->name('public.calendar.day');
    Route::post('/reservations/public', [ReservationController::class, 'publicStore'])
        ->middleware('throttle:20,1')
        ->name('reservations.public-store');
    Route::get('/reservations/public/availability', [ReservationController::class, 'publicAvailability'])
        ->middleware('throttle:60,1')
        ->name('reservations.public-availability');
    Route::get('/reservations/public/document-lookup', [ReservationController::class, 'publicDocumentLookup'])
        ->middleware('throttle:10,1')
        ->name('reservations.public-document-lookup');
    Route::post('/reservations/public/assistant-reply', [ReservationController::class, 'publicAssistantReply'])
        ->middleware('throttle:15,1')
        ->name('reservations.public-assistant-reply');

    // Authenticated + verified tenant routes
    Route::middleware(['auth', 'verified'])->group(function () {
        Route::get('/dashboard', [DashboardController::class, 'index'])->name('tenant.dashboard');

        // --- Caja ---
        Route::get('caja', [CajaController::class, 'index'])->name('caja.index');
        Route::post('caja/checkout', [CajaController::class, 'checkout'])->name('caja.checkout');
        Route::post('caja/reservation-payment', [CajaController::class, 'reservationPayment'])->name('caja.reservation-payment');
        Route::post('caja/expense', [CajaController::class, 'expense'])->name('caja.expense');

        // --- Campos deportivos ---
        Route::resource('fields', FieldController::class)->except(['show']);

        // --- Clientes ---
        Route::get('clients/document-lookup', [ClientController::class, 'documentLookup'])
            ->middleware('throttle:20,1')
            ->name('clients.document-lookup');
        Route::resource('clients', ClientController::class)->except(['show']);

        // --- Reservaciones ---
        Route::get('reservations/availability', [ReservationController::class, 'availability'])->name('reservations.availability');
        Route::get('reservations/calendar-summary', [ReservationController::class, 'calendarSummary'])->name('reservations.calendar-summary');
        Route::patch('reservations/{reservation}/approve', [ReservationController::class, 'approve'])->name('reservations.approve');
        Route::patch('reservations/{reservation}/reject', [ReservationController::class, 'reject'])->name('reservations.reject');
        Route::post('reservations/charge', [ReservationController::class, 'storeAndCharge'])->name('reservations.charge');
        Route::resource('reservations', ReservationController::class)->except(['show', 'create']);

        // --- Asistencia ---
        Route::get('attendance', [AttendanceController::class, 'index'])->name('attendance.index');
        Route::get('attendance/create', [AttendanceController::class, 'create'])->name('attendance.create');
        Route::post('attendance', [AttendanceController::class, 'store'])->name('attendance.store');
        Route::patch('attendance/{attendance}', [AttendanceController::class, 'update'])->name('attendance.update');
        Route::delete('attendance/{attendance}', [AttendanceController::class, 'destroy'])->name('attendance.destroy');

        // --- Productos ---
        Route::resource('products', ProductController::class)->except(['show']);

        // --- Reportes ---
        Route::get('reports', [ReportController::class, 'index'])->name('reports.index');
        Route::get('reports/n8n', [ReportController::class, 'n8n'])->name('reports.n8n');
        Route::get('reports/pdf', [ReportController::class, 'exportPdf'])->name('reports.pdf');

        // --- Personal de Trabajo, Finanzas y Configuración (Solo Admin) ---
        Route::middleware(['role:admin'])->group(function () {
            Route::resource('staff', StaffController::class)->except(['create', 'show', 'edit']);

            // --- Finanzas (Ingresos y Gastos) ---
            Route::resource('transactions', TransactionController::class)->except(['show']);

            // --- Página web / Landing settings ---
            Route::get('settings/landing', [LandingController::class, 'edit'])->name('landing.edit');
            Route::post('settings/landing', [LandingController::class, 'update'])->name('landing.update');
            Route::delete('settings/landing/media/{media}', [LandingController::class, 'deleteMedia'])->name('landing.delete-media');
        });
    });

});
