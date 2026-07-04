import {
    CalendarDays,
    DollarSign,
    LayoutGrid,
    ReceiptText,
    UserCheck,
    Users,
} from 'lucide-react';
import type { ReactNode } from 'react';
import type { DashboardPageProps, DashboardViewProps } from '@/types/dashboard';
import {
    CategoryChart,
    DashboardLineChart,
    ReservationsBySportChart,
} from './dashboard-charts';
import { DashboardHeader } from './dashboard-header';
import { KpiCard } from './kpi-card';
import { OperationalSummary } from './operational-summary';
import { formatCurrency } from './utils';

type DashboardRoleViewProps = DashboardViewProps & {
    real_data?: DashboardPageProps['real_data'];
};

function DashboardSurface({ children }: { children: ReactNode }) {
    return (
        <div className="min-h-[calc(100svh-4rem)] px-4 py-6 text-slate-100 sm:px-6 lg:px-8">
            <div className="mx-auto flex max-w-[1680px] flex-col gap-5">
                {children}
            </div>
        </div>
    );
}

export function AdminView({
    auth,
    tenant,
    stats,
    role,
    real_data,
}: DashboardRoleViewProps) {
    return (
        <DashboardSurface>
            <DashboardHeader auth={auth} tenant={tenant} role={role} />

            <div className="grid gap-3 grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
                <KpiCard
                    label="Ingresos del mes"
                    value={formatCurrency(stats.monthly_revenue)}
                    detail="rendimiento actual"
                    trend={stats.trends.monthly_revenue}
                    icon={DollarSign}
                    accent="bg-emerald-500/15 text-emerald-300"
                />
                <KpiCard
                    label="Gastos del mes"
                    value={formatCurrency(stats.monthly_expense)}
                    detail="salidas registradas"
                    trend={stats.trends.monthly_expense}
                    icon={ReceiptText}
                    accent="bg-red-500/15 text-red-300"
                />
                <KpiCard
                    label="Reservas de hoy"
                    value={stats.reservations_today}
                    detail="programadas para hoy"
                    trend={stats.trends.reservations_today}
                    icon={CalendarDays}
                    accent="bg-blue-500/15 text-blue-300"
                />
                <KpiCard
                    label="Clientes registrados"
                    value={stats.client_count}
                    detail="total en sistema"
                    trend={stats.trends.client_count}
                    icon={Users}
                    accent="bg-violet-500/15 text-violet-300"
                />
                <KpiCard
                    label="Ocupación de canchas"
                    value={`${stats.field_occupancy.percentage}%`}
                    detail={`${stats.field_occupancy.occupied} de ${stats.field_occupancy.total} canchas ocupadas`}
                    icon={LayoutGrid}
                    accent="bg-emerald-500/15 text-emerald-300"
                    progress={stats.field_occupancy.percentage}
                />
            </div>

            <div className="grid gap-4 lg:grid-cols-10">
                <DashboardLineChart data={real_data?.lineChartData} />
                <CategoryChart categories={real_data?.categoryDistribution} />
                <ReservationsBySportChart
                    data={real_data?.reservationsBySport}
                />
            </div>

            <OperationalSummary data={real_data} />
        </DashboardSurface>
    );
}

export function OperatorView({
    auth,
    tenant,
    stats,
    role,
    real_data,
}: DashboardRoleViewProps) {
    return (
        <DashboardSurface>
            <DashboardHeader auth={auth} tenant={tenant} role={role} />
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <KpiCard
                    label="Campos disponibles"
                    value={stats.field_count}
                    detail="operación actual"
                    trend={stats.trends.field_count}
                    icon={LayoutGrid}
                    accent="bg-emerald-500/15 text-emerald-300"
                />
                <KpiCard
                    label="Reservas para hoy"
                    value={stats.reservations_today}
                    detail="agenda diaria"
                    trend={stats.trends.reservations_today}
                    icon={CalendarDays}
                    accent="bg-blue-500/15 text-blue-300"
                />
                <KpiCard
                    label="Asistencias hoy"
                    value={stats.clients_today}
                    detail="control de acceso"
                    trend={stats.trends.clients_today}
                    icon={UserCheck}
                    accent="bg-violet-500/15 text-violet-300"
                />
                <KpiCard
                    label="Ocupación de canchas"
                    value={`${stats.field_occupancy.percentage}%`}
                    detail={`${stats.field_occupancy.occupied} de ${stats.field_occupancy.total} canchas ocupadas`}
                    icon={LayoutGrid}
                    accent="bg-emerald-500/15 text-emerald-300"
                    progress={stats.field_occupancy.percentage}
                />
            </div>
            <OperationalSummary data={real_data} />
        </DashboardSurface>
    );
}

export function ViewerView({
    auth,
    tenant,
    stats,
    role,
    real_data,
}: DashboardRoleViewProps) {
    return (
        <DashboardSurface>
            <DashboardHeader auth={auth} tenant={tenant} role={role} />
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                <KpiCard
                    label="Campos activos"
                    value={stats.field_count}
                    detail="resumen actual"
                    trend={stats.trends.field_count}
                    icon={LayoutGrid}
                    accent="bg-emerald-500/15 text-emerald-300"
                />
                <KpiCard
                    label="Reservas del mes"
                    value={stats.reservations_today}
                    detail="vista general"
                    trend={stats.trends.reservations_today}
                    icon={CalendarDays}
                    accent="bg-blue-500/15 text-blue-300"
                />
                <KpiCard
                    label="Ocupación de canchas"
                    value={`${stats.field_occupancy.percentage}%`}
                    detail={`${stats.field_occupancy.occupied} de ${stats.field_occupancy.total} canchas ocupadas`}
                    icon={LayoutGrid}
                    accent="bg-emerald-500/15 text-emerald-300"
                    progress={stats.field_occupancy.percentage}
                />
            </div>
            <div className="grid gap-4 lg:grid-cols-8">
                <DashboardLineChart data={real_data?.lineChartData} />
                <CategoryChart categories={real_data?.categoryDistribution} />
            </div>
        </DashboardSurface>
    );
}
