<?php

namespace App\Http\Controllers;

use App\Models\Attendance;
use App\Models\Client;
use App\Models\Field;
use App\Models\Reservation;
use App\Models\Transaction;
use App\Models\User;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(): Response
    {
        $tenantId = tenant('id');

        // Line Chart Data (Last 11 days)
        $startDate = now()->subDays(10)->toDateString();
        $days = [];
        for ($i = 10; $i >= 0; $i--) {
            $date = now()->subDays($i)->toDateString();
            $days[$date] = [
                'label' => now()->subDays($i)->format('j M'),
                'income' => 0,
                'expense' => 0,
            ];
        }

        $sales = \Illuminate\Support\Facades\DB::table('sales')->where('tenant_id', $tenantId)->where('status', 'completed')->whereDate('sold_at', '>=', $startDate)->get(['sold_at', 'total']);
        foreach ($sales as $sale) {
            $date = substr($sale->sold_at, 0, 10);
            if (isset($days[$date])) {
                $days[$date]['income'] += (float)$sale->total;
            }
        }
        $reservations = \Illuminate\Support\Facades\DB::table('reservations')->where('tenant_id', $tenantId)->whereIn('status', ['confirmed', 'completed'])->whereDate('date', '>=', $startDate)->get(['date', 'amount']);
        foreach ($reservations as $res) {
            if (isset($days[$res->date])) {
                $days[$res->date]['income'] += (float)$res->amount;
            }
        }
        $transactions = \Illuminate\Support\Facades\DB::table('transactions')->where('tenant_id', $tenantId)->whereDate('date', '>=', $startDate)->get(['date', 'type', 'amount']);
        foreach ($transactions as $txn) {
            if (isset($days[$txn->date])) {
                if ($txn->type === 'income') {
                    $days[$txn->date]['income'] += (float)$txn->amount;
                } else {
                    $days[$txn->date]['expense'] += (float)$txn->amount;
                }
            }
        }
        $lineChartData = array_values($days);

        // Upcoming Reservations
        $upcomingReservations = Reservation::with('field')
            ->where('tenant_id', $tenantId)
            ->whereIn('status', ['pending', 'confirmed'])
            ->whereDate('date', '>=', today())
            ->orderBy('date')
            ->orderBy('start_time')
            ->limit(3)
            ->get()
            ->map(function ($r) {
                $dateStr = $r->date === today()->toDateString() ? 'Hoy' : ($r->date === today()->addDay()->toDateString() ? 'Mañana' : date('d/m/Y', strtotime($r->date)));
                return [
                    'field' => $r->field->name ?? 'Cancha',
                    'time' => date('g:i A', strtotime($r->start_time)),
                    'date' => $dateStr,
                ];
            });

        // Top Products
        $topProducts = \Illuminate\Support\Facades\DB::table('sale_items')
            ->join('sales', 'sale_items.sale_id', '=', 'sales.id')
            ->join('products', 'sale_items.product_id', '=', 'products.id')
            ->where('sales.tenant_id', $tenantId)
            ->where('sales.status', 'completed')
            ->whereMonth('sales.sold_at', now()->month)
            ->selectRaw('products.name, SUM(sale_items.quantity) as units')
            ->groupBy('products.id', 'products.name')
            ->orderByDesc('units')
            ->limit(3)
            ->get();
        $productColors = ['bg-orange-100 text-orange-700', 'bg-blue-100 text-blue-700', 'bg-amber-100 text-amber-700'];
        $topProductsFormatted = $topProducts->map(function ($p, $i) use ($productColors) {
            return [
                'name' => $p->name,
                'units' => (int)$p->units,
                'color' => $productColors[$i % 3],
            ];
        });

        // Recent Activity
        $activities = [];
        $recentSales = \Illuminate\Support\Facades\DB::table('sales')->where('tenant_id', $tenantId)->orderByDesc('created_at')->limit(3)->get(['created_at', 'customer_name']);
        foreach ($recentSales as $s) {
            $activities[] = [
                'label' => 'Pago recibido de ' . ($s->customer_name ?: 'Cliente'),
                'time' => $s->created_at,
                'color' => 'bg-green-500',
            ];
        }
        $recentReservations = \Illuminate\Support\Facades\DB::table('reservations')
            ->join('fields', 'reservations.field_id', '=', 'fields.id')
            ->where('reservations.tenant_id', $tenantId)->orderByDesc('reservations.created_at')->limit(3)->select('reservations.created_at', 'fields.name')->get();
        foreach ($recentReservations as $r) {
            $activities[] = [
                'label' => 'Nueva reservación en ' . $r->name,
                'time' => $r->created_at,
                'color' => 'bg-blue-500',
            ];
        }
        $recentTxns = \Illuminate\Support\Facades\DB::table('transactions')->where('tenant_id', $tenantId)->where('type', 'expense')->orderByDesc('created_at')->limit(3)->get(['created_at', 'category']);
        foreach ($recentTxns as $t) {
            $activities[] = [
                'label' => 'Gasto registrado: ' . $t->category,
                'time' => $t->created_at,
                'color' => 'bg-red-500',
            ];
        }
        usort($activities, fn($a, $b) => $b['time'] <=> $a['time']);
        $recentActivityFormatted = collect(array_slice($activities, 0, 3))->map(function ($a) {
            $diff = now()->diffInMinutes(\Carbon\Carbon::parse($a['time']));
            $timeStr = $diff < 60 ? "Hace $diff min" : "Hace " . round($diff / 60) . " hora(s)";
            return [
                'label' => $a['label'],
                'time' => $timeStr,
                'color' => $a['color'],
            ];
        });

        // Category Distribution
        $monthlyResv = \Illuminate\Support\Facades\DB::table('reservations')->where('tenant_id', $tenantId)->whereIn('status', ['confirmed', 'completed'])->whereMonth('date', now()->month)->sum('amount');
        $monthlySales = \Illuminate\Support\Facades\DB::table('sales')->where('tenant_id', $tenantId)->where('status', 'completed')->whereMonth('sold_at', now()->month)->sum('total');
        $monthlyOther = \Illuminate\Support\Facades\DB::table('transactions')->where('tenant_id', $tenantId)->where('type', 'income')->whereMonth('date', now()->month)->sum('amount');

        $totalCat = $monthlyResv + $monthlySales + $monthlyOther;
        $catDist = [
            [ 'label' => 'Reservaciones', 'value' => $totalCat > 0 ? round(($monthlyResv / $totalCat) * 100) : 0, 'color' => 'bg-green-500', 'amount' => $monthlyResv ],
            [ 'label' => 'Productos', 'value' => $totalCat > 0 ? round(($monthlySales / $totalCat) * 100) : 0, 'color' => 'bg-blue-500', 'amount' => $monthlySales ],
            [ 'label' => 'Otros', 'value' => $totalCat > 0 ? round(($monthlyOther / $totalCat) * 100) : 0, 'color' => 'bg-amber-400', 'amount' => $monthlyOther ],
        ];

        return Inertia::render('dashboard', [
            'stats' => [
                'user_count'         => User::where('tenant_id', $tenantId)->count(),
                'field_count'        => Field::count(),
                'client_count'       => Client::count(),
                'reservations_today' => Reservation::whereDate('date', today())->count(),
                'clients_today'      => Attendance::whereDate('date', today())->distinct('client_id')->count('client_id'),
                'monthly_revenue'    => $monthlyResv + $monthlySales + $monthlyOther,
                'monthly_expense'    => Transaction::where('tenant_id', $tenantId)->where('type', 'expense')->whereYear('date', now()->year)->whereMonth('date', now()->month)->sum('amount'),
            ],
            'real_data' => [
                'lineChartData' => $lineChartData,
                'upcomingReservations' => $upcomingReservations,
                'topProducts' => $topProductsFormatted,
                'recentActivity' => $recentActivityFormatted,
                'categoryDistribution' => $catDist,
            ]
        ]);
    }
}
