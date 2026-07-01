<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use App\Models\User;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('admin/dashboard', [
            'stats' => [
                'total_tenants' => Tenant::count(),
                'active_tenants' => Tenant::where('is_active', true)->count(),
                'inactive_tenants' => Tenant::where('is_active', false)->count(),
                'total_users' => User::whereNotNull('tenant_id')->count(),
                'by_plan' => Tenant::selectRaw('plan, count(*) as total')
                    ->groupBy('plan')
                    ->pluck('total', 'plan'),
                'recent_tenants' => Tenant::latest()
                    ->take(5)
                    ->get(['id', 'name', 'slug', 'plan', 'is_active', 'created_at']),
                'top_tenants' => Tenant::withCount('users')
                    ->orderByDesc('users_count')
                    ->take(5)
                    ->get(['id', 'name', 'slug', 'plan', 'is_active'])
                    ->map(fn (Tenant $t) => [
                        'id' => $t->id,
                        'name' => $t->name,
                        'slug' => $t->slug,
                        'plan' => $t->plan,
                        'is_active' => $t->is_active,
                        'users_count' => $t->users_count,
                    ]),
            ],
        ]);
    }
}
