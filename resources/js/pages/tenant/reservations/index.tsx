import { Head, Link, router, usePage } from '@inertiajs/react';
import { addDays, addMonths, addWeeks, format, isToday, parseISO, subDays, subMonths, subWeeks } from 'date-fns';
import {
    CalendarDays,
    CalendarPlus,
    Check,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Clock3,
    CreditCard,
    Layers,
    Pencil,
    Plus,
    RotateCcw,
    Search,
    Trash2,
    User,
    XCircle,
} from 'lucide-react';
import {
    Fragment,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import type {ElementType, FormEvent, ReactNode} from 'react';
import { toast } from 'sonner';
import Swal from 'sweetalert2';
import { ReservationCheckoutDialog } from '@/components/reservations/reservation-checkout-dialog';
import { ReservationMonthView } from '@/components/reservations/reservation-month-view';
import { ReservationQuickModal } from '@/components/reservations/reservation-quick-modal';
import { ReservationWeekStrip } from '@/components/reservations/reservation-week-strip';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type {
    ReservationsIndexPageProps as Props,
    TenantReservation as Reservation,
} from '@/types/tenant';

type CalendarView = 'day' | 'week' | 'month';

type QuickModalState = {
    open: boolean;
    fieldId?: number;
    date?: string;
    startTime?: string;
};

const STATUS_LABELS: Record<string, string> = {
    pending: 'Pendiente',
    confirmed: 'Confirmada',
    completed: 'Completada',
    cancelled: 'Cancelada',
};

const STATUS_STYLES: Record<string, string> = {
    pending: 'border-amber-400/30 bg-amber-500/12 text-amber-300',
    confirmed: 'border-emerald-400/30 bg-emerald-500/12 text-emerald-300',
    completed: 'border-blue-400/30 bg-blue-500/12 text-blue-300',
    cancelled: 'border-red-400/30 bg-red-500/12 text-red-300',
};

const STATUS_DOT: Record<string, string> = {
    pending: 'bg-amber-400',
    confirmed: 'bg-emerald-400',
    completed: 'bg-blue-400',
    cancelled: 'bg-red-400',
};

function money(value: string | number | null | undefined) {
    return `S/ ${Number(value ?? 0).toLocaleString('es-PE', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;
}

function ReservationStatus({ status }: { status: string }) {
    return (
        <span
            className={`inline-flex h-7 shrink-0 items-center gap-1.5 rounded-md border px-2.5 text-xs font-black ${
                STATUS_STYLES[status] ?? 'border-white/10 bg-white/[0.04] text-slate-300'
            }`}
        >
            <span
                className={`size-1.5 rounded-full ${
                    STATUS_DOT[status] ?? 'bg-slate-400'
                }`}
            />
            {STATUS_LABELS[status] ?? status}
        </span>
    );
}

function FieldMarker({ reservation }: { reservation: Reservation }) {
    const total = Number(reservation.amount ?? 0);
    const paid = Number(reservation.advance_amount ?? 0);
    const balance = Math.max(0, total - paid);
    const awaitingBalance = reservation.status !== 'cancelled' && balance > 0;
    const overdue = awaitingBalance && isReservationOverdue(reservation);

    const style = overdue
        ? 'border-red-400/50 bg-red-500/20 text-red-100'
        : awaitingBalance
          ? 'border-orange-400/50 bg-orange-500/20 text-orange-100'
          : reservation.status === 'pending'
            ? 'border-amber-400/40 bg-amber-500/20 text-amber-100'
            : reservation.status === 'cancelled'
              ? 'border-red-400/40 bg-red-500/20 text-red-100'
              : reservation.status === 'completed'
                ? 'border-blue-400/40 bg-blue-500/20 text-blue-100'
                : 'border-emerald-400/40 bg-emerald-500/20 text-emerald-100';

    return (
        <div className={`rounded-md border px-2 py-1.5 text-[11px] ${style}`}>
            <div className="flex items-center justify-between gap-1">
                <p className="font-black">
                    {reservation.start_time.slice(0, 5)} -{' '}
                    {reservation.end_time.slice(0, 5)}
                </p>
                {awaitingBalance && <PendingPulse overdue={overdue} />}
            </div>
            <p className="truncate text-[10px] opacity-85">
                {reservation.client?.name ?? reservation.code}
            </p>
            {awaitingBalance && (
                <p className={`mt-0.5 truncate text-[9px] font-black ${overdue ? 'text-red-200' : 'text-orange-200'}`}>
                    {overdue ? '¡Cobrar ahora! ' : ''}Falta {money(balance)}
                </p>
            )}
        </div>
    );
}

function SummaryRow({
    icon: Icon,
    label,
    value,
}: {
    icon: ElementType;
    label: string;
    value: ReactNode;
}) {
    return (
        <div className="flex items-center justify-between gap-3 py-2 text-sm">
            <span className="inline-flex items-center gap-2 text-slate-400">
                <Icon className="size-4 text-slate-500" />
                {label}
            </span>
            <span className="min-w-0 text-right font-semibold text-slate-100">
                {value}
            </span>
        </div>
    );
}

export default function ReservationsIndex({
    reservations,
    fields,
    clients,
    staff,
    booking_hours,
    open_payment_reservation,
    open_payment_intent,
    filters,
}: Props) {
    const { flash } = usePage<{ flash: { success?: string; error?: string } }>().props;
    const searchRef = useRef<HTMLInputElement>(null);
    const [view, setView] = useState<CalendarView>('day');
    const [quickModal, setQuickModal] = useState<QuickModalState>({ open: false });
    const [paymentDialog, setPaymentDialog] = useState<{
        reservation: Reservation;
        intent?: 'advance' | 'full';
    } | null>(null);
    // Tracks which open_payment id we've already reacted to, so the effect
    // below only fires once per redirect instead of on every render.
    const [handledPaymentId, setHandledPaymentId] = useState<number | null>(null);

    function openQuickModal(state: Omit<QuickModalState, 'open'>) {
        setQuickModal({ open: true, ...state });
    }

    function openPaymentDialog(reservation: Reservation, intent?: 'advance' | 'full') {
        setPaymentDialog({ reservation, intent });
    }

    function handlePaymentSuccess(updated: Reservation) {
        toast.success('Cobro registrado correctamente.');
        setPaymentDialog(null);
        router.reload({ only: ['reservations'] });
        void updated;
    }

    // The reservation created via the quick modal redirects back here with
    // open_payment=<id>, so the same "Cobrar venta" wizard used for sales
    // pops up right away to collect the deposit/full payment. Adjusting
    // state during render (rather than in an effect) is the pattern React
    // recommends for state derived from a changed prop.
    if (open_payment_reservation && open_payment_reservation.id !== handledPaymentId) {
        setHandledPaymentId(open_payment_reservation.id);
        setPaymentDialog({ reservation: open_payment_reservation, intent: open_payment_intent });
    }

    useEffect(() => {
        if (!open_payment_reservation) {
            return;
        }

        const url = new URL(window.location.href);
        url.searchParams.delete('open_payment');
        url.searchParams.delete('payment_type');
        window.history.replaceState(window.history.state, '', url.toString());
    }, [open_payment_reservation]);

    useEffect(() => {
        if (flash?.success) {
toast.success(flash.success);
}

        if (flash?.error) {
toast.error(flash.error);
}
    }, [flash]);

    const reservationItems = reservations.data;
    const selectedDate = filters.date || format(new Date(), 'yyyy-MM-dd');
    const scheduleFields = fields.slice(0, 4);
    const startHour = Number((booking_hours?.start ?? '06:00').slice(0, 2));
    const endHour = Number((booking_hours?.end ?? '23:00').slice(0, 2));
    const scheduleHours = Array.from(
        { length: Math.max(0, endHour - startHour) },
        (_, index) => `${(startHour + index).toString().padStart(2, '0')}:00`,
    );

    const stats = useMemo(() => {
        const totalAmount = reservationItems.reduce(
            (sum, reservation) => sum + Number(reservation.amount ?? 0),
            0,
        );

        return {
            totalAmount,
            pending: reservationItems.filter((r) => r.status === 'pending').length,
            confirmed: reservationItems.filter((r) => r.status === 'confirmed').length,
            today: reservationItems.filter((r) => isToday(parseISO(r.date))).length,
        };
    }, [reservationItems]);

    const selectedReservation = reservationItems[0] ?? null;
    const upcomingReservations = reservationItems
        .filter((reservation) => reservation.status !== 'cancelled')
        .slice(0, 5);

    function handleSearch(e: FormEvent) {
        e.preventDefault();
        router.get(
            '/reservations',
            {
                search: searchRef.current?.value ?? '',
                status: filters.status,
                date: filters.date,
            },
            { preserveState: true, replace: true },
        );
    }

    function handleFilter(key: string, value: string) {
        router.get(
            '/reservations',
            { ...filters, [key]: value },
            { preserveState: true, replace: true },
        );
    }

    function moveDate(unit: 'day' | 'week' | 'month', direction: -1 | 1) {
        const current = parseISO(selectedDate);
        const next =
            unit === 'day'
                ? direction > 0
                    ? addDays(current, 1)
                    : subDays(current, 1)
                : unit === 'week'
                  ? direction > 0
                      ? addWeeks(current, 1)
                      : subWeeks(current, 1)
                  : direction > 0
                    ? addMonths(current, 1)
                    : subMonths(current, 1);

        handleFilter('date', format(next, 'yyyy-MM-dd'));
    }

    async function handleDelete(r: Reservation) {
        const balance = Number(r.advance_amount ?? 0);
        const result = await Swal.fire({
            icon: 'warning',
            title: '¿Eliminar reservación?',
            text:
                balance > 0
                    ? `"${r.code}" será eliminada permanentemente. El adelanto de ${money(balance)} ya cobrado en caja NO será reembolsado.`
                    : `"${r.code}" será eliminada permanentemente.`,
            showCancelButton: true,
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#dc2626',
            reverseButtons: true,
        });

        if (result.isConfirmed) {
            router.delete(`/reservations/${r.id}`);
        }
    }

    function approveReservation(r: Reservation) {
        router.patch(`/reservations/${r.id}/approve`, {}, { preserveScroll: true });
    }

    function rejectReservation(r: Reservation) {
        router.patch(`/reservations/${r.id}/reject`, {}, { preserveScroll: true });
    }

    return (
        <>
            <Head title="Reservaciones" />

            <div className="min-h-[calc(100svh-4rem)] overflow-x-hidden px-3 py-3 text-sm text-slate-100 sm:px-4 lg:px-5">
                <div className="mx-auto grid w-full max-w-[1800px] grid-cols-1 gap-3 xl:grid-cols-[minmax(330px,440px)_minmax(0,1fr)_390px]">
                    <section className="order-1 min-w-0 rounded-lg border border-white/10 bg-slate-900/72 p-4 shadow-[0_20px_50px_rgba(0,0,0,0.24)] backdrop-blur xl:order-2">
                        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                                <h1 className="text-xl font-black text-slate-50">
                                    Reservar por calendario
                                </h1>
                                <p className="text-xs text-slate-400">
                                    {format(parseISO(selectedDate), 'dd/MM/yyyy')} · {booking_hours?.start ?? '06:00'} - {booking_hours?.end ?? '23:00'}
                                </p>
                            </div>
                            <div className="flex flex-wrap items-center justify-end gap-2">
                                <div className="grid grid-cols-3 gap-1 rounded-md border border-white/10 bg-slate-950/45 p-1">
                                    <button type="button" onClick={() => moveDate('day', -1)} className="rounded px-2 py-2 text-xs font-black text-slate-300 hover:bg-white/10">- Día</button>
                                    <button type="button" onClick={() => handleFilter('date', format(new Date(), 'yyyy-MM-dd'))} className="rounded bg-emerald-500/15 px-2 py-2 text-xs font-black text-emerald-300 hover:bg-emerald-500/20">Hoy</button>
                                    <button type="button" onClick={() => moveDate('day', 1)} className="rounded px-2 py-2 text-xs font-black text-slate-300 hover:bg-white/10">+ Día</button>
                                </div>
                                <Button
                                    type="button"
                                    onClick={() => openQuickModal({ date: selectedDate })}
                                    className="h-10 shrink-0 bg-emerald-500 text-white hover:bg-emerald-400"
                                >
                                    <CalendarPlus className="size-4" />
                                    Reservar
                                </Button>
                            </div>
                        </div>

                        <div className="mb-3 space-y-2">
                            <div className="grid grid-cols-3 gap-1 rounded-md border border-white/10 bg-slate-950/45 p-1">
                                {(
                                    [
                                        ['day', 'Día'],
                                        ['week', 'Semana'],
                                        ['month', 'Mes'],
                                    ] as [CalendarView, string][]
                                ).map(([value, label]) => (
                                    <button
                                        key={value}
                                        type="button"
                                        onClick={() => setView(value)}
                                        className={`rounded px-3 py-2 text-xs font-black transition ${
                                            view === value
                                                ? 'bg-emerald-500/20 text-emerald-300'
                                                : 'text-slate-300 hover:bg-white/10'
                                        }`}
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>

                            {view === 'week' && (
                                <div className="grid grid-cols-2 gap-2">
                                    <Button type="button" variant="outline" onClick={() => moveDate('week', -1)} className="h-9 min-w-0 border-white/10 bg-transparent px-1 text-xs text-slate-300 hover:bg-white/10 hover:text-white">
                                        <ChevronLeft className="size-4 shrink-0" />
                                        <span className="truncate">Semana</span>
                                    </Button>
                                    <Button type="button" variant="outline" onClick={() => moveDate('week', 1)} className="h-9 min-w-0 border-white/10 bg-transparent px-1 text-xs text-slate-300 hover:bg-white/10 hover:text-white">
                                        <span className="truncate">Semana</span>
                                        <ChevronRight className="size-4 shrink-0" />
                                    </Button>
                                </div>
                            )}
                            {view === 'month' && (
                                <div className="grid grid-cols-2 gap-2">
                                    <Button type="button" variant="outline" onClick={() => moveDate('month', -1)} className="h-9 min-w-0 border-white/10 bg-transparent px-1 text-xs text-slate-300 hover:bg-white/10 hover:text-white">
                                        <ChevronLeft className="size-4 shrink-0" />
                                        <span className="truncate">Mes</span>
                                    </Button>
                                    <Button type="button" variant="outline" onClick={() => moveDate('month', 1)} className="h-9 min-w-0 border-white/10 bg-transparent px-1 text-xs text-slate-300 hover:bg-white/10 hover:text-white">
                                        <span className="truncate">Mes</span>
                                        <ChevronRight className="size-4 shrink-0" />
                                    </Button>
                                </div>
                            )}
                        </div>

                        {view === 'week' && (
                            <ReservationWeekStrip
                                selectedDate={selectedDate}
                                onSelectDate={(d) => {
                                    handleFilter('date', d);
                                    setView('day');
                                }}
                            />
                        )}

                        {view === 'month' && (
                            <div className="mb-3 overflow-hidden rounded-lg border border-white/10 bg-slate-950/45">
                                <ReservationMonthView
                                    selectedDate={selectedDate}
                                    onSelectDate={(d) => {
                                        handleFilter('date', d);
                                        setView('day');
                                    }}
                                />
                            </div>
                        )}

                        {view === 'day' && (
                        <>
                        <div className="mb-3 flex flex-wrap gap-3 text-xs text-slate-400">
                            <span className="inline-flex items-center gap-1">
                                <span className="size-2 rounded-full bg-emerald-400" />
                                Disponible
                            </span>
                            <span className="inline-flex items-center gap-1">
                                <span className="size-2 rounded-full bg-amber-400" />
                                Pendiente
                            </span>
                            <span className="inline-flex items-center gap-1">
                                <span className="size-2 rounded-full bg-blue-400" />
                                Reservado
                            </span>
                        </div>

                        <div className="space-y-3 md:hidden">
                            {scheduleFields.map((field) => (
                                <div
                                    key={field.id}
                                    className="rounded-lg border border-white/10 bg-slate-950/35 p-3"
                                >
                                    <div className="mb-3 flex items-center justify-between gap-3">
                                        <h2 className="font-black text-slate-100">
                                            {field.name}
                                        </h2>
                                        <span className="text-xs font-semibold text-emerald-300">
                                            {money(field.hourly_rate)} / h
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 min-[390px]:grid-cols-3">
                                        {scheduleHours.map((hour) => {
                                            const reservation = reservationItems.find(
                                                (item) =>
                                                    item.field?.id === field.id &&
                                                    item.start_time.slice(0, 5) === hour,
                                            );

                                            return reservation ? (
                                                <FieldMarker
                                                    key={`${field.id}-${hour}`}
                                                    reservation={reservation}
                                                />
                                            ) : (
                                                <button
                                                    key={`${field.id}-${hour}`}
                                                    type="button"
                                                    onClick={() =>
                                                        openQuickModal({
                                                            fieldId: field.id,
                                                            date: selectedDate,
                                                            startTime: hour,
                                                        })
                                                    }
                                                    className="flex min-h-14 flex-col justify-center rounded-md border border-emerald-400/25 bg-emerald-500/10 px-2 py-2 text-center text-emerald-100 transition hover:bg-emerald-500/15"
                                                >
                                                    <span className="text-xs font-black">
                                                        {hour}
                                                    </span>
                                                    <span className="text-[10px] text-emerald-300">
                                                        Reservar
                                                    </span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="hidden overflow-auto rounded-md border border-white/10 bg-slate-950/35 md:block">
                            <div
                                className="grid min-w-[720px]"
                                style={{
                                    gridTemplateColumns: `72px repeat(${scheduleFields.length}, minmax(150px, 1fr))`,
                                }}
                            >
                                <div className="border-r border-b border-white/10 px-3 py-3 text-xs font-bold text-slate-500">
                                    Hora
                                </div>
                                {scheduleFields.map((field) => (
                                    <div
                                        key={field.id}
                                        className="border-r border-b border-white/10 px-3 py-3 text-center last:border-r-0"
                                    >
                                        <p className="font-black text-slate-100">
                                            {field.name}
                                        </p>
                                    </div>
                                ))}

                                {scheduleHours.map((hour) => (
                                    <Fragment key={hour}>
                                        <div className="border-r border-b border-white/10 px-3 py-4 text-xs font-bold text-slate-400">
                                            {hour}
                                        </div>
                                        {scheduleFields.map((field) => {
                                            const reservation = reservationItems.find(
                                                (item) =>
                                                    item.field?.id === field.id &&
                                                    item.start_time.slice(0, 5) === hour,
                                            );

                                            return (
                                                <div
                                                    key={`${hour}-${field.id}`}
                                                    className="min-h-16 border-r border-b border-white/10 p-2 last:border-r-0"
                                                >
                                                    {reservation ? (
                                                        <FieldMarker
                                                            reservation={reservation}
                                                        />
                                                    ) : (
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                openQuickModal({
                                                                    fieldId: field.id,
                                                                    date: selectedDate,
                                                                    startTime: hour,
                                                                })
                                                            }
                                                            className="flex h-full w-full items-center justify-center rounded-md border border-dashed border-emerald-400/15 bg-emerald-500/[0.03] text-[11px] font-black text-emerald-300 opacity-70 transition hover:border-emerald-400/40 hover:bg-emerald-500/10 hover:opacity-100"
                                                        >
                                                            Reservar
                                                        </button>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </Fragment>
                                ))}
                            </div>
                        </div>
                        </>
                        )}
                    </section>

                    <section className="order-2 flex min-w-0 flex-col rounded-lg border border-white/10 bg-slate-900/72 p-4 shadow-[0_20px_50px_rgba(0,0,0,0.24)] backdrop-blur xl:order-1">
                        <div className="mb-4 flex items-center justify-between gap-3">
                            <div className="flex min-w-0 items-center gap-3">
                                <span className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-emerald-400/30 bg-emerald-500/15 text-emerald-300">
                                    <CalendarDays className="size-5" />
                                </span>
                                <div className="min-w-0">
                                    <h2 className="truncate text-xl font-black text-slate-50">
                                        Reservaciones hechas
                                    </h2>
                                    <p className="text-xs text-slate-400">
                                        {reservations.total} reserva
                                        {reservations.total !== 1 ? 's' : ''} registradas
                                    </p>
                                </div>
                            </div>

                            <Button
                                type="button"
                                onClick={() => openQuickModal({ date: selectedDate })}
                                className="shrink-0 bg-emerald-500 text-white hover:bg-emerald-400"
                            >
                                <Plus className="size-4" />
                                Nueva
                            </Button>
                        </div>

                        <form onSubmit={handleSearch} className="space-y-3">
                            <div className="relative">
                                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-500" />
                                <Input
                                    ref={searchRef}
                                    defaultValue={filters.search}
                                    placeholder="Buscar código o cliente..."
                                    className="h-11 border-white/10 bg-slate-950/70 pl-10 text-slate-100 placeholder:text-slate-500 focus-visible:ring-emerald-500/30"
                                />
                            </div>

                            <div className="grid grid-cols-1 gap-2 min-[420px]:grid-cols-2">
                                <Input
                                    type="date"
                                    defaultValue={filters.date}
                                    onChange={(e) => handleFilter('date', e.target.value)}
                                    className="h-10 border-white/10 bg-slate-950/70 text-slate-100 focus-visible:ring-emerald-500/30"
                                />
                                <select
                                    value={filters.status}
                                    onChange={(e) => handleFilter('status', e.target.value)}
                                    className="h-10 rounded-md border border-white/10 bg-slate-950/70 px-3 text-sm font-semibold text-slate-100 outline-none focus:border-emerald-400/50 focus:ring-2 focus:ring-emerald-500/20"
                                >
                                    <option value="">Todos</option>
                                    <option value="pending">Pendiente</option>
                                    <option value="confirmed">Confirmada</option>
                                    <option value="completed">Completada</option>
                                    <option value="cancelled">Cancelada</option>
                                </select>
                            </div>

                            <div className="grid grid-cols-1 gap-2 min-[420px]:grid-cols-2">
                                <Button
                                    type="submit"
                                    className="h-10 bg-emerald-500 text-white hover:bg-emerald-400"
                                >
                                    <Search className="size-4" />
                                    Buscar
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() =>
                                        router.get('/reservations', {}, { replace: true })
                                    }
                                    className="h-10 border-white/15 bg-transparent text-slate-200 hover:bg-white/10 hover:text-white"
                                >
                                    <RotateCcw className="size-4" />
                                    Limpiar
                                </Button>
                            </div>
                        </form>

                        <div className="mt-4 hidden grid-cols-2 gap-2 xl:grid">
                            <StatCard label="Hoy" value={stats.today} />
                            <StatCard
                                label="Confirmadas"
                                value={stats.confirmed}
                                tone="emerald"
                            />
                            <StatCard label="Pendientes" value={stats.pending} tone="amber" />
                            <StatCard
                                label="Monto"
                                value={money(stats.totalAmount)}
                                tone="emerald"
                            />
                        </div>

                        <div className="mt-4 min-h-0 flex-1 overflow-hidden rounded-md border border-white/10">
                            {reservationItems.length === 0 ? (
                                <div className="flex min-h-48 items-center justify-center px-4 text-center text-slate-500">
                                    No hay reservaciones para los filtros actuales.
                                </div>
                            ) : (
                                <div className="divide-y divide-white/10">
                                    {reservationItems.map((reservation) => (
                                        <ReservationListItem
                                            key={reservation.id}
                                            reservation={reservation}
                                            onApprove={approveReservation}
                                            onReject={rejectReservation}
                                            onDelete={handleDelete}
                                            onOpenPayment={(r) => openPaymentDialog(r, 'full')}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    </section>

                    <aside className="order-3 flex min-w-0 flex-col gap-3">
                        <section className="rounded-lg border border-white/10 bg-slate-900/72 p-4 shadow-[0_20px_50px_rgba(0,0,0,0.24)] backdrop-blur">
                            <div className="mb-3 flex items-center gap-2">
                                <CreditCard className="size-5 text-emerald-300" />
                                <h2 className="text-lg font-black text-slate-50">
                                    Resumen del día
                                </h2>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <StatCard label="Hoy" value={stats.today} />
                                <StatCard
                                    label="Confirmadas"
                                    value={stats.confirmed}
                                    tone="emerald"
                                />
                                <StatCard label="Pendientes" value={stats.pending} tone="amber" />
                                <StatCard
                                    label="Monto"
                                    value={money(stats.totalAmount)}
                                    tone="emerald"
                                />
                            </div>
                        </section>

                        <ReservationSummary reservation={selectedReservation} />
                        <UpcomingReservations
                            reservations={upcomingReservations}
                            onCreate={() => openQuickModal({ date: selectedDate })}
                        />
                    </aside>
                </div>
            </div>

            {reservations.last_page > 1 && (
                <div className="px-4 pb-5">
                    <div className="mx-auto flex max-w-[1800px] flex-col gap-3 rounded-lg border border-white/10 bg-slate-900/72 px-4 py-3 text-sm text-slate-400 sm:flex-row sm:items-center sm:justify-between">
                        <span>
                            Mostrando {reservations.from}-{reservations.to} de{' '}
                            {reservations.total}
                        </span>
                        <div className="flex flex-wrap gap-1">
                            {reservations.links.map((link, i) => (
                                <button
                                    key={i}
                                    disabled={!link.url}
                                    onClick={() => link.url && router.get(link.url)}
                                    className={`rounded px-3 py-1 text-xs transition-colors ${
                                        link.active
                                            ? 'bg-emerald-500 font-bold text-white'
                                            : link.url
                                              ? 'border border-white/10 text-slate-300 hover:bg-white/10'
                                              : 'cursor-not-allowed border border-white/10 opacity-40'
                                    }`}
                                    dangerouslySetInnerHTML={{
                                        __html: link.label,
                                    }}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            )}

            <ReservationQuickModal
                open={quickModal.open}
                onOpenChange={(open) => setQuickModal((current) => ({ ...current, open }))}
                fields={fields}
                clients={clients}
                bookingHours={booking_hours}
                defaultFieldId={quickModal.fieldId}
                defaultDate={quickModal.date}
                defaultStartTime={quickModal.startTime}
            />

            {paymentDialog && (
                <ReservationCheckoutDialog
                    open={!!paymentDialog}
                    reservation={paymentDialog.reservation}
                    clients={clients}
                    staff={staff}
                    defaultPaymentType={paymentDialog.intent}
                    onOpenChange={(open) => {
                        if (!open) {
                            setPaymentDialog(null);
                        }
                    }}
                    onSuccess={handlePaymentSuccess}
                />
            )}
        </>
    );
}

function StatCard({
    label,
    value,
    tone = 'slate',
}: {
    label: string;
    value: string | number;
    tone?: 'slate' | 'emerald' | 'amber';
}) {
    const color =
        tone === 'emerald'
            ? 'text-emerald-300'
            : tone === 'amber'
              ? 'text-amber-300'
              : 'text-slate-50';

    return (
        <div className="min-w-0 rounded-md border border-white/10 bg-white/[0.03] p-3">
            <p className="text-xs text-slate-500">{label}</p>
            <p className={`truncate text-2xl font-black ${color}`}>{value}</p>
        </div>
    );
}

function isReservationOverdue(reservation: Reservation): boolean {
    const end = new Date(`${reservation.date}T${reservation.end_time.slice(0, 8)}`);

    return !Number.isNaN(end.getTime()) && end.getTime() < Date.now();
}

function PendingPulse({ overdue }: { overdue: boolean }) {
    const color = overdue ? 'bg-red-500' : 'bg-orange-500';
    const pingColor = overdue ? 'bg-red-400' : 'bg-orange-400';

    return (
        <span className="relative flex size-2.5 shrink-0">
            <span
                className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${pingColor}`}
            />
            <span className={`relative inline-flex size-2.5 rounded-full ${color}`} />
        </span>
    );
}

function ReservationListItem({
    reservation,
    onApprove,
    onReject,
    onDelete,
    onOpenPayment,
}: {
    reservation: Reservation;
    onApprove: (reservation: Reservation) => void;
    onReject: (reservation: Reservation) => void;
    onDelete: (reservation: Reservation) => void;
    onOpenPayment: (reservation: Reservation) => void;
}) {
    const total = Number(reservation.amount ?? 0);
    const paid = Number(reservation.advance_amount ?? 0);
    const balance = Math.max(0, total - paid);
    const hasPendingBalance = reservation.status !== 'cancelled' && balance > 0;
    const overdue = hasPendingBalance && isReservationOverdue(reservation);

    return (
        <div className="bg-slate-950/35 p-3 transition hover:bg-emerald-500/5">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="truncate font-black text-slate-50">
                        {reservation.client?.name ?? 'Sin cliente'}
                    </p>
                    <p className="mt-1 truncate text-xs text-slate-500">
                        {reservation.code} · {reservation.field?.name ?? 'Sin cancha'}
                    </p>
                </div>
                <ReservationStatus status={reservation.status} />
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-400">
                <span>{format(parseISO(reservation.date), 'dd/MM/yyyy')}</span>
                <span className="text-right">
                    {reservation.start_time.slice(0, 5)} -{' '}
                    {reservation.end_time.slice(0, 5)}
                </span>
            </div>

            {hasPendingBalance && (
                <button
                    type="button"
                    onClick={() => onOpenPayment(reservation)}
                    className={`mt-2 flex w-full items-center justify-between gap-2 rounded-md border px-2 py-1.5 text-xs font-bold transition ${
                        overdue
                            ? 'border-red-400/40 bg-red-500/10 text-red-300 hover:bg-red-500/15'
                            : 'border-orange-400/30 bg-orange-500/10 text-orange-300 hover:bg-orange-500/15'
                    }`}
                >
                    <span className="flex items-center gap-2">
                        <PendingPulse overdue={overdue} />
                        {overdue ? '¡Cobrar ahora!' : paid > 0 ? 'Falta completar' : 'Sin cobrar'}
                    </span>
                    <span>Falta {money(balance)}</span>
                </button>
            )}

            <div className="mt-3 flex items-center justify-between gap-2">
                <span className="font-black text-emerald-300">
                    {money(reservation.amount)}
                </span>
                <div className="flex items-center gap-1">
                    {hasPendingBalance && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 text-orange-300 hover:bg-orange-500/10 hover:text-orange-200"
                            title="Cobrar reserva"
                            onClick={() => onOpenPayment(reservation)}
                        >
                            <CreditCard className="size-4" />
                        </Button>
                    )}
                    {reservation.status === 'pending' &&
                        reservation.payment_operation_number && (
                            <>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="size-8 text-emerald-300 hover:bg-emerald-500/10 hover:text-emerald-200"
                                    onClick={() => onApprove(reservation)}
                                >
                                    <CheckCircle2 className="size-4" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="size-8 text-amber-300 hover:bg-amber-500/10 hover:text-amber-200"
                                    onClick={() => onReject(reservation)}
                                >
                                    <XCircle className="size-4" />
                                </Button>
                            </>
                        )}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-blue-300 hover:bg-blue-500/10 hover:text-blue-200"
                        asChild
                    >
                        <Link href={`/reservations/${reservation.id}/edit`}>
                            <Pencil className="size-4" />
                        </Link>
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-red-300 hover:bg-red-500/10 hover:text-red-200"
                        onClick={() => onDelete(reservation)}
                    >
                        <Trash2 className="size-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}

function ReservationSummary({ reservation }: { reservation: Reservation | null }) {
    return (
        <section className="rounded-lg border border-white/10 bg-slate-900/72 p-4 shadow-[0_20px_50px_rgba(0,0,0,0.24)] backdrop-blur">
            <div className="mb-3 flex items-center gap-2">
                <CreditCard className="size-5 text-emerald-300" />
                <h2 className="text-lg font-black text-slate-50">
                    Resumen de reserva
                </h2>
            </div>

            {reservation ? (
                <div className="divide-y divide-white/10">
                    <SummaryRow
                        icon={User}
                        label="Cliente"
                        value={reservation.client?.name ?? 'Sin cliente'}
                    />
                    <SummaryRow
                        icon={Layers}
                        label="Cancha"
                        value={reservation.field?.name ?? 'Sin cancha'}
                    />
                    <SummaryRow
                        icon={CalendarDays}
                        label="Fecha"
                        value={format(parseISO(reservation.date), 'dd/MM/yyyy')}
                    />
                    <SummaryRow
                        icon={Clock3}
                        label="Horario"
                        value={`${reservation.start_time.slice(0, 5)} - ${reservation.end_time.slice(0, 5)}`}
                    />
                    <SummaryRow
                        icon={Check}
                        label="Estado"
                        value={<ReservationStatus status={reservation.status} />}
                    />
                    {(() => {
                        const total = Number(reservation.amount ?? 0);
                        const paid = Number(reservation.advance_amount ?? 0);
                        const balance = Math.max(0, total - paid);

                        return reservation.status !== 'cancelled' && balance > 0 ? (
                            <>
                                {paid > 0 && (
                                    <SummaryRow
                                        icon={CreditCard}
                                        label="Pagado"
                                        value={money(paid)}
                                    />
                                )}
                                <div className="flex items-center justify-between pt-4">
                                    <span className="text-base font-black text-orange-300">
                                        Falta completar
                                    </span>
                                    <span className="text-2xl font-black text-orange-300">
                                        {money(balance)}
                                    </span>
                                </div>
                            </>
                        ) : (
                            <div className="flex items-center justify-between pt-4">
                                <span className="text-base font-black text-emerald-300">
                                    Total a cobrar
                                </span>
                                <span className="text-2xl font-black text-emerald-300">
                                    {money(reservation.amount)}
                                </span>
                            </div>
                        );
                    })()}
                </div>
            ) : (
                <p className="text-sm text-slate-500">No hay reservas para resumir.</p>
            )}
        </section>
    );
}

function UpcomingReservations({
    reservations,
    onCreate,
}: {
    reservations: Reservation[];
    onCreate: () => void;
}) {
    return (
        <section className="min-h-0 flex-1 rounded-lg border border-white/10 bg-slate-900/72 p-4 shadow-[0_20px_50px_rgba(0,0,0,0.24)] backdrop-blur">
            <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="text-lg font-black text-slate-50">
                    Próximas reservas
                </h2>
                <Button
                    type="button"
                    variant="outline"
                    onClick={onCreate}
                    className="h-8 border-white/15 bg-transparent text-xs text-slate-300 hover:bg-white/10 hover:text-white"
                >
                    Crear
                </Button>
            </div>

            <div className="divide-y divide-white/10">
                {reservations.length === 0 ? (
                    <p className="py-8 text-center text-sm text-slate-500">
                        Sin próximas reservas.
                    </p>
                ) : (
                    reservations.map((reservation) => (
                        <div
                            key={`upcoming-${reservation.id}`}
                            className="flex items-center gap-3 py-3"
                        >
                            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-emerald-500/12 text-xs font-black text-emerald-300">
                                {reservation.start_time.slice(0, 5)}
                            </span>
                            <div className="min-w-0 flex-1">
                                <p className="truncate font-semibold text-slate-100">
                                    {reservation.client?.name ?? reservation.code}
                                </p>
                                <p className="truncate text-xs text-slate-500">
                                    {reservation.field?.name} ·{' '}
                                    {format(parseISO(reservation.date), 'dd/MM')}
                                </p>
                            </div>
                            <ReservationStatus status={reservation.status} />
                        </div>
                    ))
                )}
            </div>
        </section>
    );
}

ReservationsIndex.layout = {
    breadcrumbs: [{ title: 'Reservaciones', href: '/reservations' }],
};
