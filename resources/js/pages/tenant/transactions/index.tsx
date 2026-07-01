import { Head, useForm } from '@inertiajs/react';
import { format, parseISO } from 'date-fns';
import { 
    TrendingUp, TrendingDown, DollarSign, Package, CalendarDays, Clock, Users, ArrowRight, Filter
} from 'lucide-react';
import { 
    LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, AreaChart, Area, Cell, PieChart, Pie
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface DashboardData {
    totals: {
        income: number;
        expense: number;
        balance: number;
    };
    topProducts: Array<{ name: string; total_quantity: string; total_sales: string }>;
    topFields: Array<{ name: string; total_reservations: number; total_revenue: string }>;
    topExpenses: Array<{ id: number; description: string; category: string; amount: string; date: string }>;
    topClients: Array<{ name: string; total_reservations: number; total_spent: string }>;
    busiestHours: Array<{ name: string; reservas: number }>;
    busiestDays: Array<{ name: string; reservas: number }>;
}

interface Props {
    dashboard: DashboardData;
    filters: {
        start_date: string;
        end_date: string;
    };
}

export default function FinanzasDashboard({ dashboard, filters }: Props) {
    const { data, setData, get, processing } = useForm({
        start_date: filters.start_date,
        end_date: filters.end_date,
    });

    const handleFilter = (e: React.FormEvent) => {
        e.preventDefault();
        get('/transactions');
    };

    const formatMoney = (amount: number | string) => {
        return `S/ ${Number(amount).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const COLORS = ['#16a34a', '#22c55e', '#4ade80', '#86efac', '#bbf7d0'];

    return (
        <>
            <Head title="Finanzas - Dashboard Analítico" />

            <div className="w-full space-y-4 px-4">
                {/* Header & Filters */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white dark:bg-neutral-900 p-6 rounded-xl border border-gray-100 dark:border-neutral-800 shadow-sm">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Finanzas y Analítica</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Analiza el rendimiento de tu negocio</p>
                    </div>

                    <form onSubmit={handleFilter} className="flex flex-wrap items-end gap-4">
                        <div className="space-y-1">
                            <Label htmlFor="start_date" className="text-xs text-gray-500">Fecha Inicio</Label>
                            <Input 
                                id="start_date" 
                                type="date" 
                                value={data.start_date} 
                                onChange={e => setData('start_date', e.target.value)}
                                className="h-10"
                            />
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="end_date" className="text-xs text-gray-500">Fecha Fin</Label>
                            <Input 
                                id="end_date" 
                                type="date" 
                                value={data.end_date} 
                                onChange={e => setData('end_date', e.target.value)}
                                className="h-10"
                            />
                        </div>
                        <Button type="submit" disabled={processing} className="h-10 bg-green-600 hover:bg-green-700">
                            <Filter className="w-4 h-4 mr-2" />
                            Filtrar
                        </Button>
                    </form>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white dark:bg-neutral-900 rounded-xl p-6 border border-gray-100 dark:border-neutral-800 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <TrendingUp className="w-16 h-16 text-green-600" />
                        </div>
                        <p className="text-sm font-medium text-gray-500 mb-1">Ingresos Totales</p>
                        <h3 className="text-3xl font-bold text-green-600 dark:text-green-500">{formatMoney(dashboard.totals.income)}</h3>
                        <p className="text-xs text-gray-400 mt-2">En el periodo seleccionado</p>
                    </div>

                    <div className="bg-white dark:bg-neutral-900 rounded-xl p-6 border border-gray-100 dark:border-neutral-800 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <TrendingDown className="w-16 h-16 text-red-600" />
                        </div>
                        <p className="text-sm font-medium text-gray-500 mb-1">Gastos Totales</p>
                        <h3 className="text-3xl font-bold text-red-600 dark:text-red-500">{formatMoney(dashboard.totals.expense)}</h3>
                        <p className="text-xs text-gray-400 mt-2">En el periodo seleccionado</p>
                    </div>

                    <div className="bg-gradient-to-br from-green-700 to-green-900 rounded-xl p-6 border border-green-800 shadow-sm relative overflow-hidden text-white">
                        <div className="absolute top-0 right-0 p-4 opacity-20">
                            <DollarSign className="w-16 h-16 text-white" />
                        </div>
                        <p className="text-sm font-medium text-green-100 mb-1">Balance Neto</p>
                        <h3 className="text-3xl font-bold">{formatMoney(dashboard.totals.balance)}</h3>
                        <p className="text-xs text-green-200 mt-2">Ingresos menos Gastos</p>
                    </div>
                </div>

                {/* Charts Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    
                    {/* Busiest Hours */}
                    <div className="bg-white dark:bg-neutral-900 rounded-xl p-6 border border-gray-100 dark:border-neutral-800 shadow-sm">
                        <div className="flex items-center gap-2 mb-6">
                            <Clock className="w-5 h-5 text-blue-500" />
                            <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">Horas Punta (Reservas)</h2>
                        </div>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={dashboard.busiestHours} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorReservas" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.2} />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                                    <RechartsTooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                    <Area type="monotone" dataKey="reservas" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorReservas)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Busiest Days */}
                    <div className="bg-white dark:bg-neutral-900 rounded-xl p-6 border border-gray-100 dark:border-neutral-800 shadow-sm">
                        <div className="flex items-center gap-2 mb-6">
                            <CalendarDays className="w-5 h-5 text-purple-500" />
                            <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">Días más ocupados</h2>
                        </div>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={dashboard.busiestDays} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.2} />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                    <YAxis axisLine={false} tickLine={false} />
                                    <RechartsTooltip cursor={{ fill: '#374151', opacity: 0.1 }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                    <Bar dataKey="reservas" fill="#a855f7" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                </div>

                {/* Lists Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    
                    {/* Top Products */}
                    <div className="bg-white dark:bg-neutral-900 rounded-xl p-6 border border-gray-100 dark:border-neutral-800 shadow-sm flex flex-col">
                        <div className="flex items-center gap-2 mb-4 pb-4 border-b border-gray-100 dark:border-neutral-800">
                            <Package className="w-5 h-5 text-orange-500" />
                            <h2 className="text-base font-bold text-gray-800 dark:text-gray-100">Productos Top</h2>
                        </div>
                        <div className="flex-1 space-y-4">
                            {dashboard.topProducts.length === 0 ? (
                                <p className="text-sm text-gray-500">No hay ventas registradas.</p>
                            ) : dashboard.topProducts.map((p, i) => (
                                <div key={i} className="flex justify-between items-center">
                                    <div>
                                        <p className="font-medium text-sm text-gray-800 dark:text-gray-200">{p.name}</p>
                                        <p className="text-xs text-gray-500">{p.total_quantity} unidades</p>
                                    </div>
                                    <p className="font-bold text-sm text-gray-900 dark:text-white">{formatMoney(p.total_sales)}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Top Fields */}
                    <div className="bg-white dark:bg-neutral-900 rounded-xl p-6 border border-gray-100 dark:border-neutral-800 shadow-sm flex flex-col">
                        <div className="flex items-center gap-2 mb-4 pb-4 border-b border-gray-100 dark:border-neutral-800">
                            <CalendarDays className="w-5 h-5 text-green-500" />
                            <h2 className="text-base font-bold text-gray-800 dark:text-gray-100">Campos Más Usados</h2>
                        </div>
                        <div className="flex-1 space-y-4">
                            {dashboard.topFields.length === 0 ? (
                                <p className="text-sm text-gray-500">No hay reservas registradas.</p>
                            ) : dashboard.topFields.map((f, i) => (
                                <div key={i} className="flex justify-between items-center">
                                    <div>
                                        <p className="font-medium text-sm text-gray-800 dark:text-gray-200">{f.name}</p>
                                        <p className="text-xs text-gray-500">{f.total_reservations} reservas</p>
                                    </div>
                                    <p className="font-bold text-sm text-gray-900 dark:text-white">{formatMoney(f.total_revenue)}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Top Clients */}
                    <div className="bg-white dark:bg-neutral-900 rounded-xl p-6 border border-gray-100 dark:border-neutral-800 shadow-sm flex flex-col">
                        <div className="flex items-center gap-2 mb-4 pb-4 border-b border-gray-100 dark:border-neutral-800">
                            <Users className="w-5 h-5 text-indigo-500" />
                            <h2 className="text-base font-bold text-gray-800 dark:text-gray-100">Mejores Clientes</h2>
                        </div>
                        <div className="flex-1 space-y-4">
                            {dashboard.topClients.length === 0 ? (
                                <p className="text-sm text-gray-500">No hay clientes con reservas.</p>
                            ) : dashboard.topClients.map((c, i) => (
                                <div key={i} className="flex justify-between items-center">
                                    <div>
                                        <p className="font-medium text-sm text-gray-800 dark:text-gray-200">{c.name}</p>
                                        <p className="text-xs text-gray-500">{c.total_reservations} reservas</p>
                                    </div>
                                    <p className="font-bold text-sm text-indigo-600 dark:text-indigo-400">{formatMoney(c.total_spent)}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Top Expenses */}
                    <div className="bg-white dark:bg-neutral-900 rounded-xl p-6 border border-gray-100 dark:border-neutral-800 shadow-sm flex flex-col">
                        <div className="flex items-center gap-2 mb-4 pb-4 border-b border-gray-100 dark:border-neutral-800">
                            <TrendingDown className="w-5 h-5 text-red-500" />
                            <h2 className="text-base font-bold text-gray-800 dark:text-gray-100">Mayores Gastos</h2>
                        </div>
                        <div className="flex-1 space-y-4">
                            {dashboard.topExpenses.length === 0 ? (
                                <p className="text-sm text-gray-500">No hay gastos registrados.</p>
                            ) : dashboard.topExpenses.map((e, i) => (
                                <div key={i} className="flex flex-col gap-1">
                                    <div className="flex justify-between items-start">
                                        <p className="font-medium text-sm text-gray-800 dark:text-gray-200 line-clamp-1 flex-1 pr-2" title={e.description}>{e.description}</p>
                                        <p className="font-bold text-sm text-red-600 dark:text-red-400 whitespace-nowrap">{formatMoney(e.amount)}</p>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] uppercase tracking-wider font-semibold text-gray-400 bg-gray-100 dark:bg-neutral-800 px-2 py-0.5 rounded-full">{e.category}</span>
                                        <span className="text-[10px] text-gray-400">{format(parseISO(e.date), 'dd MMM yyyy')}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>

            </div>
        </>
    );
}

FinanzasDashboard.layout = {
    breadcrumbs: [
        { title: 'Finanzas', href: '/transactions' },
    ],
};
