<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\Client;
use App\Models\Field;
use App\Models\Reservation;
use App\Models\Sale;
use App\Models\Transaction;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Http\Response as HttpResponse;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class ReportController extends Controller
{
    // ─── Constants ─────────────────────────────────────────────────────────────

    private const REPORT_TYPES = ['executive', 'sales', 'reservations', 'expenses'];

    // ─── Inertia Page ──────────────────────────────────────────────────────────

    public function index(Request $request): Response
    {
        $type  = $request->input('type', 'executive');
        $month = $request->input('month', now()->format('Y-m'));
        $week  = $request->input('week'); // ISO week e.g. "2026-W26"
        $docType = $request->input('doc_type', 'all'); // all | boleta | factura

        [$start, $end] = $this->resolvePeriod($month, $week);
        $tenantId = tenant('id');

        $data = match ($type) {
            'sales'        => $this->getSalesData($tenantId, $start, $end, $docType),
            'reservations' => $this->getReservationsData($tenantId, $start, $end),
            'expenses'     => $this->getExpensesData($tenantId, $start, $end),
            default        => $this->getExecutiveData($tenantId, $start, $end),
        };

        return Inertia::render('tenant/reports/index', [
            'reportType' => $type,
            'month'      => $month,
            'week'       => $week,
            'docType'    => $docType,
            'period'     => ['start' => $start->toDateString(), 'end' => $end->toDateString()],
            'reportData' => $data,
        ]);
    }

    public function n8n(): Response
    {
        return Inertia::render('tenant/reports/n8n');
    }

    // ─── PDF Export ────────────────────────────────────────────────────────────

    public function exportPdf(Request $request)
    {
        $type    = $request->input('type', 'executive');
        $month   = $request->input('month', now()->format('Y-m'));
        $week    = $request->input('week');
        $docType = $request->input('doc_type', 'all');

        [$start, $end] = $this->resolvePeriod($month, $week);
        $tenantId  = tenant('id');
        $tenantName = tenant('name') ?? tenant('id');

        $data = match ($type) {
            'sales'        => $this->getSalesData($tenantId, $start, $end, $docType),
            'reservations' => $this->getReservationsData($tenantId, $start, $end),
            'expenses'     => $this->getExpensesData($tenantId, $start, $end),
            default        => $this->getExecutiveData($tenantId, $start, $end),
        };

        $viewName = "reports.{$type}";
        $periodLabel = $week
            ? "Semana {$week}"
            : Carbon::parse($start)->locale('es')->isoFormat('MMMM YYYY');

        $pdf = Pdf::loadView($viewName, [
            'data'        => $data,
            'tenantName'  => $tenantName,
            'periodLabel' => $periodLabel,
            'period'      => ['start' => $start->toDateString(), 'end' => $end->toDateString()],
            'generatedAt' => now()->setTimezone('America/Lima')->format('d/m/Y H:i'),
            'docType'     => $docType,
        ])->setPaper('a4', 'portrait');

        $filename = "reporte_{$type}_{$start->format('Y-m-d')}.pdf";

        return $pdf->download($filename);
    }

    // ─── Period Helper ─────────────────────────────────────────────────────────

    /** Returns [Carbon $start, Carbon $end] for the given month or ISO week. */
    private function resolvePeriod(string $month, ?string $week): array
    {
        if ($week) {
            // Format: "2026-W26"
            $dt    = Carbon::now();
            [$y, $w] = explode('-W', $week);
            $start = Carbon::now()->setISODate((int)$y, (int)$w)->startOfDay();
            $end   = (clone $start)->addDays(6)->endOfDay();
        } else {
            [$year, $monthNum] = explode('-', $month);
            $start = Carbon::createFromDate((int)$year, (int)$monthNum, 1)->startOfDay();
            $end   = (clone $start)->endOfMonth()->endOfDay();
        }
        return [$start, $end];
    }

    // ─── Executive Summary ─────────────────────────────────────────────────────

    private function getExecutiveData(string|int $tenantId, Carbon $start, Carbon $end): array
    {
        // Totals
        $totalSales = (float) DB::table('sales')
            ->where('tenant_id', $tenantId)->where('status', 'completed')
            ->whereBetween('sold_at', [$start, $end])->sum('total');

        $totalResv = (float) DB::table('reservations')
            ->where('tenant_id', $tenantId)->whereIn('status', ['confirmed', 'completed'])
            ->whereBetween('date', [$start->toDateString(), $end->toDateString()])->sum('amount');

        $totalExpenses = (float) DB::table('transactions')
            ->where('tenant_id', $tenantId)->where('type', 'expense')
            ->whereBetween('date', [$start->toDateString(), $end->toDateString()])->sum('amount');

        $totalOtherIncome = (float) DB::table('transactions')
            ->where('tenant_id', $tenantId)->where('type', 'income')
            ->whereBetween('date', [$start->toDateString(), $end->toDateString()])->sum('amount');

        $totalIncome  = $totalSales + $totalResv + $totalOtherIncome;
        $totalBalance = $totalIncome - $totalExpenses;

        // Weekly breakdown (income vs expenses per week within the period)
        $weeks = $this->buildWeeklyBreakdown($tenantId, $start, $end);

        // Top products
        $topProducts = DB::table('sale_items')
            ->join('sales', 'sale_items.sale_id', '=', 'sales.id')
            ->where('sales.tenant_id', $tenantId)->where('sales.status', 'completed')
            ->whereBetween('sales.sold_at', [$start, $end])
            ->selectRaw('sale_items.product_name as name, SUM(sale_items.quantity) as total_qty, SUM(sale_items.total) as total_revenue')
            ->groupBy('sale_items.product_name')
            ->orderByDesc('total_revenue')->limit(5)->get()->toArray();

        // Top fields
        $topFields = DB::table('reservations')
            ->join('fields', 'reservations.field_id', '=', 'fields.id')
            ->where('reservations.tenant_id', $tenantId)->whereIn('reservations.status', ['confirmed', 'completed'])
            ->whereBetween('reservations.date', [$start->toDateString(), $end->toDateString()])
            ->selectRaw('fields.name, COUNT(reservations.id) as total_reservations, SUM(reservations.amount) as total_revenue')
            ->groupBy('fields.id', 'fields.name')->orderByDesc('total_revenue')->limit(5)->get()->toArray();

        // Top clients
        $topClients = DB::table('reservations')
            ->join('clients', 'reservations.client_id', '=', 'clients.id')
            ->where('reservations.tenant_id', $tenantId)->whereIn('reservations.status', ['confirmed', 'completed'])
            ->whereBetween('reservations.date', [$start->toDateString(), $end->toDateString()])
            ->selectRaw('clients.name, COUNT(reservations.id) as total_reservations, SUM(reservations.amount) as total_spent')
            ->groupBy('clients.id', 'clients.name')->orderByDesc('total_spent')->limit(5)->get()->toArray();

        // Busiest hours
        $busiestHours = DB::table('reservations')
            ->where('tenant_id', $tenantId)->whereIn('status', ['confirmed', 'completed'])
            ->whereBetween('date', [$start->toDateString(), $end->toDateString()])
            ->selectRaw('HOUR(start_time) as hour, COUNT(id) as count')
            ->groupBy('hour')->orderBy('hour')->get();

        $hoursData = collect(range(6, 22))->map(fn($h) => [
            'name'   => sprintf('%02d:00', $h),
            'reservas' => (int) ($busiestHours->firstWhere('hour', $h)?->count ?? 0),
        ])->values()->toArray();

        // Busiest days
        $busiestDaysRaw = DB::table('reservations')
            ->where('tenant_id', $tenantId)->whereIn('status', ['confirmed', 'completed'])
            ->whereBetween('date', [$start->toDateString(), $end->toDateString()])
            ->selectRaw('DAYOFWEEK(date) as day, COUNT(id) as count')
            ->groupBy('day')->get();

        $dayNames  = [1 => 'Dom', 2 => 'Lun', 3 => 'Mar', 4 => 'Mié', 5 => 'Jue', 6 => 'Vie', 7 => 'Sáb'];
        $daysData = collect([2, 3, 4, 5, 6, 7, 1])->map(fn($d) => [
            'name'   => $dayNames[$d],
            'reservas' => (int) ($busiestDaysRaw->firstWhere('day', $d)?->count ?? 0),
        ])->values()->toArray();

        // Category distribution
        $totalCat = $totalIncome ?: 1;
        $catDist = [
            ['label' => 'Reservaciones', 'amount' => $totalResv,       'pct' => round($totalResv / $totalCat * 100, 1)],
            ['label' => 'Ventas (Caja)', 'amount' => $totalSales,       'pct' => round($totalSales / $totalCat * 100, 1)],
            ['label' => 'Otros ingresos','amount' => $totalOtherIncome, 'pct' => round($totalOtherIncome / $totalCat * 100, 1)],
        ];

        // Unique clients
        $uniqueClients = DB::table('reservations')
            ->where('tenant_id', $tenantId)
            ->whereBetween('date', [$start->toDateString(), $end->toDateString()])
            ->whereNotNull('client_id')->distinct('client_id')->count('client_id');

        return compact(
            'totalIncome', 'totalExpenses', 'totalBalance', 'totalSales', 'totalResv',
            'totalOtherIncome', 'uniqueClients', 'weeks', 'topProducts',
            'topFields', 'topClients', 'hoursData', 'daysData', 'catDist'
        );
    }

    // ─── Sales Report ──────────────────────────────────────────────────────────

    private function getSalesData(string|int $tenantId, Carbon $start, Carbon $end, string $docType): array
    {
        $q = DB::table('sales')
            ->where('tenant_id', $tenantId)->where('status', 'completed')
            ->whereBetween('sold_at', [$start, $end]);

        if ($docType !== 'all') {
            $q->where('document_type', $docType);
        }

        $sales = $q->orderByDesc('sold_at')
            ->select('sale_number', 'document_type', 'customer_name', 'customer_doc_type',
                'customer_doc_number', 'subtotal', 'igv_amount', 'total', 'status', 'sold_at', 'id')
            ->get();

        $totalSales  = $sales->sum('total');
        $totalIgv    = $sales->sum('igv_amount');
        $totalSubtotal = $sales->sum('subtotal');
        $boletasCount  = $sales->where('document_type', 'boleta')->count();
        $facturasCount = $sales->where('document_type', 'factura')->count();

        // Top products in this period
        $topProductsQ = DB::table('sale_items')
            ->join('sales', 'sale_items.sale_id', '=', 'sales.id')
            ->where('sales.tenant_id', $tenantId)->where('sales.status', 'completed')
            ->whereBetween('sales.sold_at', [$start, $end]);

        if ($docType !== 'all') {
            $topProductsQ->where('sales.document_type', $docType);
        }

        $topProducts = $topProductsQ
            ->selectRaw('sale_items.product_name as name, SUM(sale_items.quantity) as total_qty, SUM(sale_items.total) as total_revenue')
            ->groupBy('sale_items.product_name')->orderByDesc('total_revenue')->limit(10)->get()->toArray();

        // Daily sales breakdown
        $dailySales = $sales->groupBy(fn($s) => Carbon::parse($s->sold_at)->format('Y-m-d'))
            ->map(fn($group) => ['date' => Carbon::parse($group->first()->sold_at)->format('d/m'), 'total' => $group->sum('total')])
            ->sortKeys()->values()->toArray();

        return compact(
            'sales', 'totalSales', 'totalIgv', 'totalSubtotal',
            'boletasCount', 'facturasCount', 'topProducts', 'dailySales', 'docType'
        );
    }

    // ─── Reservations Report ───────────────────────────────────────────────────

    private function getReservationsData(string|int $tenantId, Carbon $start, Carbon $end): array
    {
        $reservations = DB::table('reservations')
            ->leftJoin('fields', 'reservations.field_id', '=', 'fields.id')
            ->leftJoin('clients', 'reservations.client_id', '=', 'clients.id')
            ->where('reservations.tenant_id', $tenantId)
            ->whereBetween('reservations.date', [$start->toDateString(), $end->toDateString()])
            ->orderByDesc('reservations.date')
            ->selectRaw('reservations.code, reservations.date, reservations.start_time, reservations.end_time,
                reservations.status, reservations.amount, fields.name as field_name, clients.name as client_name')
            ->get();

        $totalRevenue  = $reservations->whereIn('status', ['confirmed', 'completed'])->sum('amount');
        $totalCount    = $reservations->count();
        $completedCount= $reservations->where('status', 'completed')->count();
        $cancelledCount= $reservations->where('status', 'cancelled')->count();
        $confirmedCount= $reservations->where('status', 'confirmed')->count();
        $pendingCount  = $reservations->where('status', 'pending')->count();
        $cancellationRate = $totalCount > 0 ? round($cancelledCount / $totalCount * 100, 1) : 0;

        $byStatus = [
            ['label' => 'Completadas',  'count' => $completedCount,  'pct' => $totalCount > 0 ? round($completedCount / $totalCount * 100) : 0,  'color' => '#3b82f6'],
            ['label' => 'Confirmadas',  'count' => $confirmedCount,  'pct' => $totalCount > 0 ? round($confirmedCount / $totalCount * 100) : 0,  'color' => '#22c55e'],
            ['label' => 'Pendientes',   'count' => $pendingCount,    'pct' => $totalCount > 0 ? round($pendingCount / $totalCount * 100) : 0,    'color' => '#f59e0b'],
            ['label' => 'Canceladas',   'count' => $cancelledCount,  'pct' => $totalCount > 0 ? round($cancelledCount / $totalCount * 100) : 0,  'color' => '#ef4444'],
        ];

        // Top fields ranking
        $topFields = DB::table('reservations')
            ->join('fields', 'reservations.field_id', '=', 'fields.id')
            ->where('reservations.tenant_id', $tenantId)
            ->whereBetween('reservations.date', [$start->toDateString(), $end->toDateString()])
            ->whereIn('reservations.status', ['confirmed', 'completed'])
            ->selectRaw('fields.name, COUNT(reservations.id) as total_reservations, SUM(reservations.amount) as total_revenue')
            ->groupBy('fields.id', 'fields.name')->orderByDesc('total_revenue')->limit(8)->get()->toArray();

        // Top clients
        $topClients = DB::table('reservations')
            ->join('clients', 'reservations.client_id', '=', 'clients.id')
            ->where('reservations.tenant_id', $tenantId)
            ->whereBetween('reservations.date', [$start->toDateString(), $end->toDateString()])
            ->whereIn('reservations.status', ['confirmed', 'completed'])
            ->selectRaw('clients.name, COUNT(reservations.id) as total_reservations, SUM(reservations.amount) as total_spent')
            ->groupBy('clients.id', 'clients.name')->orderByDesc('total_spent')->limit(10)->get()->toArray();

        return compact(
            'reservations', 'totalRevenue', 'totalCount', 'completedCount', 'confirmedCount',
            'pendingCount', 'cancelledCount', 'cancellationRate', 'byStatus', 'topFields', 'topClients'
        );
    }

    // ─── Expenses Report ───────────────────────────────────────────────────────

    private function getExpensesData(string|int $tenantId, Carbon $start, Carbon $end): array
    {
        $expenses = Transaction::where('tenant_id', $tenantId)
            ->where('type', 'expense')
            ->whereBetween('date', [$start->toDateString(), $end->toDateString()])
            ->orderByDesc('date')->orderByDesc('amount')
            ->get(['id', 'category', 'description', 'amount', 'date', 'notes']);

        $totalAmount = $expenses->sum('amount');
        $totalCount  = $expenses->count();
        $avgAmount   = $totalCount > 0 ? $totalAmount / $totalCount : 0;

        // By category
        $byCategory = $expenses->groupBy('category')
            ->map(fn($g, $cat) => [
                'category' => $cat,
                'count'    => $g->count(),
                'total'    => (float) $g->sum('amount'),
                'pct'      => $totalAmount > 0 ? round($g->sum('amount') / $totalAmount * 100, 1) : 0,
            ])
            ->sortByDesc('total')->values()->toArray();

        // Weekly breakdown
        $weeks = $this->buildExpenseWeeklyBreakdown($expenses, $start, $end);

        return compact('expenses', 'totalAmount', 'totalCount', 'avgAmount', 'byCategory', 'weeks');
    }

    // ─── Helpers ───────────────────────────────────────────────────────────────

    private function buildWeeklyBreakdown(string|int $tenantId, Carbon $start, Carbon $end): array
    {
        $weeks = [];
        $current = (clone $start)->startOfWeek(Carbon::MONDAY);

        while ($current <= $end) {
            $wEnd = (clone $current)->endOfWeek(Carbon::SUNDAY);
            if ($wEnd > $end) $wEnd = clone $end;
            $wStart = $current < $start ? clone $start : clone $current;

            $income = (float) DB::table('sales')
                ->where('tenant_id', $tenantId)->where('status', 'completed')
                ->whereBetween('sold_at', [$wStart, $wEnd])->sum('total')
                + (float) DB::table('reservations')
                ->where('tenant_id', $tenantId)->whereIn('status', ['confirmed', 'completed'])
                ->whereBetween('date', [$wStart->toDateString(), $wEnd->toDateString()])->sum('amount')
                + (float) DB::table('transactions')
                ->where('tenant_id', $tenantId)->where('type', 'income')
                ->whereBetween('date', [$wStart->toDateString(), $wEnd->toDateString()])->sum('amount');

            $expense = (float) DB::table('transactions')
                ->where('tenant_id', $tenantId)->where('type', 'expense')
                ->whereBetween('date', [$wStart->toDateString(), $wEnd->toDateString()])->sum('amount');

            $weeks[] = [
                'label'   => 'Sem ' . $wStart->format('d/m'),
                'income'  => round($income, 2),
                'expense' => round($expense, 2),
            ];

            $current->addWeek();
        }

        return $weeks;
    }

    private function buildExpenseWeeklyBreakdown($expenses, Carbon $start, Carbon $end): array
    {
        $weeks = [];
        $current = (clone $start)->startOfWeek(Carbon::MONDAY);

        while ($current <= $end) {
            $wEnd   = (clone $current)->endOfWeek(Carbon::SUNDAY);
            if ($wEnd > $end) $wEnd = clone $end;
            $wStart = $current < $start ? clone $start : clone $current;

            $total = $expenses
                ->whereBetween('date', [$wStart->toDateString(), $wEnd->toDateString()])
                ->sum('amount');

            $weeks[] = [
                'label' => 'Sem ' . $wStart->format('d/m'),
                'total' => round((float) $total, 2),
            ];

            $current->addWeek();
        }

        return $weeks;
    }
}
