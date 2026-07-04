import {
    BarChart3,
    CalendarDays,
    CircleCheck,
    CircleDot,
    Package,
    Trophy,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { DashboardPageProps } from '@/types/dashboard';
import { formatCurrency } from './utils';

type OperationalData = DashboardPageProps['real_data'];

const panelClass =
    'rounded-lg border border-white/10 bg-slate-950/70 p-5 shadow-[0_18px_50px_rgba(0,0,0,0.28)]';

export function OperationalSummary({ data }: { data?: OperationalData }) {
    if (!data) {
        return null;
    }

    return (
        <div className="grid gap-4 xl:grid-cols-4">
            <section className={panelClass}>
                <PanelTitle
                    icon={CalendarDays}
                    title="Próximas reservas"
                    action="Ver todas"
                />
                <div className="mt-4 divide-y divide-white/10 rounded-lg border border-white/10">
                    {data.upcomingReservations.length === 0 ? (
                        <EmptyState>No hay próximas reservas</EmptyState>
                    ) : (
                        data.upcomingReservations.map((reservation, i) => (
                            <div
                                key={`${reservation.field}-${reservation.time}-${i}`}
                                className="grid grid-cols-[74px_1fr_auto] items-center gap-3 px-3 py-3"
                            >
                                <div>
                                    <p className="text-xs text-slate-400">
                                        {reservation.date}
                                    </p>
                                    <p className="text-lg font-bold text-white">
                                        {reservation.time}
                                    </p>
                                </div>
                                <div className="min-w-0">
                                    <p className="truncate text-sm font-semibold text-white">
                                        {reservation.field}
                                    </p>
                                    <p className="text-xs text-slate-400">
                                        Reserva programada
                                    </p>
                                </div>
                                <StatusPill status={reservation.status} />
                            </div>
                        ))
                    )}
                </div>
            </section>

            <section className={panelClass}>
                <PanelTitle icon={Trophy} title="Canchas más usadas" />
                <div className="mt-5 space-y-4">
                    {data.fieldUsage.length === 0 ? (
                        <EmptyState>No hay uso registrado</EmptyState>
                    ) : (
                        data.fieldUsage.map((field, index) => (
                            <div
                                key={field.name}
                                className="grid grid-cols-[20px_1fr_auto] items-center gap-3"
                            >
                                <span className="text-sm font-semibold text-slate-400">
                                    {index + 1}
                                </span>
                                <div className="min-w-0">
                                    <div className="mb-2 flex items-center justify-between gap-3">
                                        <p className="truncate text-sm font-medium text-white">
                                            {field.name}
                                        </p>
                                        <p className="text-xs text-slate-400">
                                            {field.reservations} reservas
                                        </p>
                                    </div>
                                    <div className="h-1.5 overflow-hidden rounded-full bg-slate-800">
                                        <div
                                            className="h-full rounded-full bg-emerald-400"
                                            style={{
                                                width: `${field.percentage}%`,
                                            }}
                                        />
                                    </div>
                                </div>
                                <span className="text-sm font-semibold text-white">
                                    {field.percentage}%
                                </span>
                            </div>
                        ))
                    )}
                </div>
            </section>

            <section className={panelClass}>
                <PanelTitle icon={Package} title="Productos destacados" />
                <div className="mt-5 space-y-4">
                    {data.topProducts.length === 0 ? (
                        <EmptyState>No hay ventas registradas</EmptyState>
                    ) : (
                        data.topProducts.map((product) => (
                            <div
                                key={product.name}
                                className="flex items-center gap-3"
                            >
                                <div
                                    className={`flex size-10 shrink-0 items-center justify-center rounded-full ${product.color}`}
                                >
                                    <Package className="size-5" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-semibold text-white">
                                        {product.name}
                                    </p>
                                    <p className="text-xs text-slate-400">
                                        {product.units} unidades
                                    </p>
                                </div>
                                <p className="text-sm font-semibold text-white">
                                    {formatCurrency(product.amount)}
                                </p>
                            </div>
                        ))
                    )}
                </div>
            </section>

            <section className={panelClass}>
                <PanelTitle
                    icon={BarChart3}
                    title="Actividad reciente"
                    action="Ver todas"
                />
                <div className="mt-5 space-y-4">
                    {data.recentActivity.length === 0 ? (
                        <EmptyState>No hay actividad reciente</EmptyState>
                    ) : (
                        data.recentActivity.map((activity, i) => (
                            <div
                                key={`${activity.label}-${i}`}
                                className="flex items-center gap-3"
                            >
                                <span
                                    className={`size-2.5 shrink-0 rounded-full ${activity.color}`}
                                />
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-semibold text-white">
                                        {activity.label}
                                    </p>
                                    <p className="text-xs text-slate-400">
                                        {activity.time}
                                    </p>
                                </div>
                                <CircleDot className="size-4 text-emerald-400" />
                            </div>
                        ))
                    )}
                </div>
            </section>
        </div>
    );
}

function PanelTitle({
    icon: Icon,
    title,
    action,
}: {
    icon: LucideIcon;
    title: string;
    action?: string;
}) {
    return (
        <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
                <Icon className="size-4 text-slate-300" />
                <h2 className="font-semibold text-white">{title}</h2>
            </div>
            {action && (
                <button className="rounded-md border border-white/10 px-3 py-1 text-xs font-medium text-slate-300">
                    {action}
                </button>
            )}
        </div>
    );
}

function StatusPill({ status }: { status?: string }) {
    const isPending = status === 'pending';

    return (
        <span
            className={
                isPending
                    ? 'rounded-md border border-amber-400/30 bg-amber-400/10 px-2 py-1 text-xs font-medium text-amber-300'
                    : 'rounded-md border border-emerald-400/30 bg-emerald-400/10 px-2 py-1 text-xs font-medium text-emerald-300'
            }
        >
            <span className="inline-flex items-center gap-1">
                <CircleCheck className="size-3" />
                {isPending ? 'Pendiente' : 'Confirmada'}
            </span>
        </span>
    );
}

function EmptyState({ children }: { children: string }) {
    return <p className="py-4 text-sm text-slate-400">{children}</p>;
}
