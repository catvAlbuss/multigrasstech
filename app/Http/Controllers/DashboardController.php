<?php

namespace App\Http\Controllers;

use App\Models\Attendance;
use App\Models\Client;
use App\Models\Field;
use App\Models\Reservation;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(): Response
    {
        $tenantId = tenant('id');
        $now = now();
        $previousMonth = $now->copy()->subMonthNoOverflow();

        $monthlyResv = $this->monthlyReservationIncome($tenantId, $now->year, $now->month);
        $monthlySales = $this->monthlySalesIncome($tenantId, $now->year, $now->month);
        $monthlyOther = $this->monthlyOtherIncome($tenantId, $now->year, $now->month);
        $monthlyExpense = $this->monthlyExpense($tenantId, $now->year, $now->month);
        $monthlyRevenue = $monthlyResv + $monthlySales + $monthlyOther;

        $previousRevenue = $this->monthlyReservationIncome($tenantId, $previousMonth->year, $previousMonth->month)
            + $this->monthlySalesIncome($tenantId, $previousMonth->year, $previousMonth->month)
            + $this->monthlyOtherIncome($tenantId, $previousMonth->year, $previousMonth->month);
        $previousExpense = $this->monthlyExpense($tenantId, $previousMonth->year, $previousMonth->month);

        $fieldCount = Field::where('tenant_id', $tenantId)->count();
        $previousFieldCount = Field::where('tenant_id', $tenantId)
            ->where('created_at', '<', $now->copy()->startOfMonth())
            ->count();
        $clientCount = Client::where('tenant_id', $tenantId)->count();
        $previousClientCount = Client::where('tenant_id', $tenantId)
            ->where('created_at', '<', $now->copy()->startOfMonth())
            ->count();
        $reservationsToday = Reservation::where('tenant_id', $tenantId)
            ->whereDate('date', today())
            ->count();
        $reservationsYesterday = Reservation::where('tenant_id', $tenantId)
            ->whereDate('date', today()->subDay())
            ->count();
        $clientsToday = Attendance::where('tenant_id', $tenantId)
            ->whereDate('date', today())
            ->distinct('client_id')
            ->count('client_id');
        $clientsYesterday = Attendance::where('tenant_id', $tenantId)
            ->whereDate('date', today()->subDay())
            ->distinct('client_id')
            ->count('client_id');
        $occupiedFieldsToday = Reservation::where('tenant_id', $tenantId)
            ->whereDate('date', today())
            ->whereIn('status', ['pending', 'confirmed', 'completed'])
            ->distinct('field_id')
            ->count('field_id');

        return Inertia::render('dashboard', [
            'stats' => [
                'user_count' => User::where('tenant_id', $tenantId)->count(),
                'field_count' => $fieldCount,
                'client_count' => $clientCount,
                'reservations_today' => $reservationsToday,
                'clients_today' => $clientsToday,
                'monthly_revenue' => $monthlyRevenue,
                'monthly_expense' => $monthlyExpense,
                'field_occupancy' => [
                    'occupied' => $occupiedFieldsToday,
                    'total' => $fieldCount,
                    'percentage' => $fieldCount > 0 ? round(($occupiedFieldsToday / $fieldCount) * 100) : 0,
                ],
                'trends' => [
                    'monthly_revenue' => $this->trend($monthlyRevenue, $previousRevenue, 'positive'),
                    'monthly_expense' => $this->trend($monthlyExpense, $previousExpense, 'negative'),
                    'reservations_today' => $this->trend($reservationsToday, $reservationsYesterday, 'positive', 'vs ayer'),
                    'client_count' => $this->trend($clientCount, $previousClientCount, 'positive'),
                    'field_count' => $this->trend($fieldCount, $previousFieldCount, 'positive'),
                    'clients_today' => $this->trend($clientsToday, $clientsYesterday, 'positive', 'vs ayer'),
                ],
            ],
            'real_data' => [
                'lineChartData' => $this->lineChartData($tenantId),
                'upcomingReservations' => $this->upcomingReservations($tenantId),
                'topProducts' => $this->topProducts($tenantId),
                'recentActivity' => $this->recentActivity($tenantId),
                'categoryDistribution' => $this->categoryDistribution($monthlyResv, $monthlySales, $monthlyOther),
                'reservationsBySport' => $this->reservationsBySport($tenantId),
                'fieldUsage' => $this->fieldUsage($tenantId),
            ],
        ]);
    }

    private function monthlyReservationIncome(string|int|null $tenantId, int $year, int $month): float
    {
        return (float) DB::table('reservations')
            ->where('tenant_id', $tenantId)
            ->whereIn('status', ['confirmed', 'completed'])
            ->whereYear('date', $year)
            ->whereMonth('date', $month)
            ->sum('amount');
    }

    private function monthlySalesIncome(string|int|null $tenantId, int $year, int $month): float
    {
        return (float) DB::table('sales')
            ->where('tenant_id', $tenantId)
            ->where('status', 'completed')
            ->whereYear('sold_at', $year)
            ->whereMonth('sold_at', $month)
            ->sum('total');
    }

    private function monthlyOtherIncome(string|int|null $tenantId, int $year, int $month): float
    {
        return (float) DB::table('transactions')
            ->where('tenant_id', $tenantId)
            ->where('type', 'income')
            ->whereYear('date', $year)
            ->whereMonth('date', $month)
            ->sum('amount');
    }

    private function monthlyExpense(string|int|null $tenantId, int $year, int $month): float
    {
        return (float) Transaction::where('tenant_id', $tenantId)
            ->where('type', 'expense')
            ->whereYear('date', $year)
            ->whereMonth('date', $month)
            ->sum('amount');
    }

    private function lineChartData(string|int|null $tenantId): array
    {
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

        DB::table('sales')
            ->where('tenant_id', $tenantId)
            ->where('status', 'completed')
            ->whereDate('sold_at', '>=', $startDate)
            ->get(['sold_at', 'total'])
            ->each(function ($sale) use (&$days) {
                $date = substr($sale->sold_at, 0, 10);

                if (isset($days[$date])) {
                    $days[$date]['income'] += (float) $sale->total;
                }
            });

        DB::table('reservations')
            ->where('tenant_id', $tenantId)
            ->whereIn('status', ['confirmed', 'completed'])
            ->whereDate('date', '>=', $startDate)
            ->get(['date', 'amount'])
            ->each(function ($reservation) use (&$days) {
                if (isset($days[$reservation->date])) {
                    $days[$reservation->date]['income'] += (float) $reservation->amount;
                }
            });

        DB::table('transactions')
            ->where('tenant_id', $tenantId)
            ->whereDate('date', '>=', $startDate)
            ->get(['date', 'type', 'amount'])
            ->each(function ($transaction) use (&$days) {
                if (! isset($days[$transaction->date])) {
                    return;
                }

                if ($transaction->type === 'income') {
                    $days[$transaction->date]['income'] += (float) $transaction->amount;
                } else {
                    $days[$transaction->date]['expense'] += (float) $transaction->amount;
                }
            });

        return array_values($days);
    }

    private function upcomingReservations(string|int|null $tenantId)
    {
        return Reservation::with('field')
            ->where('tenant_id', $tenantId)
            ->whereIn('status', ['pending', 'confirmed'])
            ->whereDate('date', '>=', today())
            ->orderBy('date')
            ->orderBy('start_time')
            ->limit(4)
            ->get()
            ->map(function (Reservation $reservation) {
                $date = $reservation->date->toDateString();
                $label = match ($date) {
                    today()->toDateString() => 'Hoy',
                    today()->addDay()->toDateString() => 'Mañana',
                    default => date('d/m/Y', strtotime($date)),
                };

                return [
                    'field' => $reservation->field->name ?? 'Cancha',
                    'time' => date('H:i', strtotime($reservation->start_time)),
                    'date' => $label,
                    'status' => $reservation->status,
                ];
            });
    }

    private function topProducts(string|int|null $tenantId)
    {
        $colors = [
            'bg-emerald-500/15 text-emerald-300',
            'bg-blue-500/15 text-blue-300',
            'bg-amber-500/15 text-amber-300',
        ];

        return DB::table('sale_items')
            ->join('sales', 'sale_items.sale_id', '=', 'sales.id')
            ->join('products', 'sale_items.product_id', '=', 'products.id')
            ->where('sales.tenant_id', $tenantId)
            ->where('sales.status', 'completed')
            ->whereYear('sales.sold_at', now()->year)
            ->whereMonth('sales.sold_at', now()->month)
            ->selectRaw('products.name, SUM(sale_items.quantity) as units, SUM(sale_items.total) as amount')
            ->groupBy('products.id', 'products.name')
            ->orderByDesc('amount')
            ->limit(3)
            ->get()
            ->map(function ($product, int $index) use ($colors) {
                return [
                    'name' => $product->name,
                    'units' => (int) $product->units,
                    'amount' => (float) $product->amount,
                    'color' => $colors[$index % count($colors)],
                ];
            });
    }

    private function recentActivity(string|int|null $tenantId)
    {
        $activities = [];

        DB::table('sales')
            ->where('tenant_id', $tenantId)
            ->orderByDesc('created_at')
            ->limit(3)
            ->get(['created_at', 'customer_name'])
            ->each(function ($sale) use (&$activities) {
                $activities[] = [
                    'label' => 'Pago recibido de ' . ($sale->customer_name ?: 'Cliente'),
                    'time' => $sale->created_at,
                    'color' => 'bg-emerald-400',
                ];
            });

        DB::table('reservations')
            ->join('fields', 'reservations.field_id', '=', 'fields.id')
            ->where('reservations.tenant_id', $tenantId)
            ->orderByDesc('reservations.created_at')
            ->limit(3)
            ->select('reservations.created_at', 'fields.name')
            ->get()
            ->each(function ($reservation) use (&$activities) {
                $activities[] = [
                    'label' => 'Nueva reservación en ' . $reservation->name,
                    'time' => $reservation->created_at,
                    'color' => 'bg-blue-400',
                ];
            });

        DB::table('transactions')
            ->where('tenant_id', $tenantId)
            ->where('type', 'expense')
            ->orderByDesc('created_at')
            ->limit(3)
            ->get(['created_at', 'category'])
            ->each(function ($transaction) use (&$activities) {
                $activities[] = [
                    'label' => 'Gasto registrado: ' . $transaction->category,
                    'time' => $transaction->created_at,
                    'color' => 'bg-red-400',
                ];
            });

        usort($activities, fn ($a, $b) => $b['time'] <=> $a['time']);

        return collect(array_slice($activities, 0, 4))->map(function ($activity) {
            $diff = now()->diffInMinutes(\Carbon\Carbon::parse($activity['time']));
            $time = $diff < 60
                ? "Hace $diff min"
                : 'Hace ' . round($diff / 60) . ' hora(s)';

            return [
                'label' => $activity['label'],
                'time' => $time,
                'color' => $activity['color'],
            ];
        });
    }

    private function categoryDistribution(float $reservations, float $sales, float $other): array
    {
        $total = $reservations + $sales + $other;

        return [
            [
                'label' => 'Reservaciones',
                'value' => $total > 0 ? round(($reservations / $total) * 100, 1) : 0,
                'color' => 'bg-emerald-400',
                'amount' => $reservations,
            ],
            [
                'label' => 'Productos',
                'value' => $total > 0 ? round(($sales / $total) * 100, 1) : 0,
                'color' => 'bg-blue-400',
                'amount' => $sales,
            ],
            [
                'label' => 'Otros',
                'value' => $total > 0 ? round(($other / $total) * 100, 1) : 0,
                'color' => 'bg-amber-400',
                'amount' => $other,
            ],
        ];
    }

    private function reservationsBySport(string|int|null $tenantId)
    {
        return DB::table('reservations')
            ->join('fields', 'reservations.field_id', '=', 'fields.id')
            ->where('reservations.tenant_id', $tenantId)
            ->whereDate('reservations.date', today())
            ->whereIn('reservations.status', ['pending', 'confirmed', 'completed'])
            ->selectRaw("COALESCE(fields.sport_type, 'otros') as sport, COUNT(*) as reservations")
            ->groupBy('sport')
            ->orderByDesc('reservations')
            ->limit(4)
            ->get()
            ->map(function ($sport) {
                return [
                    'label' => ucfirst(str_replace('_', ' ', (string) $sport->sport)),
                    'value' => (int) $sport->reservations,
                ];
            });
    }

    private function fieldUsage(string|int|null $tenantId)
    {
        $maxReservations = DB::table('reservations')
            ->where('tenant_id', $tenantId)
            ->whereIn('status', ['pending', 'confirmed', 'completed'])
            ->whereDate('date', '>=', now()->subDays(30)->toDateString())
            ->selectRaw('field_id, COUNT(*) as reservations')
            ->groupBy('field_id')
            ->orderByDesc('reservations')
            ->value('reservations') ?? 0;

        return DB::table('reservations')
            ->join('fields', 'reservations.field_id', '=', 'fields.id')
            ->where('reservations.tenant_id', $tenantId)
            ->whereIn('reservations.status', ['pending', 'confirmed', 'completed'])
            ->whereDate('reservations.date', '>=', now()->subDays(30)->toDateString())
            ->selectRaw('fields.name, COUNT(*) as reservations')
            ->groupBy('fields.id', 'fields.name')
            ->orderByDesc('reservations')
            ->limit(4)
            ->get()
            ->map(function ($field) use ($maxReservations) {
                return [
                    'name' => $field->name,
                    'reservations' => (int) $field->reservations,
                    'percentage' => $maxReservations > 0 ? round(($field->reservations / $maxReservations) * 100) : 0,
                ];
            });
    }

    private function trend(
        float|int $current,
        float|int $previous,
        string $polarity = 'positive',
        string $label = 'vs mes anterior',
    ): array {
        $delta = $current - $previous;
        $direction = $delta > 0 ? 'up' : ($delta < 0 ? 'down' : 'flat');
        $percentage = $previous > 0
            ? round(($delta / $previous) * 100, 1)
            : ($current > 0 ? 100.0 : 0.0);
        $tone = 'neutral';

        if ($direction !== 'flat') {
            $tone = $polarity === 'negative'
                ? ($direction === 'down' ? 'positive' : 'negative')
                : ($direction === 'up' ? 'positive' : 'negative');
        }

        return [
            'direction' => $direction,
            'percentage' => $percentage,
            'label' => $label,
            'tone' => $tone,
        ];
    }
}
