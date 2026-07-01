import { Head, Link } from '@inertiajs/react';
import {
    Building2,
    CheckCircle2,
    TrendingUp,
    Users,
    XCircle,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { dashboard as adminDashboard } from '@/routes/admin';
import { index as adminTenantsIndex } from '@/routes/admin/tenants';
import type { AdminDashboardStats as Stats } from '@/types/admin';

// ─── Types ────────────────────────────────────────────────────────────────────

// ─── Helpers ──────────────────────────────────────────────────────────────────

const PLAN_LABELS: Record<string, string> = {
    basic: 'Basic',
    premium: 'Premium',
    contact: 'Contáctenos',
    pro: 'Pro',
    enterprise: 'Enterprise',
};

const PLAN_COLORS: Record<string, string> = {
    basic: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800',
    premium:
        'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800',
    contact:
        'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800',
    pro: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800',
    enterprise: 'bg-green-700 text-white border-green-700',
};

// ─── Sub-componentes ──────────────────────────────────────────────────────────

function KpiCard({
    label,
    value,
    icon: Icon,
    color,
}: {
    label: string;
    value: number;
    icon: React.ElementType;
    color: string;
}) {
    return (
        <div className="flex items-center gap-4 rounded-xl border border-green-100 bg-white px-5 py-4 shadow-xs dark:border-green-900/30 dark:bg-neutral-900">
            <div
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${color}`}
            >
                <Icon className="h-5 w-5" />
            </div>
            <div>
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-3xl font-bold text-green-700 dark:text-green-400">
                    {value}
                </p>
            </div>
        </div>
    );
}

function PlanBadge({ plan }: { plan: string }) {
    return (
        <span
            className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${PLAN_COLORS[plan] ?? 'border-gray-200 bg-gray-100 text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300'}`}
        >
            {PLAN_LABELS[plan] ?? plan}
        </span>
    );
}

// ─── Página ───────────────────────────────────────────────────────────────────

export default function AdminDashboard({ stats }: { stats: Stats }) {
    const maxUsers = Math.max(
        ...stats.top_tenants.map((t) => t.users_count),
        1,
    );

    return (
        <>
            <Head title="Panel de control" />

            <div className="space-y-6 px-4">
                {/* Header */}
                <div className="rounded-xl bg-green-700 px-6 py-5 text-white shadow-sm">
                    <h1 className="text-xl font-semibold">Panel de control</h1>
                    <p className="mt-0.5 text-sm text-green-200">
                        Resumen de la plataforma Multigrass
                    </p>
                </div>

                {/* KPI cards */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <KpiCard
                        label="Total empresas"
                        value={stats.total_tenants}
                        icon={Building2}
                        color="text-green-700 bg-green-50 dark:bg-green-900/30 dark:text-green-400"
                    />
                    <KpiCard
                        label="Activas"
                        value={stats.active_tenants}
                        icon={CheckCircle2}
                        color="text-emerald-700 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-400"
                    />
                    <KpiCard
                        label="Inactivas"
                        value={stats.inactive_tenants}
                        icon={XCircle}
                        color="text-gray-500 bg-gray-50 dark:bg-gray-800 dark:text-gray-400"
                    />
                    <KpiCard
                        label="Usuarios totales"
                        value={stats.total_users}
                        icon={Users}
                        color="text-green-700 bg-green-50 dark:bg-green-900/30 dark:text-green-400"
                    />
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Distribución por plan */}
                    <div className="rounded-xl border border-green-100 bg-white p-5 shadow-xs dark:border-green-900/30 dark:bg-neutral-900">
                        <h2 className="mb-4 text-sm font-semibold text-green-800 dark:text-green-300">
                            Distribución por plan
                        </h2>
                        {Object.entries(stats.by_plan).length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                                Sin datos aún.
                            </p>
                        ) : (
                            <ul className="space-y-3">
                                {Object.entries(stats.by_plan).map(
                                    ([plan, count]) => (
                                        <li
                                            key={plan}
                                            className="flex items-center justify-between"
                                        >
                                            <PlanBadge plan={plan} />
                                            <span className="text-sm font-semibold text-green-700 dark:text-green-400">
                                                {count}
                                            </span>
                                        </li>
                                    ),
                                )}
                            </ul>
                        )}
                    </div>

                    {/* Top empresas por actividad */}
                    <div className="rounded-xl border border-green-100 bg-white p-5 shadow-xs dark:border-green-900/30 dark:bg-neutral-900">
                        <div className="mb-4 flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-green-600" />
                            <h2 className="text-sm font-semibold text-green-800 dark:text-green-300">
                                Empresas más activas
                            </h2>
                        </div>
                        {stats.top_tenants.length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                                Sin datos aún.
                            </p>
                        ) : (
                            <ol className="space-y-3">
                                {stats.top_tenants.map((tenant, idx) => (
                                    <li
                                        key={tenant.id}
                                        className="flex items-center gap-3"
                                    >
                                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-50 text-xs font-bold text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                            {idx + 1}
                                        </span>
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-medium">
                                                {tenant.name}
                                            </p>
                                            <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-green-100 dark:bg-green-900/20">
                                                <div
                                                    className="h-full rounded-full bg-green-500"
                                                    style={{
                                                        width: `${Math.round((tenant.users_count / maxUsers) * 100)}%`,
                                                    }}
                                                />
                                            </div>
                                        </div>
                                        <span className="shrink-0 text-sm font-semibold text-green-700 dark:text-green-400">
                                            {tenant.users_count}
                                        </span>
                                    </li>
                                ))}
                            </ol>
                        )}
                    </div>

                    {/* Empresas recientes */}
                    <div className="overflow-hidden rounded-xl border border-green-100 bg-white shadow-xs dark:border-green-900/30 dark:bg-neutral-900">
                        <div className="flex items-center justify-between border-b border-green-100 px-5 py-3 dark:border-green-900/30">
                            <h2 className="text-sm font-semibold text-green-800 dark:text-green-300">
                                Empresas recientes
                            </h2>
                            <Link
                                href={adminTenantsIndex()}
                                className="text-xs text-green-600 hover:underline"
                            >
                                Ver todas
                            </Link>
                        </div>

                        {stats.recent_tenants.length === 0 ? (
                            <p className="p-5 text-sm text-muted-foreground">
                                Sin empresas registradas.
                            </p>
                        ) : (
                            <ul className="divide-y divide-green-50 dark:divide-green-900/20">
                                {stats.recent_tenants.map((tenant) => (
                                    <li
                                        key={tenant.id}
                                        className="flex items-center justify-between px-5 py-3 hover:bg-green-50/40 dark:hover:bg-green-900/10"
                                    >
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-medium">
                                                {tenant.name}
                                            </p>
                                            <p className="font-mono text-xs text-muted-foreground">
                                                {tenant.slug}.multigrass.test
                                            </p>
                                        </div>
                                        <div className="ml-4 flex shrink-0 items-center gap-2">
                                            <PlanBadge plan={tenant.plan} />
                                            {tenant.is_active ? (
                                                <Badge className="border-green-200 bg-green-100 text-xs text-green-700 hover:bg-green-100 dark:border-green-800 dark:bg-green-900/30 dark:text-green-300 dark:hover:bg-green-900/30">
                                                    Activa
                                                </Badge>
                                            ) : (
                                                <Badge
                                                    variant="outline"
                                                    className="text-xs text-gray-500"
                                                >
                                                    Inactiva
                                                </Badge>
                                            )}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}

AdminDashboard.layout = {
    breadcrumbs: [{ title: 'Dashboard', href: adminDashboard() }],
};
