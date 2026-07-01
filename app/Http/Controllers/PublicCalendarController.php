<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\Reservation;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PublicCalendarController extends Controller
{
    public function day(Request $request): JsonResponse
    {
        $request->validate(['date' => ['required', 'date']]);
        $date = $request->get('date');

        $reservations = Reservation::where('date', $date)
            ->whereIn('status', ['pending', 'confirmed'])
            ->with('field:id,name')
            ->get(['field_id', 'start_time', 'end_time', 'status']);

        $grouped = $reservations
            ->groupBy('field_id')
            ->map(function ($items) {
                $field = $items->first()->field;

                return [
                    'field_name' => $field?->name ?? 'Campo',
                    'slots' => $items
                        ->map(fn ($r) => [
                            'start_time' => substr((string) $r->start_time, 0, 5),
                            'end_time' => substr((string) $r->end_time, 0, 5),
                            'status' => $r->status,
                        ])
                        ->sortBy('start_time')
                        ->values(),
                ];
            })
            ->values();

        return response()->json([
            'date' => $date,
            'reservations' => $grouped,
        ]);
    }

    public function index(Request $request): JsonResponse
    {
        $monthStr = $request->get('month', now()->format('Y-m'));

        try {
            $start = Carbon::createFromFormat('Y-m', $monthStr)->startOfMonth();
        } catch (\Exception) {
            $start = now()->startOfMonth();
            $monthStr = now()->format('Y-m');
        }

        $end = $start->copy()->endOfMonth();

        $reservations = Reservation::whereBetween('date', [$start, $end])
            ->whereIn('status', ['pending', 'confirmed', 'completed'])
            ->select('date', 'status')
            ->get();

        $grouped = $reservations->groupBy(fn ($r) => $r->date->format('Y-m-d'));

        $days = [];
        $current = $start->copy();

        while ($current <= $end) {
            $dateKey = $current->format('Y-m-d');
            $dayItems = $grouped->get($dateKey, collect());

            if ($dayItems->isEmpty()) {
                $status = 'available';
            } elseif ($dayItems->where('status', 'pending')->count() === $dayItems->count()) {
                $status = 'pending';
            } else {
                $status = 'occupied';
            }

            $days[] = ['date' => $dateKey, 'status' => $status];
            $current->addDay();
        }

        return response()->json([
            'month' => $monthStr,
            'days' => $days,
        ]);
    }
}
