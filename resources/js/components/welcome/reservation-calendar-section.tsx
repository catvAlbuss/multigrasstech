import { ChevronLeft, ChevronRight, Clock3, Layers, Wifi, X } from 'lucide-react';
import type { DayDetail } from '@/hooks/use-welcome-calendar';
import { cn } from '@/lib/utils';
import { isToday, monthLabel, WEEKDAYS } from '@/lib/welcome';
import type { CalendarDay } from '@/types/tenant';
import type { CalendarCell } from '@/types/welcome';

function formatLongDate(date: string) {
    return new Date(`${date}T00:00:00`).toLocaleDateString('es-PE', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
    });
}

export function ReservationCalendarSection({
    dayDetail,
    detailLoading,
    grid,
    loading,
    month,
    selectedDate,
    onNext,
    onPrevious,
    onSelectDay,
    onToday,
}: {
    dayDetail: DayDetail | null;
    detailLoading: boolean;
    grid: CalendarCell[];
    loading: boolean;
    month: string;
    selectedDate: string | null;
    onNext: () => void;
    onPrevious: () => void;
    onSelectDay: (date: string | null, status: CalendarDay['status'] | null) => void;
    onToday: () => void;
}) {
    return (
        <section className="bg-[#050d1a] py-16 sm:py-20">
            <div className="mx-auto max-w-8xl px-5 sm:px-10">
                {/* Section header */}
                <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                    <h2 className="text-xl font-bold text-white">
                        Calendario de reservas
                    </h2>
                    <span className="flex shrink-0 items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
                        <Wifi className="size-3" />
                        En tiempo real
                    </span>
                </div>

                {/* Calendar card */}
                <div className="overflow-hidden rounded-2xl border border-white/10 bg-white text-gray-950 shadow-2xl dark:bg-[#050d1a] dark:text-white">
                    {/* Calendar controls */}
                    <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 dark:border-gray-700 sm:px-5">
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={onToday}
                                disabled={loading}
                                className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold transition hover:bg-gray-50 disabled:opacity-40 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
                            >
                                Hoy
                            </button>
                            <button
                                type="button"
                                onClick={onPrevious}
                                disabled={loading}
                                className="flex size-8 items-center justify-center rounded-lg border border-gray-200 transition hover:bg-gray-50 disabled:opacity-40 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
                                aria-label="Mes anterior"
                            >
                                <ChevronLeft className="size-4" />
                            </button>
                            <button
                                type="button"
                                onClick={onNext}
                                disabled={loading}
                                className="flex size-8 items-center justify-center rounded-lg border border-gray-200 transition hover:bg-gray-50 disabled:opacity-40 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
                                aria-label="Mes siguiente"
                            >
                                <ChevronRight className="size-4" />
                            </button>
                        </div>
                        <span className="text-sm font-bold text-gray-900 dark:text-white">
                            {monthLabel(month)}
                        </span>
                        <div className="hidden w-24 sm:block" />
                    </div>

                    {/* Weekday headers */}
                    <div className="grid grid-cols-7 border-b border-gray-100 dark:border-gray-700">
                        {WEEKDAYS.map((day) => (
                            <div
                                key={day}
                                className="py-2 text-center text-[10px] font-semibold tracking-wider text-gray-500 dark:text-gray-400"
                            >
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Calendar grid */}
                    <div
                        className={cn(
                            'grid grid-cols-7 transition-opacity',
                            loading && 'opacity-40',
                        )}
                    >
                        {grid.map((cell, index) => {
                            const isClickable =
                                cell.day !== null &&
                                cell.status !== 'available' &&
                                cell.status !== null;
                            const isSelected = cell.date === selectedDate;

                            return (
                                <button
                                    key={`${cell.date ?? 'empty'}-${index}`}
                                    type="button"
                                    disabled={!isClickable}
                                    onClick={() =>
                                        onSelectDay(cell.date, cell.status)
                                    }
                                    className={cn(
                                        'flex h-12 flex-col items-center justify-center border-r border-b border-gray-50 last:border-r-0 transition dark:border-gray-700 sm:h-14',
                                        isClickable &&
                                            'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800',
                                        isSelected &&
                                            'bg-emerald-50 dark:bg-emerald-900/20',
                                        !isClickable && 'cursor-default',
                                    )}
                                >
                                    {cell.day !== null && (
                                        <>
                                            <span
                                                className={cn(
                                                    'flex size-7 items-center justify-center rounded-full text-sm font-medium sm:size-8',
                                                    isToday(cell.date)
                                                        ? 'bg-emerald-600 text-white'
                                                        : isSelected
                                                          ? 'bg-emerald-500 text-white'
                                                          : 'text-gray-900 dark:text-gray-200',
                                                )}
                                            >
                                                {cell.day}
                                            </span>
                                            {cell.status !== 'available' && (
                                                <span
                                                    className={cn(
                                                        'mt-0.5 size-1.5 rounded-full',
                                                        cell.status ===
                                                            'occupied' &&
                                                            'bg-red-500',
                                                        cell.status ===
                                                            'pending' &&
                                                            'bg-yellow-500',
                                                    )}
                                                />
                                            )}
                                        </>
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {/* Day detail panel */}
                    {selectedDate && (
                        <div className="border-t border-gray-100 dark:border-gray-700">
                            <div className="flex items-start justify-between gap-3 px-4 pt-4 pb-2 sm:px-5">
                                <div>
                                    <p className="text-xs font-black text-gray-900 capitalize dark:text-white">
                                        {formatLongDate(selectedDate)}
                                    </p>
                                    <p className="mt-0.5 text-[11px] text-gray-500 dark:text-gray-400">
                                        Espacios y horas ocupadas
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => onSelectDay(null, null)}
                                    className="grid size-7 shrink-0 place-items-center rounded-full text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-200"
                                    aria-label="Cerrar detalle"
                                >
                                    <X className="size-3.5" />
                                </button>
                            </div>

                            <div className="space-y-3 px-4 pb-4 sm:px-5">
                                {detailLoading ? (
                                    <div className="flex items-center gap-2 py-2 text-xs text-gray-500 dark:text-gray-400">
                                        <span className="size-3 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
                                        Cargando reservas...
                                    </div>
                                ) : !dayDetail ||
                                  dayDetail.reservations.length === 0 ? (
                                    <p className="py-2 text-xs text-gray-500 dark:text-gray-400">
                                        Sin reservas registradas para este dia.
                                    </p>
                                ) : (
                                    dayDetail.reservations.map(
                                        (fieldGroup, i) => (
                                            <div
                                                key={i}
                                                className="rounded-xl border border-gray-100 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800/50"
                                            >
                                                <div className="mb-2 flex items-center gap-1.5">
                                                    <Layers className="size-3.5 text-emerald-600" />
                                                    <span className="text-xs font-black text-gray-900 dark:text-white">
                                                        {fieldGroup.field_name}
                                                    </span>
                                                </div>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {fieldGroup.slots.map(
                                                        (slot, j) => (
                                                            <span
                                                                key={j}
                                                                className={cn(
                                                                    'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold',
                                                                    slot.status ===
                                                                        'confirmed'
                                                                        ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                                                        : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
                                                                )}
                                                            >
                                                                <Clock3 className="size-2.5" />
                                                                {slot.start_time}
                                                                {' – '}
                                                                {slot.end_time}
                                                            </span>
                                                        ),
                                                    )}
                                                </div>
                                            </div>
                                        ),
                                    )
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Legend */}
                <div className="mt-4 flex flex-wrap justify-center gap-5">
                    {[
                        { color: 'bg-red-500', label: 'Ocupado' },
                        { color: 'bg-emerald-500', label: 'Disponible' },
                        { color: 'bg-yellow-500', label: 'Pendiente de pago' },
                    ].map(({ color, label }) => (
                        <div key={label} className="flex items-center gap-1.5">
                            <span className={cn('size-2.5 rounded-full', color)} />
                            <span className="text-xs text-white/50">{label}</span>
                        </div>
                    ))}
                    <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-white/40">
                            Toca un dia ocupado o pendiente para ver detalle
                        </span>
                    </div>
                </div>
            </div>
        </section>
    );
}
