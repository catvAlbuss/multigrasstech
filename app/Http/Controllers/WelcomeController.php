<?php

namespace App\Http\Controllers;

use App\Models\Field;
use App\Models\Reservation;
use App\Models\TenantProfile;
use Carbon\Carbon;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

class WelcomeController extends Controller
{
    public function index(): InertiaResponse
    {
        if (! tenancy()->initialized) {
            return Inertia::render('welcome');
        }

        $profile = TenantProfile::with('media')->first();

        $fields = Field::with('media')
            ->where('status', 'active')
            ->orderByDesc('is_featured')
            ->get();

        return Inertia::render('tenant/welcome', [
            'profile' => $profile ? [
                'tagline'       => $profile->tagline,
                'description'   => $profile->description,
                'phone'         => $profile->phone,
                'address'       => $profile->address,
                'email'         => $profile->email,
                'show_calendar' => $profile->show_calendar,
                'booking_start_time' => substr((string) ($profile->booking_start_time ?? '06:00'), 0, 5),
                'booking_end_time' => substr((string) ($profile->booking_end_time ?? '23:00'), 0, 5),
                'hero_images'   => $profile->getMedia('hero')
                    ->map(fn ($m) => $m->getUrl('optimized') ?: $m->getUrl())
                    ->values()->toArray(),
                'gallery_images' => $profile->getMedia('gallery')
                    ->map(fn ($m) => $m->getUrl())
                    ->values()->toArray(),
                'payment_qr_url' => $profile->getFirstMediaUrl('payment_qr') ?: null,
            ] : null,
            'fields' => $fields->map(fn ($f) => [
                'id'          => $f->id,
                'name'        => $f->name,
                'description' => $f->description,
                'surface_type' => $f->surface_type,
                'sport_type'  => $f->sport_type,
                'hourly_rate' => $f->hourly_rate,
                'is_featured' => $f->is_featured,
                'capacity'    => $f->capacity,
                'image_url'   => $f->image_url,
                'shared_group_id' => $f->shared_group_id,
            ])->values()->toArray(),
            'calendar' => $this->buildCalendar(now()->format('Y-m')),
        ]);
    }

    private function buildCalendar(string $monthStr): array
    {
        $start = Carbon::createFromFormat('Y-m', $monthStr)->startOfMonth();
        $end   = $start->copy()->endOfMonth();

        $reservations = Reservation::whereBetween('date', [$start, $end])
            ->whereIn('status', ['pending', 'confirmed', 'completed'])
            ->select('date', 'status')
            ->get();

        $grouped = $reservations->groupBy(fn ($r) => $r->date->format('Y-m-d'));

        $days    = [];
        $current = $start->copy();

        while ($current <= $end) {
            $dateKey  = $current->format('Y-m-d');
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

        return ['month' => $monthStr, 'days' => $days];
    }
}
