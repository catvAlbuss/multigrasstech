<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Plan;
use App\Models\Tenant;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class TenantController extends Controller
{
    public function index(Request $request)
    {
        $tenants = Tenant::query()
            ->with('paymentPlan:id,name,slug')
            ->when($request->search, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('slug', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                });
            })
            ->orderBy('name')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('admin/tenants/index', [
            'tenants' => $tenants,
            'filters' => ['search' => $request->search ?? ''],
            'plans' => Plan::orderBy('sort_order')->get(['id', 'name', 'slug']),
        ]);
    }

    public function create()
    {
        return Inertia::render('admin/tenants/create', [
            'plans' => $this->availablePlans(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'slug' => ['required', 'string', 'max:100', 'unique:tenants,slug', 'regex:/^[a-z0-9\-]+$/'],
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:50',
            'plan' => 'required|exists:plans,slug',
            'is_active' => 'boolean',
        ]);

        $plan = Plan::where('slug', $validated['plan'])->firstOrFail();
        $validated['plan_id'] = $plan->id;
        $validated['plan_expires_at'] = $this->expirationFor($plan);
        $validated['is_active'] = $request->boolean('is_active');

        $tenant = Tenant::create($validated);
        $tenant->domains()->create(['domain' => $validated['slug']]);

        return redirect()->route('admin.tenants.index')
            ->with('success', "Empresa \"{$tenant->name}\" creada correctamente.");
    }

    public function edit(Tenant $tenant)
    {
        return Inertia::render('admin/tenants/edit', [
            'tenant' => $tenant,
            'plans' => $this->availablePlans($tenant->plan_id),
        ]);
    }

    public function update(Request $request, Tenant $tenant)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:50',
            'plan' => 'required|exists:plans,slug',
            'is_active' => 'boolean',
        ]);

        $plan = Plan::where('slug', $validated['plan'])->firstOrFail();
        $planChanged = $tenant->plan_id !== $plan->id;
        $validated['plan_id'] = $plan->id;
        $validated['is_active'] = $request->boolean('is_active');

        if ($planChanged) {
            $validated['plan_expires_at'] = $this->expirationFor($plan);
        }

        $tenant->update($validated);

        return redirect()->route('admin.tenants.index')
            ->with('success', "Empresa \"{$tenant->name}\" actualizada.");
    }

    public function destroy(Tenant $tenant)
    {
        $name = $tenant->name;
        $tenant->delete();

        return redirect()->route('admin.tenants.index')
            ->with('success', "Empresa \"{$name}\" eliminada.");
    }

    public function toggle(Tenant $tenant)
    {
        $tenant->update(['is_active' => ! $tenant->is_active]);

        if (! $tenant->is_active) {
            $userIds = $tenant->users()->pluck('id');

            $tenant->users()->update(['remember_token' => null]);

            if (config('session.driver') === 'database' && $userIds->isNotEmpty()) {
                DB::connection(config('session.connection'))
                    ->table(config('session.table', 'sessions'))
                    ->whereIn('user_id', $userIds)
                    ->delete();
            }
        }

        $status = $tenant->is_active ? 'activada' : 'desactivada';

        return redirect()->route('admin.tenants.index')
            ->with('success', "Empresa \"{$tenant->name}\" {$status}.");
    }

    private function availablePlans(?int $currentPlanId = null)
    {
        return Plan::query()
            ->where(function ($query) use ($currentPlanId) {
                $query->where('is_active', true)
                    ->when($currentPlanId, fn ($query) => $query->orWhere('id', $currentPlanId));
            })
            ->orderBy('sort_order')
            ->get(['id', 'name', 'slug', 'price', 'billing_period']);
    }

    private function expirationFor(Plan $plan)
    {
        return match ($plan->billing_period) {
            'monthly' => now()->addMonthNoOverflow(),
            'yearly' => now()->addYearNoOverflow(),
            default => null,
        };
    }
}
