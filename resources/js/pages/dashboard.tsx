import { Head, usePage, router } from '@inertiajs/react';
import {
    ArrowDownRight,
    ArrowUpRight,
    BarChart3,
    CalendarDays,
    DollarSign,
    LayoutGrid,
    Package,
    ReceiptText,
    UserCheck,
    Users,
} from 'lucide-react';
import { useEffect } from 'react';
import type { ReactNode } from 'react';
import {
    LineChart as RechartsLineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
} from 'recharts';
import { Badge } from '@/components/ui/badge';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes/tenant';
import type {
    DashboardKpiCardProps,
    DashboardPageProps as PageProps,
    DashboardStats as Stats,
    DashboardViewProps as ViewProps,
} from '@/types/dashboard';

const ROLE_CONFIG = {
    admin: {
        label: 'Administrador',
        color: 'border-green-200 bg-green-50 text-green-700 dark:border-green-900 dark:bg-green-950 dark:text-green-300',
    },
    operator: {
        label: 'Operador',
        color: 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-300',
    },
    viewer: {
        label: 'Visualizador',
        color: 'border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300',
    },
} as const;

const PLAN_LABELS: Record<string, string> = {
    basic: 'Basic',
    premium: 'Premium',
    contact: 'Contáctenos',
    pro: 'Pro',
    enterprise: 'Enterprise',
};

function formatCurrency(value: number | null) {
    return new Intl.NumberFormat('es-PE', {
        style: 'currency',
        currency: 'PEN',
        minimumFractionDigits: 2,
    }).format(value ?? 0);
}

function DashboardHeader({
    auth,
    tenant,
    role,
}: Pick<ViewProps, 'auth' | 'tenant' | 'role'>) {
    const config = ROLE_CONFIG[role as keyof typeof ROLE_CONFIG];

    return (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                    Resumen general de {tenant.name}. Hola, {auth.user.name}.
                </p>
            </div>
            <div className="flex items-center gap-2">
                <Badge
                    variant="outline"
                    className="border-dashed text-muted-foreground"
                >
                    Vista previa
                </Badge>
                {config && (
                    <Badge className={`border font-medium ${config.color}`}>
                        {config.label} · Plan{' '}
                        {PLAN_LABELS[tenant.plan] ?? tenant.plan}
                    </Badge>
                )}
            </div>
        </div>
    );
}

function KpiCard({
    label,
    value,
    detail,
    trend,
    icon: Icon,
    accent,
}: DashboardKpiCardProps) {
    const isPositive = trend === 'up';

    return (
        <div className="rounded-xl border bg-card p-4 shadow-xs">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-xs font-medium text-muted-foreground">
                        {label}
                    </p>
                    <p className="mt-2 truncate text-2xl font-bold tracking-tight">
                        {value}
                    </p>
                </div>
                <div
                    className={`flex size-10 shrink-0 items-center justify-center rounded-full ${accent}`}
                >
                    <Icon className="size-5" />
                </div>
            </div>
            <div className="mt-3 flex items-center gap-1 text-xs">
                {isPositive ? (
                    <ArrowUpRight className="size-3.5 text-green-600" />
                ) : (
                    <ArrowDownRight className="size-3.5 text-red-500" />
                )}
                <span
                    className={
                        isPositive
                            ? 'font-medium text-green-600'
                            : 'font-medium text-red-500'
                    }
                >
                    {isPositive ? '+12.5%' : '-3.2%'}
                </span>
                <span className="text-muted-foreground">{detail}</span>
            </div>
        </div>
    );
}

function LineChart({ data }: { data?: PageProps['real_data']['lineChartData'] }) {
    if (!data) {
return null;
}

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="rounded-lg border bg-background p-3 shadow-sm">
                    <p className="mb-2 text-sm font-medium">{label}</p>
                    <div className="flex flex-col gap-1">
                        <span className="text-sm font-medium text-green-600">
                            Ingresos: S/ {payload[0].value.toFixed(2)}
                        </span>
                        <span className="text-sm font-medium text-red-500">
                            Gastos: S/ {payload[1].value.toFixed(2)}
                        </span>
                    </div>
                </div>
            );
        }

        return null;
    };

    return (
        <section className="rounded-xl border bg-card p-5 shadow-xs lg:col-span-3">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h2 className="font-semibold">Ingresos vs. gastos</h2>
                    <p className="text-xs text-muted-foreground">
                        Comportamiento de los últimos 11 días
                    </p>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                        <span className="size-2 rounded-full bg-green-500" />{' '}
                        Ingresos
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="size-2 rounded-full bg-red-400" />{' '}
                        Gastos
                    </span>
                </div>
            </div>

            <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <RechartsLineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <XAxis 
                            dataKey="label" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fontSize: 10, fill: '#64748b' }} 
                            dy={10} 
                        />
                        <YAxis 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fontSize: 10, fill: '#64748b' }} 
                            tickFormatter={(value) => `S/ ${(value / 1000).toFixed(1)}k`}
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#e2e8f0', strokeWidth: 1, strokeDasharray: '4 4' }} />
                        <Line 
                            type="monotone" 
                            dataKey="income" 
                            stroke="#22c55e" 
                            strokeWidth={3} 
                            dot={false}
                            activeDot={{ r: 5, strokeWidth: 0, fill: '#22c55e' }}
                        />
                        <Line 
                            type="monotone" 
                            dataKey="expense" 
                            stroke="#f87171" 
                            strokeWidth={3} 
                            dot={false}
                            activeDot={{ r: 5, strokeWidth: 0, fill: '#f87171' }}
                        />
                    </RechartsLineChart>
                </ResponsiveContainer>
            </div>
        </section>
    );
}

function CategoryChart({ categories }: { categories?: PageProps['real_data']['categoryDistribution'] }) {
    if (!categories) {
return null;
}

    const COLORS: Record<string, string> = {
        'bg-green-500': '#22c55e',
        'bg-blue-500': '#3b82f6',
        'bg-yellow-400': '#facc15',
    };

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;

            return (
                <div className="rounded-lg border bg-background p-3 shadow-sm">
                    <p className="text-sm font-medium">{data.label}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                        {data.value.toFixed(1)}% (S/ {data.amount?.toFixed(2)})
                    </p>
                </div>
            );
        }

        return null;
    };

    return (
        <section className="rounded-xl border bg-card p-5 shadow-xs lg:col-span-2">
            <div>
                <h2 className="font-semibold">Ingresos por categoría</h2>
                <p className="text-xs text-muted-foreground">
                    Distribución del mes actual
                </p>
            </div>
            <div className="mt-7 flex min-h-64 flex-col items-center justify-center gap-7 sm:flex-row lg:flex-col xl:flex-row">
                <div className="relative size-36 shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={categories}
                                cx="50%"
                                cy="50%"
                                innerRadius={50}
                                outerRadius={70}
                                stroke="none"
                                dataKey="value"
                            >
                                {categories.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[entry.color as keyof typeof COLORS] || '#94a3b8'} />
                                ))}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-xs font-medium text-muted-foreground">Total</span>
                        <span className="text-sm font-bold">100%</span>
                    </div>
                </div>

                <div className="flex w-full flex-col gap-3 sm:w-auto">
                    {categories.map((cat, i) => (
                        <div
                            key={i}
                            className="flex items-center justify-between gap-4 text-sm"
                        >
                            <div className="flex items-center gap-2">
                                <span
                                    className={`size-3 rounded-full ${cat.color}`}
                                />
                                <span className="text-muted-foreground">
                                    {cat.label}
                                </span>
                            </div>
                            <span className="font-medium">
                                {cat.value.toFixed(1)}%
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

function OperationalSummary({ data }: { data?: PageProps['real_data'] }) {
    if (!data) {
return null;
}

    return (
        <div className="grid gap-4 lg:grid-cols-3">
            <section className="rounded-xl border bg-card p-5 shadow-xs">
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="font-semibold">Próximas reservas</h2>
                    <CalendarDays className="size-4 text-green-600" />
                </div>
                <div className="space-y-4">
                    {data.upcomingReservations.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No hay próximas reservas</p>
                    ) : data.upcomingReservations.map((reservation, i) => (
                        <div
                            key={i}
                            className="flex items-center gap-3"
                        >
                            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300">
                                <CalendarDays className="size-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium">
                                    {reservation.field}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {reservation.date} · {reservation.time}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            <section className="rounded-xl border bg-card p-5 shadow-xs">
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="font-semibold">Productos destacados</h2>
                    <Package className="size-4 text-blue-600" />
                </div>
                <div className="space-y-4">
                    {data.topProducts.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No hay ventas registradas</p>
                    ) : data.topProducts.map((product) => (
                        <div
                            key={product.name}
                            className="flex items-center gap-3"
                        >
                            <div
                                className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${product.color}`}
                            >
                                <Package className="size-4" />
                            </div>
                            <p className="min-w-0 flex-1 truncate text-sm font-medium">
                                {product.name}
                            </p>
                            <span className="text-xs text-muted-foreground">
                                {product.units} unidades
                            </span>
                        </div>
                    ))}
                </div>
            </section>

            <section className="rounded-xl border bg-card p-5 shadow-xs">
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="font-semibold">Actividad reciente</h2>
                    <BarChart3 className="size-4 text-violet-600" />
                </div>
                <div className="space-y-4">
                    {data.recentActivity.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No hay actividad reciente</p>
                    ) : data.recentActivity.map((activity, i) => (
                        <div key={i} className="flex gap-3">
                            <span
                                className={`mt-1.5 size-2 shrink-0 rounded-full ${activity.color}`}
                            />
                            <div className="min-w-0">
                                <p className="truncate text-sm font-medium">
                                    {activity.label}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {activity.time}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
}

function AdminView({ auth, tenant, stats, role, real_data }: ViewProps & { real_data?: PageProps['real_data'] }) {
    return (
        <div className="space-y-5 px-4 pb-6">
            <DashboardHeader auth={auth} tenant={tenant} role={role} />

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <KpiCard
                    label="Ingresos del mes"
                    value={formatCurrency(stats.monthly_revenue)}
                    detail="rendimiento actual"
                    trend="up"
                    icon={DollarSign}
                    accent="bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300"
                />
                <KpiCard
                    label="Gastos del mes"
                    value={formatCurrency(stats.monthly_expense)}
                    detail="salidas registradas"
                    trend="down"
                    icon={ReceiptText}
                    accent="bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-300"
                />
                <KpiCard
                    label="Reservaciones"
                    value={stats.reservations_today}
                    detail="programadas para hoy"
                    trend="up"
                    icon={CalendarDays}
                    accent="bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                />
                <KpiCard
                    label="Clientes registrados"
                    value={stats.client_count}
                    detail="total en sistema"
                    trend="up"
                    icon={Users}
                    accent="bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300"
                />
            </div>

            <div className="grid gap-4 lg:grid-cols-5">
                <LineChart data={real_data?.lineChartData} />
                <CategoryChart categories={real_data?.categoryDistribution} />
            </div>

            <OperationalSummary data={real_data} />
        </div>
    );
}

function OperatorView({ auth, tenant, stats, role, real_data }: ViewProps & { real_data?: PageProps['real_data'] }) {
    return (
        <div className="space-y-5 px-4 pb-6">
            <DashboardHeader auth={auth} tenant={tenant} role={role} />
            <div className="grid gap-4 sm:grid-cols-3">
                <KpiCard
                    label="Campos disponibles"
                    value={stats.field_count}
                    detail="operación actual"
                    trend="up"
                    icon={LayoutGrid}
                    accent="bg-green-100 text-green-700"
                />
                <KpiCard
                    label="Reservas para hoy"
                    value={stats.reservations_today}
                    detail="agenda diaria"
                    trend="up"
                    icon={CalendarDays}
                    accent="bg-blue-100 text-blue-700"
                />
                <KpiCard
                    label="Asistencias hoy"
                    value={stats.clients_today}
                    detail="control de acceso"
                    trend="up"
                    icon={UserCheck}
                    accent="bg-violet-100 text-violet-700"
                />
            </div>
            <OperationalSummary data={real_data} />
        </div>
    );
}

function ViewerView({ auth, tenant, stats, role, real_data }: ViewProps & { real_data?: PageProps['real_data'] }) {
    return (
        <div className="space-y-5 px-4 pb-6">
            <DashboardHeader auth={auth} tenant={tenant} role={role} />
            <div className="grid gap-4 sm:grid-cols-2">
                <KpiCard
                    label="Campos activos"
                    value={stats.field_count}
                    detail="resumen actual"
                    trend="up"
                    icon={LayoutGrid}
                    accent="bg-green-100 text-green-700"
                />
                <KpiCard
                    label="Reservas del mes"
                    value={stats.reservations_today}
                    detail="vista general"
                    trend="up"
                    icon={CalendarDays}
                    accent="bg-blue-100 text-blue-700"
                />
            </div>
            <div className="grid gap-4 lg:grid-cols-5">
                <LineChart data={real_data?.lineChartData} />
                <CategoryChart categories={real_data?.categoryDistribution} />
            </div>
        </div>
    );
}

export default function Dashboard({ stats, real_data }: PageProps) {
    const { auth, tenant } = usePage<PageProps>().props;
    const role = auth.roles[0] ?? '';

    useEffect(() => {
        const interval = setInterval(() => {
            router.reload({ only: ['stats', 'real_data'], preserveScroll: true, preserveState: true });
        }, 30000);

        return () => clearInterval(interval);
    }, []);

    if (!tenant) {
        return null;
    }

    const props = { auth, tenant, stats, role, real_data };

    return (
        <>
            <Head title="Dashboard" />
            {role === 'operator' ? (
                <OperatorView {...props} />
            ) : role === 'viewer' ? (
                <ViewerView {...props} />
            ) : (
                <AdminView {...props} />
            )}
        </>
    );
}

Dashboard.layout = (page: ReactNode) => (
    <AppLayout breadcrumbs={[{ title: 'Dashboard', href: dashboard() }]}>
        {page}
    </AppLayout>
);
