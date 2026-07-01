<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\Reservation;
use App\Models\Transaction;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class TransactionController extends Controller
{
    public function index(Request $request): Response
    {
        $tenantId = tenant('id');
        $startDate = $request->start_date ?? now()->startOfMonth()->toDateString();
        $endDate = $request->end_date ?? now()->endOfMonth()->toDateString();

        // 1. Totals
        $totalSales = DB::table('sales')
            ->where('tenant_id', $tenantId)
            ->where('status', 'completed')
            ->whereDate('sold_at', '>=', $startDate)
            ->whereDate('sold_at', '<=', $endDate)
            ->sum('total');

        $totalResv = DB::table('reservations')
            ->where('tenant_id', $tenantId)
            ->whereIn('status', ['confirmed', 'completed'])
            ->whereDate('date', '>=', $startDate)
            ->whereDate('date', '<=', $endDate)
            ->sum('amount');

        $totalExpenses = DB::table('transactions')
            ->where('tenant_id', $tenantId)
            ->where('type', 'expense')
            ->whereBetween('date', [$startDate, $endDate])
            ->sum('amount');

        $totalOtherIncome = DB::table('transactions')
            ->where('tenant_id', $tenantId)
            ->where('type', 'income')
            ->whereBetween('date', [$startDate, $endDate])
            ->sum('amount');

        $totalIncome = $totalSales + $totalResv + $totalOtherIncome;

        // 2. Top Products
        $topProducts = DB::table('sale_items')
            ->join('sales', 'sale_items.sale_id', '=', 'sales.id')
            ->join('products', 'sale_items.product_id', '=', 'products.id')
            ->where('sales.tenant_id', $tenantId)
            ->where('sales.status', 'completed')
            ->whereDate('sales.sold_at', '>=', $startDate)
            ->whereDate('sales.sold_at', '<=', $endDate)
            ->selectRaw('products.name, SUM(sale_items.quantity) as total_quantity, SUM(sale_items.total) as total_sales')
            ->groupBy('products.id', 'products.name')
            ->orderByDesc('total_sales')
            ->limit(5)
            ->get();

        // 3. Top Fields
        $topFields = DB::table('reservations')
            ->join('fields', 'reservations.field_id', '=', 'fields.id')
            ->where('reservations.tenant_id', $tenantId)
            ->whereIn('reservations.status', ['confirmed', 'completed'])
            ->whereDate('reservations.date', '>=', $startDate)
            ->whereDate('reservations.date', '<=', $endDate)
            ->selectRaw('fields.name, COUNT(reservations.id) as total_reservations, SUM(reservations.amount) as total_revenue')
            ->groupBy('fields.id', 'fields.name')
            ->orderByDesc('total_revenue')
            ->get();

        // 4. Top Expenses
        $topExpenses = Transaction::where('tenant_id', $tenantId)
            ->where('type', 'expense')
            ->whereBetween('date', [$startDate, $endDate])
            ->orderByDesc('amount')
            ->limit(6)
            ->get(['id', 'description', 'category', 'amount', 'date']);

        // 5. Top Clients
        $topClients = DB::table('reservations')
            ->join('clients', 'reservations.client_id', '=', 'clients.id')
            ->where('reservations.tenant_id', $tenantId)
            ->whereIn('reservations.status', ['confirmed', 'completed'])
            ->whereDate('reservations.date', '>=', $startDate)
            ->whereDate('reservations.date', '<=', $endDate)
            ->selectRaw('clients.name, COUNT(reservations.id) as total_reservations, SUM(reservations.amount) as total_spent')
            ->groupBy('clients.id', 'clients.name')
            ->orderByDesc('total_spent')
            ->limit(5)
            ->get();

        // 6. Busiest Hours (aggregated in PHP, not SQL, so this works on any DB driver)
        $reservationTimes = DB::table('reservations')
            ->where('tenant_id', $tenantId)
            ->whereIn('status', ['confirmed', 'completed'])
            ->whereDate('date', '>=', $startDate)
            ->whereDate('date', '<=', $endDate)
            ->get(['date', 'start_time']);

        $hourCounts = $reservationTimes->countBy(fn ($r) => (int) substr((string) $r->start_time, 0, 2));

        $busiestHours = collect(range(6, 23))->map(function ($hour) use ($hourCounts) {
            return [
                'name' => sprintf('%02d:00', $hour),
                'reservas' => (int) ($hourCounts[$hour] ?? 0),
            ];
        });

        // 7. Busiest Days (0 = Sunday ... 6 = Saturday, matching Carbon::dayOfWeek)
        $dayCounts = $reservationTimes->countBy(fn ($r) => Carbon::parse((string) $r->date)->dayOfWeek);

        $dayNames = [0 => 'Dom', 1 => 'Lun', 2 => 'Mar', 3 => 'Mié', 4 => 'Jue', 5 => 'Vie', 6 => 'Sáb'];
        // Reorder to start with Monday
        $busiestDays = collect([1, 2, 3, 4, 5, 6, 0])->map(function ($day) use ($dayCounts, $dayNames) {
            return [
                'name' => $dayNames[$day],
                'reservas' => (int) ($dayCounts[$day] ?? 0),
            ];
        });

        return Inertia::render('tenant/transactions/index', [
            'dashboard' => [
                'totals' => [
                    'income' => round((float) $totalIncome, 2),
                    'expense' => round((float) $totalExpenses, 2),
                    'balance' => round((float) ($totalIncome - $totalExpenses), 2),
                ],
                'topProducts' => $topProducts,
                'topFields' => $topFields,
                'topExpenses' => $topExpenses,
                'topClients' => $topClients,
                'busiestHours' => $busiestHours,
                'busiestDays' => $busiestDays,
            ],
            'filters' => [
                'start_date' => $startDate,
                'end_date' => $endDate,
            ],
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('tenant/transactions/create', [
            'reservations' => Reservation::orderByDesc('date')
                ->limit(50)
                ->get(['id', 'code', 'date']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'type' => ['required', 'in:income,expense'],
            'category' => ['required', 'string', 'max:50'],
            'description' => ['required', 'string', 'max:255'],
            'amount' => ['required', 'numeric', 'min:0.01'],
            'date' => ['required', 'date'],
            'reservation_id' => ['nullable', Rule::exists('reservations', 'id')->where('tenant_id', tenant('id'))],
            'notes' => ['nullable', 'string'],
        ]);

        Transaction::create($data);

        return redirect()->route('transactions.index')
            ->with('success', 'Transacción registrada correctamente.');
    }

    public function edit(Transaction $transaction): Response
    {
        return Inertia::render('tenant/transactions/edit', [
            'transaction' => $transaction,
            'reservations' => Reservation::orderByDesc('date')
                ->limit(50)
                ->get(['id', 'code', 'date']),
        ]);
    }

    public function update(Request $request, Transaction $transaction): RedirectResponse
    {
        $data = $request->validate([
            'type' => ['required', 'in:income,expense'],
            'category' => ['required', 'string', 'max:50'],
            'description' => ['required', 'string', 'max:255'],
            'amount' => ['required', 'numeric', 'min:0.01'],
            'date' => ['required', 'date'],
            'reservation_id' => ['nullable', Rule::exists('reservations', 'id')->where('tenant_id', tenant('id'))],
            'notes' => ['nullable', 'string'],
        ]);

        $transaction->update($data);

        return redirect()->route('transactions.index')
            ->with('success', 'Transacción actualizada correctamente.');
    }

    public function destroy(Transaction $transaction): RedirectResponse
    {
        $transaction->delete();

        return redirect()->route('transactions.index')
            ->with('success', 'Transacción eliminada correctamente.');
    }
}
