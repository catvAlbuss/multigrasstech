import { Head, router } from '@inertiajs/react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import {
    BarChart3,
    Calendar,
    DollarSign,
    Download,
    FileText,
    Package,
    TrendingDown,
    TrendingUp,
    Users,
} from 'lucide-react';
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Legend,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type {
    ExecutiveData,
    ExpensesData,
    ReservationsData,
    ReportsPageProps,
    SalesData,
} from '@/types/tenant';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
    'S/ ' +
    Number(n).toLocaleString('es-PE', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });

const COLORS_CHART = [
    '#16a34a',
    '#2563eb',
    '#d97706',
    '#7c3aed',
    '#0891b2',
    '#ec4899',
    '#f97316',
];

// ─── Report Tabs ──────────────────────────────────────────────────────────────

const REPORT_TABS = [
    {
        key: 'executive',
        label: 'Resumen Ejecutivo',
        icon: BarChart3,
        color: 'text-green-600',
    },
    { key: 'sales', label: 'Ventas', icon: Package, color: 'text-blue-600' },
    {
        key: 'reservations',
        label: 'Reservaciones',
        icon: Calendar,
        color: 'text-purple-600',
    },
    {
        key: 'expenses',
        label: 'Gastos',
        icon: TrendingDown,
        color: 'text-red-600',
    },
] as const;

// ─── Shared components ────────────────────────────────────────────────────────

function KpiCard({
    label,
    value,
    sub,
    icon: Icon,
    colorClass,
    variant = 'default',
}: {
    label: string;
    value: string;
    sub?: string;
    icon: React.ElementType;
    colorClass: string;
    variant?: 'default' | 'accent';
}) {
    return (
        <div
            className={`relative overflow-hidden rounded-xl border p-5 shadow-xs ${
                variant === 'accent'
                    ? 'border-green-200 bg-gradient-to-br from-green-700 to-green-900 text-white dark:border-green-800'
                    : 'border-gray-100 bg-white dark:border-neutral-800 dark:bg-neutral-900'
            }`}
        >
            <div className="absolute top-3 right-3 opacity-10">
                <Icon className="h-10 w-10" />
            </div>
            <p
                className={`text-xs font-medium ${variant === 'accent' ? 'text-green-100' : 'text-muted-foreground'}`}
            >
                {label}
            </p>
            <p
                className={`mt-1 text-2xl font-bold ${variant === 'accent' ? 'text-white' : colorClass}`}
            >
                {value}
            </p>
            {sub && (
                <p
                    className={`mt-1 text-xs ${variant === 'accent' ? 'text-green-200' : 'text-muted-foreground'}`}
                >
                    {sub}
                </p>
            )}
        </div>
    );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
    return (
        <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold tracking-wide text-muted-foreground uppercase">
            <span className="h-px flex-1 bg-border" />
            {children}
            <span className="h-px flex-1 bg-border" />
        </h2>
    );
}

// ─── Executive Tab ────────────────────────────────────────────────────────────

function ExecutiveView({ data }: { data: ExecutiveData }) {
    return (
        <div className="space-y-6">
            {/* KPIs */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
                <div className="col-span-2 sm:col-span-3 lg:col-span-2">
                    <KpiCard
                        label="Ingresos Totales"
                        value={fmt(data.totalIncome)}
                        sub="Ventas + Reservas + Otros"
                        icon={TrendingUp}
                        colorClass="text-green-600"
                        variant="accent"
                    />
                </div>
                <KpiCard
                    label="Gastos Totales"
                    value={fmt(data.totalExpenses)}
                    icon={TrendingDown}
                    colorClass="text-red-600"
                />
                <KpiCard
                    label="Balance Neto"
                    value={fmt(data.totalBalance)}
                    colorClass={
                        data.totalBalance >= 0
                            ? 'text-green-600'
                            : 'text-red-600'
                    }
                    icon={DollarSign}
                />
                <KpiCard
                    label="Ventas (Caja)"
                    value={fmt(data.totalSales)}
                    icon={Package}
                    colorClass="text-blue-600"
                />
                <KpiCard
                    label="Clientes Únicos"
                    value={data.uniqueClients.toString()}
                    icon={Users}
                    colorClass="text-purple-600"
                />
            </div>

            {/* Weekly + Category */}
            <div className="grid gap-6 lg:grid-cols-5">
                <div className="rounded-xl border bg-white p-5 shadow-xs lg:col-span-3 dark:border-neutral-800 dark:bg-neutral-900">
                    <h3 className="mb-4 font-semibold">
                        Ingresos vs Gastos (Semanal)
                    </h3>
                    <div className="h-52">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={data.weeks}
                                margin={{
                                    top: 4,
                                    right: 8,
                                    left: -20,
                                    bottom: 0,
                                }}
                            >
                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    vertical={false}
                                    opacity={0.2}
                                />
                                <XAxis
                                    dataKey="label"
                                    tick={{ fontSize: 11 }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <YAxis
                                    tick={{ fontSize: 11 }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <Tooltip
                                    formatter={(v: number) => fmt(v)}
                                    contentStyle={{
                                        borderRadius: '8px',
                                        fontSize: '11px',
                                    }}
                                />
                                <Legend wrapperStyle={{ fontSize: '11px' }} />
                                <Bar
                                    dataKey="income"
                                    name="Ingresos"
                                    fill="#16a34a"
                                    radius={[4, 4, 0, 0]}
                                />
                                <Bar
                                    dataKey="expense"
                                    name="Gastos"
                                    fill="#ef4444"
                                    radius={[4, 4, 0, 0]}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                <div className="rounded-xl border bg-white p-5 shadow-xs lg:col-span-2 dark:border-neutral-800 dark:bg-neutral-900">
                    <h3 className="mb-4 font-semibold">
                        Distribución de Ingresos
                    </h3>
                    <div className="h-52">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data.catDist}
                                    dataKey="amount"
                                    nameKey="label"
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={50}
                                    outerRadius={75}
                                    stroke="none"
                                >
                                    {data.catDist.map((_, i) => (
                                        <Cell
                                            key={i}
                                            fill={
                                                COLORS_CHART[
                                                    i % COLORS_CHART.length
                                                ]
                                            }
                                        />
                                    ))}
                                </Pie>
                                <Tooltip
                                    formatter={(v: number) => fmt(v)}
                                    contentStyle={{
                                        borderRadius: '8px',
                                        fontSize: '11px',
                                    }}
                                />
                                <Legend wrapperStyle={{ fontSize: '11px' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Top Tables */}
            <div className="grid gap-6 md:grid-cols-3">
                {/* Top Products */}
                <div className="rounded-xl border bg-white p-5 shadow-xs dark:border-neutral-800 dark:bg-neutral-900">
                    <h3 className="mb-3 font-semibold">🛒 Top Productos</h3>
                    {data.topProducts.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                            Sin ventas registradas.
                        </p>
                    ) : (
                        <div className="space-y-3">
                            {data.topProducts.map((p, i) => (
                                <div
                                    key={i}
                                    className="flex items-center justify-between"
                                >
                                    <div className="flex items-center gap-2">
                                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-green-100 text-xs font-bold text-green-700 dark:bg-green-900/30">
                                            {i + 1}
                                        </span>
                                        <div>
                                            <p className="text-sm font-medium">
                                                {p.name}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {p.total_qty} unidades
                                            </p>
                                        </div>
                                    </div>
                                    <span className="text-sm font-bold text-green-600">
                                        {fmt(p.total_revenue ?? 0)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                {/* Top Fields */}
                <div className="rounded-xl border bg-white p-5 shadow-xs dark:border-neutral-800 dark:bg-neutral-900">
                    <h3 className="mb-3 font-semibold">🏟 Top Canchas</h3>
                    {data.topFields.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                            Sin reservaciones.
                        </p>
                    ) : (
                        <div className="space-y-3">
                            {data.topFields.map((f, i) => (
                                <div
                                    key={i}
                                    className="flex items-center justify-between"
                                >
                                    <div className="flex items-center gap-2">
                                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700 dark:bg-blue-900/30">
                                            {i + 1}
                                        </span>
                                        <div>
                                            <p className="text-sm font-medium">
                                                {f.name}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {f.total_reservations} reservas
                                            </p>
                                        </div>
                                    </div>
                                    <span className="text-sm font-bold text-blue-600">
                                        {fmt(f.total_revenue ?? 0)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                {/* Top Clients */}
                <div className="rounded-xl border bg-white p-5 shadow-xs dark:border-neutral-800 dark:bg-neutral-900">
                    <h3 className="mb-3 font-semibold">👥 Mejores Clientes</h3>
                    {data.topClients.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                            Sin datos.
                        </p>
                    ) : (
                        <div className="space-y-3">
                            {data.topClients.map((c, i) => (
                                <div
                                    key={i}
                                    className="flex items-center justify-between"
                                >
                                    <div className="flex items-center gap-2">
                                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-purple-100 text-xs font-bold text-purple-700 dark:bg-purple-900/30">
                                            {i + 1}
                                        </span>
                                        <div>
                                            <p className="text-sm font-medium">
                                                {c.name}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {c.total_reservations} reservas
                                            </p>
                                        </div>
                                    </div>
                                    <span className="text-sm font-bold text-purple-600">
                                        {fmt(c.total_spent ?? 0)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Hours + Days */}
            <div className="grid gap-6 md:grid-cols-2">
                <div className="rounded-xl border bg-white p-5 shadow-xs dark:border-neutral-800 dark:bg-neutral-900">
                    <h3 className="mb-4 font-semibold">⏰ Horas Punta</h3>
                    <div className="h-48">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart
                                data={data.hoursData}
                                margin={{
                                    top: 4,
                                    right: 8,
                                    left: -24,
                                    bottom: 0,
                                }}
                            >
                                <defs>
                                    <linearGradient
                                        id="colorHours"
                                        x1="0"
                                        y1="0"
                                        x2="0"
                                        y2="1"
                                    >
                                        <stop
                                            offset="5%"
                                            stopColor="#3b82f6"
                                            stopOpacity={0.3}
                                        />
                                        <stop
                                            offset="95%"
                                            stopColor="#3b82f6"
                                            stopOpacity={0}
                                        />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    vertical={false}
                                    opacity={0.2}
                                />
                                <XAxis
                                    dataKey="name"
                                    tick={{ fontSize: 9 }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <YAxis
                                    tick={{ fontSize: 10 }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <Tooltip
                                    contentStyle={{
                                        borderRadius: '8px',
                                        fontSize: '11px',
                                    }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="reservas"
                                    stroke="#3b82f6"
                                    strokeWidth={2}
                                    fill="url(#colorHours)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                <div className="rounded-xl border bg-white p-5 shadow-xs dark:border-neutral-800 dark:bg-neutral-900">
                    <h3 className="mb-4 font-semibold">📅 Días Más Ocupados</h3>
                    <div className="h-48">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={data.daysData}
                                margin={{
                                    top: 4,
                                    right: 8,
                                    left: -24,
                                    bottom: 0,
                                }}
                            >
                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    vertical={false}
                                    opacity={0.2}
                                />
                                <XAxis
                                    dataKey="name"
                                    tick={{ fontSize: 11 }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <YAxis
                                    tick={{ fontSize: 10 }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <Tooltip
                                    contentStyle={{
                                        borderRadius: '8px',
                                        fontSize: '11px',
                                    }}
                                />
                                <Bar
                                    dataKey="reservas"
                                    fill="#a855f7"
                                    radius={[4, 4, 0, 0]}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Sales Tab ────────────────────────────────────────────────────────────────

function SalesView({ data }: { data: SalesData }) {
    const statusStyles: Record<string, string> = {
        boleta: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30',
        factura: 'bg-green-100 text-green-700 dark:bg-green-900/30',
    };
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
                <div className="col-span-2 sm:col-span-3 lg:col-span-2">
                    <KpiCard
                        label="Total Ventas"
                        value={fmt(data.totalSales)}
                        sub="Monto facturado total"
                        icon={DollarSign}
                        colorClass="text-green-600"
                        variant="accent"
                    />
                </div>
                <KpiCard
                    label="Subtotal (sin IGV)"
                    value={fmt(data.totalSubtotal)}
                    icon={FileText}
                    colorClass="text-amber-600"
                />
                <KpiCard
                    label="IGV Recaudado (18%)"
                    value={fmt(data.totalIgv)}
                    icon={TrendingUp}
                    colorClass="text-blue-600"
                />
                <div className="flex flex-col gap-3">
                    <div className="rounded-xl border bg-white p-3 shadow-xs dark:border-neutral-800 dark:bg-neutral-900">
                        <p className="text-xs text-muted-foreground">Boletas</p>
                        <p className="text-xl font-bold text-blue-600">
                            {data.boletasCount}
                        </p>
                    </div>
                    <div className="rounded-xl border bg-white p-3 shadow-xs dark:border-neutral-800 dark:bg-neutral-900">
                        <p className="text-xs text-muted-foreground">
                            Facturas
                        </p>
                        <p className="text-xl font-bold text-green-600">
                            {data.facturasCount}
                        </p>
                    </div>
                </div>
            </div>

            {data.dailySales.length > 0 && (
                <div className="rounded-xl border bg-white p-5 shadow-xs dark:border-neutral-800 dark:bg-neutral-900">
                    <h3 className="mb-4 font-semibold">Ventas Diarias</h3>
                    <div className="h-44">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={data.dailySales}
                                margin={{
                                    top: 4,
                                    right: 8,
                                    left: -20,
                                    bottom: 0,
                                }}
                            >
                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    vertical={false}
                                    opacity={0.2}
                                />
                                <XAxis
                                    dataKey="date"
                                    tick={{ fontSize: 10 }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <YAxis
                                    tick={{ fontSize: 10 }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <Tooltip
                                    formatter={(v: number) => fmt(v)}
                                    contentStyle={{
                                        borderRadius: '8px',
                                        fontSize: '11px',
                                    }}
                                />
                                <Bar
                                    dataKey="total"
                                    name="Ventas"
                                    fill="#16a34a"
                                    radius={[4, 4, 0, 0]}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            {/* Sales Table */}
            <div className="rounded-xl border bg-white shadow-xs dark:border-neutral-800 dark:bg-neutral-900">
                <div className="border-b px-5 py-4">
                    <h3 className="font-semibold">Detalle de Ventas</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b bg-gray-50 text-xs tracking-wide text-muted-foreground uppercase dark:bg-neutral-800">
                                <th className="px-4 py-3 text-left">
                                    N° Documento
                                </th>
                                <th className="px-4 py-3 text-left">Fecha</th>
                                <th className="px-4 py-3 text-left">Cliente</th>
                                <th className="px-4 py-3 text-right">
                                    Subtotal
                                </th>
                                <th className="px-4 py-3 text-right">IGV</th>
                                <th className="px-4 py-3 text-right">Total</th>
                                <th className="px-4 py-3 text-center">Tipo</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.sales.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={7}
                                        className="py-8 text-center text-muted-foreground"
                                    >
                                        Sin ventas en este periodo.
                                    </td>
                                </tr>
                            ) : (
                                data.sales.map((s, i) => (
                                    <tr
                                        key={s.id}
                                        className={`border-b transition-colors hover:bg-gray-50 dark:hover:bg-neutral-800/50 ${i % 2 === 0 ? '' : 'bg-gray-50/50 dark:bg-neutral-800/20'}`}
                                    >
                                        <td className="px-4 py-3 font-mono text-xs font-semibold">
                                            {s.sale_number}
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground">
                                            {format(
                                                parseISO(s.sold_at),
                                                'dd/MM/yyyy',
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <p className="font-medium">
                                                {s.customer_name}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {s.customer_doc_type.toUpperCase()}{' '}
                                                {s.customer_doc_number}
                                            </p>
                                        </td>
                                        <td className="px-4 py-3 text-right text-muted-foreground">
                                            {fmt(s.subtotal)}
                                        </td>
                                        <td className="px-4 py-3 text-right text-blue-600">
                                            {fmt(s.igv_amount)}
                                        </td>
                                        <td className="px-4 py-3 text-right font-bold text-green-600">
                                            {fmt(s.total)}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span
                                                className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusStyles[s.document_type] ?? 'bg-gray-100 text-gray-600'}`}
                                            >
                                                {s.document_type === 'boleta'
                                                    ? 'Boleta'
                                                    : 'Factura'}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                        {data.sales.length > 0 && (
                            <tfoot>
                                <tr className="border-t-2 border-green-200 bg-green-50 font-bold dark:border-green-900 dark:bg-green-900/10">
                                    <td
                                        colSpan={3}
                                        className="px-4 py-3 text-right text-green-700"
                                    >
                                        TOTAL
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        {fmt(data.totalSubtotal)}
                                    </td>
                                    <td className="px-4 py-3 text-right text-blue-600">
                                        {fmt(data.totalIgv)}
                                    </td>
                                    <td className="px-4 py-3 text-right text-base text-green-700">
                                        {fmt(data.totalSales)}
                                    </td>
                                    <td></td>
                                </tr>
                            </tfoot>
                        )}
                    </table>
                </div>
            </div>
        </div>
    );
}

// ─── Reservations Tab ─────────────────────────────────────────────────────────

function ReservationsView({ data }: { data: ReservationsData }) {
    const statusStyle: Record<string, string> = {
        completed: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30',
        confirmed: 'bg-green-100 text-green-700 dark:bg-green-900/30',
        pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30',
        cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/30',
    };
    const statusLabel: Record<string, string> = {
        completed: 'Completada',
        confirmed: 'Confirmada',
        pending: 'Pendiente',
        cancelled: 'Cancelada',
    };
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
                <div className="col-span-2 sm:col-span-3 lg:col-span-2">
                    <KpiCard
                        label="Ingreso por Reservas"
                        value={fmt(data.totalRevenue)}
                        sub="Confirmadas + Completadas"
                        icon={DollarSign}
                        colorClass="text-green-600"
                        variant="accent"
                    />
                </div>
                <KpiCard
                    label="Total Reservaciones"
                    value={data.totalCount.toString()}
                    icon={Calendar}
                    colorClass="text-blue-600"
                />
                <KpiCard
                    label="Completadas"
                    value={data.completedCount.toString()}
                    icon={TrendingUp}
                    colorClass="text-blue-600"
                />
                <KpiCard
                    label="Tasa Cancelación"
                    value={`${data.cancellationRate}%`}
                    sub={`${data.cancelledCount} canceladas`}
                    icon={TrendingDown}
                    colorClass="text-red-600"
                />
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <div className="rounded-xl border bg-white p-5 shadow-xs dark:border-neutral-800 dark:bg-neutral-900">
                    <h3 className="mb-4 font-semibold">
                        Distribución por Estado
                    </h3>
                    <div className="h-44">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data.byStatus}
                                    dataKey="count"
                                    nameKey="label"
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={40}
                                    outerRadius={65}
                                    stroke="none"
                                >
                                    {data.byStatus.map((s, i) => (
                                        <Cell key={i} fill={s.color} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{
                                        borderRadius: '8px',
                                        fontSize: '11px',
                                    }}
                                />
                                <Legend wrapperStyle={{ fontSize: '11px' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                <div className="rounded-xl border bg-white p-5 shadow-xs dark:border-neutral-800 dark:bg-neutral-900">
                    <h3 className="mb-4 font-semibold">
                        Top Canchas por Ingreso
                    </h3>
                    {data.topFields.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                            Sin datos.
                        </p>
                    ) : (
                        <div className="space-y-3">
                            {data.topFields.map((f, i) => {
                                const maxRev =
                                    data.topFields[0]?.total_revenue ?? 1;
                                const pct =
                                    maxRev > 0
                                        ? Math.round(
                                              ((f.total_revenue ?? 0) /
                                                  maxRev) *
                                                  100,
                                          )
                                        : 0;
                                return (
                                    <div key={i}>
                                        <div className="flex justify-between text-xs">
                                            <span className="font-medium">
                                                {f.name}
                                            </span>
                                            <span className="font-bold text-blue-600">
                                                {fmt(f.total_revenue ?? 0)}
                                            </span>
                                        </div>
                                        <div className="mt-1 h-2 rounded-full bg-gray-100 dark:bg-gray-800">
                                            <div
                                                className="h-2 rounded-full bg-blue-500 transition-all"
                                                style={{ width: `${pct}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Reservations Table */}
            <div className="rounded-xl border bg-white shadow-xs dark:border-neutral-800 dark:bg-neutral-900">
                <div className="border-b px-5 py-4">
                    <h3 className="font-semibold">Detalle de Reservaciones</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b bg-gray-50 text-xs tracking-wide text-muted-foreground uppercase dark:bg-neutral-800">
                                <th className="px-4 py-3 text-left">Código</th>
                                <th className="px-4 py-3 text-left">Fecha</th>
                                <th className="px-4 py-3 text-left">Cancha</th>
                                <th className="px-4 py-3 text-left">Cliente</th>
                                <th className="px-4 py-3 text-left">Horario</th>
                                <th className="px-4 py-3 text-right">Monto</th>
                                <th className="px-4 py-3 text-center">
                                    Estado
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.reservations.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={7}
                                        className="py-8 text-center text-muted-foreground"
                                    >
                                        Sin reservaciones en este periodo.
                                    </td>
                                </tr>
                            ) : (
                                data.reservations.map((r, i) => (
                                    <tr
                                        key={r.code}
                                        className={`border-b transition-colors hover:bg-gray-50 dark:hover:bg-neutral-800/50 ${i % 2 === 0 ? '' : 'bg-gray-50/50 dark:bg-neutral-800/20'}`}
                                    >
                                        <td className="px-4 py-3 font-mono text-xs font-semibold">
                                            {r.code}
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground">
                                            {format(
                                                parseISO(r.date),
                                                'dd/MM/yyyy',
                                                { locale: es },
                                            )}
                                        </td>
                                        <td className="px-4 py-3 font-medium">
                                            {r.field_name ?? '—'}
                                        </td>
                                        <td className="px-4 py-3">
                                            {r.client_name ?? (
                                                <span className="text-muted-foreground italic">
                                                    Sin cliente
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-xs whitespace-nowrap text-muted-foreground">
                                            {r.start_time?.slice(0, 5)} –{' '}
                                            {r.end_time?.slice(0, 5)}
                                        </td>
                                        <td className="px-4 py-3 text-right font-bold text-green-600">
                                            {fmt(r.amount)}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span
                                                className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusStyle[r.status] ?? 'bg-gray-100 text-gray-600'}`}
                                            >
                                                {statusLabel[r.status] ??
                                                    r.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

// ─── Expenses Tab ─────────────────────────────────────────────────────────────

function ExpensesView({ data }: { data: ExpensesData }) {
    const catColors = [
        '#ef4444',
        '#f97316',
        '#eab308',
        '#8b5cf6',
        '#06b6d4',
        '#ec4899',
        '#10b981',
        '#6366f1',
    ];
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                <div className="col-span-2 sm:col-span-1">
                    <KpiCard
                        label="Total Gastos"
                        value={fmt(data.totalAmount)}
                        sub="Total de egresos"
                        icon={TrendingDown}
                        colorClass="text-red-600"
                        variant="accent"
                    />
                </div>
                <KpiCard
                    label="Nº Transacciones"
                    value={data.totalCount.toString()}
                    icon={FileText}
                    colorClass="text-amber-600"
                />
                <KpiCard
                    label="Gasto Promedio"
                    value={fmt(data.avgAmount)}
                    sub="Por transacción"
                    icon={DollarSign}
                    colorClass="text-purple-600"
                />
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <div className="rounded-xl border bg-white p-5 shadow-xs dark:border-neutral-800 dark:bg-neutral-900">
                    <h3 className="mb-4 font-semibold">Gastos por Categoría</h3>
                    <div className="h-44">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={data.byCategory}
                                layout="vertical"
                                margin={{
                                    top: 4,
                                    right: 8,
                                    left: 40,
                                    bottom: 0,
                                }}
                            >
                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    horizontal={false}
                                    opacity={0.2}
                                />
                                <XAxis
                                    type="number"
                                    tick={{ fontSize: 10 }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <YAxis
                                    type="category"
                                    dataKey="category"
                                    tick={{ fontSize: 10 }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <Tooltip
                                    formatter={(v: number) => fmt(v)}
                                    contentStyle={{
                                        borderRadius: '8px',
                                        fontSize: '11px',
                                    }}
                                />
                                <Bar
                                    dataKey="total"
                                    name="Total"
                                    radius={[0, 4, 4, 0]}
                                >
                                    {data.byCategory.map((_, i) => (
                                        <Cell
                                            key={i}
                                            fill={
                                                catColors[i % catColors.length]
                                            }
                                        />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                <div className="rounded-xl border bg-white p-5 shadow-xs dark:border-neutral-800 dark:bg-neutral-900">
                    <h3 className="mb-4 font-semibold">Gasto Semanal</h3>
                    <div className="h-44">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={data.weeks}
                                margin={{
                                    top: 4,
                                    right: 8,
                                    left: -20,
                                    bottom: 0,
                                }}
                            >
                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    vertical={false}
                                    opacity={0.2}
                                />
                                <XAxis
                                    dataKey="label"
                                    tick={{ fontSize: 10 }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <YAxis
                                    tick={{ fontSize: 10 }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <Tooltip
                                    formatter={(v: number) => fmt(v)}
                                    contentStyle={{
                                        borderRadius: '8px',
                                        fontSize: '11px',
                                    }}
                                />
                                <Bar
                                    dataKey="total"
                                    name="Gastos"
                                    fill="#ef4444"
                                    radius={[4, 4, 0, 0]}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Expenses Table */}
            <div className="rounded-xl border bg-white shadow-xs dark:border-neutral-800 dark:bg-neutral-900">
                <div className="border-b px-5 py-4">
                    <h3 className="font-semibold">Detalle de Gastos</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b bg-gray-50 text-xs tracking-wide text-muted-foreground uppercase dark:bg-neutral-800">
                                <th className="px-4 py-3 text-left">Fecha</th>
                                <th className="px-4 py-3 text-left">
                                    Categoría
                                </th>
                                <th className="px-4 py-3 text-left">
                                    Descripción
                                </th>
                                <th className="px-4 py-3 text-right">
                                    Monto (S/)
                                </th>
                                <th className="px-4 py-3 text-left">Notas</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.expenses.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={5}
                                        className="py-8 text-center text-muted-foreground"
                                    >
                                        Sin gastos registrados.
                                    </td>
                                </tr>
                            ) : (
                                data.expenses.map((e, i) => (
                                    <tr
                                        key={e.id}
                                        className={`border-b transition-colors hover:bg-gray-50 dark:hover:bg-neutral-800/50 ${i % 2 === 0 ? '' : 'bg-gray-50/50 dark:bg-neutral-800/20'}`}
                                    >
                                        <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                                            {format(
                                                parseISO(e.date),
                                                'dd/MM/yyyy',
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700 dark:bg-red-900/30 dark:text-red-400">
                                                {e.category}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 font-medium">
                                            {e.description}
                                        </td>
                                        <td className="px-4 py-3 text-right font-bold text-red-600">
                                            {fmt(e.amount)}
                                        </td>
                                        <td className="px-4 py-3 text-xs text-muted-foreground">
                                            {e.notes ?? '—'}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ReportsIndex({
    reportType,
    month,
    week,
    docType,
    period,
    reportData,
}: ReportsPageProps) {
    const activeTab = reportType ?? 'executive';

    function navigate(params: Record<string, string>) {
        const base: Record<string, string> = {
            type: activeTab,
            month,
            doc_type: docType ?? 'all',
        };
        if (week) base.week = week;
        router.get(
            '/reports',
            { ...base, ...params },
            { preserveState: true, preserveScroll: true },
        );
    }

    function downloadPdf() {
        const params = new URLSearchParams({
            type: activeTab,
            month,
            doc_type: docType ?? 'all',
        });
        if (week) params.set('week', week);
        window.location.assign(`/reports/pdf?${params.toString()}`);
    }

    const currentTab = REPORT_TABS.find((t) => t.key === activeTab);

    return (
        <>
            <Head title="Reportes — Análisis Empresarial" />

            <div className="w-full space-y-5 px-4 pb-8">
                {/* ── Page Header ─────────────────────────────────────────── */}
                <div className="flex flex-col gap-4 rounded-xl border border-gray-100 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between dark:border-neutral-800 dark:bg-neutral-900">
                    <div>
                        <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900 dark:text-white">
                            <BarChart3 className="h-6 w-6 text-green-600" />
                            Reportes Empresariales
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Periodo:{' '}
                            <span className="font-medium text-foreground">
                                {format(parseISO(period.start), 'dd/MM/yyyy')} —{' '}
                                {format(parseISO(period.end), 'dd/MM/yyyy')}
                            </span>
                        </p>
                    </div>
                    <Button
                        onClick={downloadPdf}
                        className="gap-2 bg-green-600 text-white shadow-sm hover:bg-green-700"
                        id="btn-export-pdf"
                    >
                        <Download className="h-4 w-4" />
                        Exportar PDF
                    </Button>
                </div>

                {/* ── Filters ─────────────────────────────────────────────── */}
                <div className="flex flex-wrap items-end gap-4 rounded-xl border border-gray-100 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                    <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">
                            Mes
                        </Label>
                        <Input
                            type="month"
                            value={month}
                            onChange={(e) =>
                                navigate({ month: e.target.value, week: '' })
                            }
                            className="h-9 w-40"
                            id="filter-month"
                        />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">
                            Semana
                        </Label>
                        <Input
                            type="week"
                            value={week ?? ''}
                            onChange={(e) => navigate({ week: e.target.value })}
                            className="h-9 w-44"
                            id="filter-week"
                        />
                    </div>
                    {activeTab === 'sales' && (
                        <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">
                                Tipo de Documento
                            </Label>
                            <select
                                value={docType ?? 'all'}
                                onChange={(e) =>
                                    navigate({ doc_type: e.target.value })
                                }
                                className="h-9 rounded-md border border-input bg-background px-3 text-sm focus:ring-2 focus:ring-ring focus:outline-none"
                                id="filter-doc-type"
                            >
                                <option value="all">Todos</option>
                                <option value="boleta">Solo Boletas</option>
                                <option value="factura">Solo Facturas</option>
                            </select>
                        </div>
                    )}
                </div>

                {/* ── Report Type Tabs ─────────────────────────────────────── */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {REPORT_TABS.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.key;
                        return (
                            <button
                                key={tab.key}
                                id={`tab-${tab.key}`}
                                onClick={() => navigate({ type: tab.key })}
                                className={`flex items-center gap-2.5 rounded-xl border p-4 text-left transition-all hover:shadow-md ${
                                    isActive
                                        ? 'border-green-200 bg-green-50 shadow-sm dark:border-green-800 dark:bg-green-900/20'
                                        : 'border-gray-100 bg-white hover:border-gray-200 dark:border-neutral-800 dark:bg-neutral-900'
                                }`}
                            >
                                <Icon
                                    className={`h-5 w-5 shrink-0 ${isActive ? 'text-green-600' : tab.color}`}
                                />
                                <span
                                    className={`text-sm font-medium ${isActive ? 'text-green-700 dark:text-green-400' : ''}`}
                                >
                                    {tab.label}
                                </span>
                            </button>
                        );
                    })}
                </div>

                {/* ── Report Content ───────────────────────────────────────── */}
                {activeTab === 'executive' && (
                    <ExecutiveView data={reportData as ExecutiveData} />
                )}
                {activeTab === 'sales' && (
                    <SalesView data={reportData as SalesData} />
                )}
                {activeTab === 'reservations' && (
                    <ReservationsView data={reportData as ReservationsData} />
                )}
                {activeTab === 'expenses' && (
                    <ExpensesView data={reportData as ExpensesData} />
                )}
            </div>
        </>
    );
}

ReportsIndex.layout = {
    breadcrumbs: [{ title: 'Reportes', href: '/reports' }],
};
