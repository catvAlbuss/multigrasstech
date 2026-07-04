<?php

namespace App\Http\Middleware;

use App\Models\Reservation;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'auth' => [
                'user' => $request->user(),
                // Lazy: evaluated after SetPermissionsTeamId middleware sets the team context
                'roles' => fn () => $request->user()?->getRoleNames() ?? [],
            ],
            // Lazy: tenant data when on a tenant subdomain, null on central domain
            'tenant' => fn () => tenancy()->initialized ? [
                'id' => tenant('id'),
                'name' => tenant()->name,
                'slug' => tenant()->slug,
                'plan' => tenant()->plan,
            ] : null,
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
            ],
            'notifications' => fn () => $this->notifications($request),
        ];
    }

    private function notifications(Request $request): array
    {
        $items = [];

        if ($success = $request->session()->get('success')) {
            $items[] = [
                'id' => 'flash-success',
                'type' => 'success',
                'title' => 'Acción completada',
                'body' => $success,
                'href' => null,
                'read' => false,
                'created_at' => now()->toIso8601String(),
            ];
        }

        if ($error = $request->session()->get('error')) {
            $items[] = [
                'id' => 'flash-error',
                'type' => 'error',
                'title' => 'Requiere atención',
                'body' => $error,
                'href' => null,
                'read' => false,
                'created_at' => now()->toIso8601String(),
            ];
        }

        if (tenancy()->initialized && $request->user()) {
            $pendingReservations = Reservation::where('tenant_id', tenant('id'))
                ->where('status', 'pending')
                ->whereDate('date', '>=', today())
                ->count();

            if ($pendingReservations > 0) {
                $items[] = [
                    'id' => 'pending-reservations',
                    'type' => 'reservation',
                    'title' => 'Reservas pendientes',
                    'body' => $pendingReservations === 1
                        ? 'Tienes 1 reserva pendiente por revisar.'
                        : "Tienes {$pendingReservations} reservas pendientes por revisar.",
                    'href' => '/reservations?status=pending',
                    'read' => false,
                    'created_at' => now()->toIso8601String(),
                ];
            }
        }

        return [
            'items' => $items,
            'unread_count' => collect($items)->where('read', false)->count(),
        ];
    }
}
