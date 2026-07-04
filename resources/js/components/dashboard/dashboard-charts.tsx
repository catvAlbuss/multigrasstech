import {
    Bar,
    BarChart,
    Cell,
    Line,
    LineChart as RechartsLineChart,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import type { DashboardPageProps } from '@/types/dashboard';
import { CATEGORY_COLORS } from './constants';
import { formatCurrency } from './utils';

type RealData = NonNullable<DashboardPageProps['real_data']>;
type LineChartData = RealData['lineChartData'];
type CategoryDistribution = RealData['categoryDistribution'];
type ReservationsBySport = RealData['reservationsBySport'];

const panelClass =
    'rounded-lg border border-white/10 bg-slate-950/70 p-5 shadow-[0_18px_50px_rgba(0,0,0,0.28)]';

export function DashboardLineChart({ data }: { data?: LineChartData }) {
    if (!data) {
        return null;
    }

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="rounded-lg border border-white/10 bg-slate-950 p-3 shadow-xl">
                    <p className="mb-2 text-sm font-medium text-white">
                        {label}
                    </p>
                    <div className="flex flex-col gap-1">
                        <span className="text-sm font-medium text-emerald-400">
                            Ingresos: {formatCurrency(payload[0].value)}
                        </span>
                        <span className="text-sm font-medium text-red-400">
                            Gastos: {formatCurrency(payload[1].value)}
                        </span>
                    </div>
                </div>
            );
        }

        return null;
    };

    return (
        <section className={`${panelClass} lg:col-span-5`}>
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h2 className="font-semibold text-white">
                        Ingresos vs. gastos
                    </h2>
                    <p className="text-xs text-slate-400">
                        Comportamiento de los últimos 11 días
                    </p>
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-400">
                    <span className="flex items-center gap-1.5">
                        <span className="size-2 rounded-full bg-emerald-400" />
                        Ingresos
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="size-2 rounded-full bg-red-400" />
                        Gastos
                    </span>
                </div>
            </div>

            <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <RechartsLineChart
                        data={data}
                        margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <XAxis
                            dataKey="label"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 11, fill: '#94a3b8' }}
                            dy={10}/>
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 11, fill: '#94a3b8' }}
                            tickFormatter={(value) =>
                                `S/ ${(value / 1000).toFixed(1)}k`
                            }/>
                        <Tooltip
                            content={<CustomTooltip />}
                            cursor={{
                                stroke: '#334155',
                                strokeWidth: 1,
                                strokeDasharray: '4 4',
                            }}/>
                        <Line
                            type="monotone"
                            dataKey="income"
                            stroke="#34d399"
                            strokeWidth={3}
                            dot={false}
                            activeDot={{
                                r: 5,
                                strokeWidth: 0,
                                fill: '#34d399',
                            }}/>
                        <Line
                            type="monotone"
                            dataKey="expense"
                            stroke="#f87171"
                            strokeWidth={3}
                            dot={false}
                            activeDot={{
                                r: 5,
                                strokeWidth: 0,
                                fill: '#f87171',
                            }}
                        />
                    </RechartsLineChart>
                </ResponsiveContainer>
            </div>
        </section>
    );
}

export function CategoryChart({
    categories,
}: {
    categories?: CategoryDistribution;
}) {
    if (!categories) {
        return null;
    }

    const total = categories.reduce((sum, category) => {
        return sum + (category.amount ?? 0);
    }, 0);

    return (
        <section className={`${panelClass} lg:col-span-3`}>
            <div>
                <h2 className="font-semibold text-white">
                    Ingresos por categoría
                </h2>
                <p className="text-xs text-slate-400">
                    Distribución del mes actual
                </p>
            </div>
            <div className="mt-6 grid gap-6 sm:grid-cols-[170px_1fr] lg:grid-cols-1 xl:grid-cols-[170px_1fr]">
                <div className="relative h-44">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={categories}
                                cx="50%"
                                cy="50%"
                                innerRadius={58}
                                outerRadius={82}
                                stroke="none"
                                dataKey="value"
                            >
                                {categories.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={
                                            CATEGORY_COLORS[entry.color] ||
                                            '#94a3b8'
                                        }
                                    />
                                ))}
                            </Pie>
                            <Tooltip
                                formatter={(value, name, item: any) => [
                                    `${Number(value).toFixed(1)}%`,
                                    item.payload.label,
                                ]}
                                contentStyle={{
                                    background: '#020617',
                                    border: '1px solid rgba(255,255,255,.1)',
                                    borderRadius: 8,
                                    color: '#fff',
                                }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-xs text-slate-400">Total</span>
                        <span className="text-lg font-bold text-white">
                            {formatCurrency(total)}
                        </span>
                    </div>
                </div>

                <div className="flex flex-col justify-center gap-3">
                    {categories.map((category) => (
                        <div
                            key={category.label}
                            className="flex items-center justify-between gap-4 text-sm"
                        >
                            <div className="flex items-center gap-2">
                                <span
                                    className={`size-3 rounded-full ${category.color}`}
                                />
                                <span className="text-slate-300">
                                    {category.label}
                                </span>
                            </div>
                            <div className="text-right">
                                <p className="font-semibold text-white">
                                    {category.value.toFixed(1)}%
                                </p>
                                <p className="text-xs text-slate-400">
                                    {formatCurrency(category.amount ?? 0)}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

export function ReservationsBySportChart({
    data,
}: {
    data?: ReservationsBySport;
}) {
    const chartData = data?.length
        ? data
        : [{ label: 'Sin reservas', value: 0 }];

    return (
        <section className={`${panelClass} lg:col-span-2`}>
            <div>
                <h2 className="font-semibold text-white">
                    Reservas por deporte
                </h2>
                <p className="text-xs text-slate-400">Hoy</p>
            </div>
            <div className="mt-6 h-56">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                        <XAxis
                            dataKey="label"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 11, fill: '#94a3b8' }}
                        />
                        <YAxis
                            allowDecimals={false}
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 11, fill: '#94a3b8' }}
                        />
                        <Tooltip
                            cursor={{ fill: 'rgba(148,163,184,.08)' }}
                            contentStyle={{
                                background: '#020617',
                                border: '1px solid rgba(255,255,255,.1)',
                                borderRadius: 8,
                                color: '#fff',
                            }}
                        />
                        <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                            {chartData.map((_, index) => (
                                <Cell
                                    key={index}
                                    fill={
                                        ['#34d399', '#60a5fa', '#fbbf24'][
                                            index % 3
                                        ]
                                    }
                                />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </section>
    );
}
