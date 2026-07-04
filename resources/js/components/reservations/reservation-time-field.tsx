import { Clock, Minus, Plus } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

interface OccupiedSlot {
    start_time: string;
    end_time: string;
}

interface ReservationTimeFieldProps {
    fieldId: number | null;
    date: string;
    startTime: string;
    durationMinutes: number;
    onChange: (startTime: string, durationMinutes: number) => void;
    onConflictChange?: (hasConflict: boolean) => void;
    ignoreReservationId?: number;
    bookingHours?: { start: string; end: string };
}

function toMinutes(hhmm: string): number {
    const [h, m] = hhmm.split(':').map(Number);

    return h * 60 + (m || 0);
}

function toHHMM(minutes: number): string {
    const h = Math.floor(minutes / 60)
        .toString()
        .padStart(2, '0');
    const m = (minutes % 60).toString().padStart(2, '0');

    return `${h}:${m}`;
}

function formatDuration(minutes: number): string {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;

    if (h === 0) {
        return `${m} min`;
    }

    return m === 0 ? `${h}h` : `${h}h ${m}min`;
}

function rangesOverlap(aStart: number, aEnd: number, bStart: number, bEnd: number): boolean {
    return aStart < bEnd && aEnd > bStart;
}

export function ReservationTimeField({
    fieldId,
    date,
    startTime,
    durationMinutes,
    onChange,
    onConflictChange,
    ignoreReservationId,
    bookingHours,
}: ReservationTimeFieldProps) {
    const [occupied, setOccupied] = useState<OccupiedSlot[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!fieldId || !date) {
            setOccupied([]);

            return;
        }

        setLoading(true);
        const url = new URL('/reservations/availability', window.location.origin);
        url.searchParams.append('field_id', fieldId.toString());
        url.searchParams.append('date', date);

        if (ignoreReservationId) {
            url.searchParams.append('ignore_id', ignoreReservationId.toString());
        }

        fetch(url)
            .then((res) => res.json())
            .then((data: OccupiedSlot[]) => {
                setOccupied(data);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [fieldId, date, ignoreReservationId]);

    const bookingStartMin = toMinutes(bookingHours?.start ?? '06:00');
    const bookingEndMin = toMinutes(bookingHours?.end ?? '23:00');

    const occupiedRanges = useMemo(
        () =>
            occupied.map((slot) => ({
                start: toMinutes(slot.start_time.slice(0, 5)),
                end: toMinutes(slot.end_time.slice(0, 5)),
            })),
        [occupied],
    );

    const quickSlots = useMemo(() => {
        const slots: string[] = [];

        for (let m = bookingStartMin; m < bookingEndMin; m += 30) {
            slots.push(toHHMM(m));
        }

        return slots;
    }, [bookingStartMin, bookingEndMin]);

    const isQuickSlotOccupied = (slot: string) => {
        const start = toMinutes(slot);

        return occupiedRanges.some((r) => rangesOverlap(start, start + 30, r.start, r.end));
    };

    const startMinutes = startTime ? toMinutes(startTime) : null;
    const endMinutes = startMinutes !== null ? startMinutes + durationMinutes : null;

    const hasConflict = useMemo(() => {
        if (startMinutes === null || endMinutes === null) {
            return false;
        }

        return occupiedRanges.some((r) => rangesOverlap(startMinutes, endMinutes, r.start, r.end));
    }, [startMinutes, endMinutes, occupiedRanges]);

    const outsideBookingHours =
        startMinutes !== null &&
        endMinutes !== null &&
        (startMinutes < bookingStartMin || endMinutes > bookingEndMin);

    useEffect(() => {
        onConflictChange?.(hasConflict || outsideBookingHours);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [hasConflict, outsideBookingHours]);

    return (
        <div className="space-y-3">
            <Label className="flex items-center justify-between gap-3 text-sm font-black text-slate-100">
                <span>Hora</span>
                {loading && (
                    <span className="text-xs font-medium text-slate-500">Cargando...</span>
                )}
            </Label>

            <div className="rounded-lg border border-white/10 bg-slate-950/45 p-3">
                <div className="grid max-h-[132px] grid-cols-3 gap-1.5 overflow-y-auto pr-1 min-[420px]:grid-cols-4 sm:grid-cols-5">
                    {quickSlots.map((slot) => {
                        const occupiedSlot = isQuickSlotOccupied(slot);
                        const selected = startTime === slot;

                        return (
                            <Button
                                key={slot}
                                type="button"
                                variant="outline"
                                className={`h-9 border px-1 text-[11px] font-black ${
                                    selected
                                        ? 'border-emerald-400 bg-emerald-500/20 text-emerald-100 hover:bg-emerald-500/25'
                                        : occupiedSlot
                                          ? 'border-white/5 bg-slate-900/60 text-slate-600 line-through opacity-60'
                                          : 'border-white/10 bg-white/[0.03] text-slate-200 hover:border-emerald-400/40 hover:bg-emerald-500/10 hover:text-emerald-200'
                                }`}
                                onClick={() => onChange(slot, durationMinutes)}
                            >
                                {slot}
                            </Button>
                        );
                    })}
                </div>

                <div className="mt-3 flex flex-col gap-3 border-t border-white/10 pt-3 sm:flex-row sm:items-center">
                    <div className="flex min-w-0 flex-1 items-center gap-2">
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-emerald-500/12 text-emerald-300">
                            <Clock className="size-4" />
                        </span>
                        <div className="min-w-0 flex-1">
                            <Label htmlFor="reservation_start_time" className="text-xs text-slate-500">
                                Hora exacta
                            </Label>
                            <input
                                id="reservation_start_time"
                                type="time"
                                step={60}
                                value={startTime}
                                onChange={(e) => onChange(e.target.value, durationMinutes)}
                                className="h-9 w-full rounded-md border border-white/10 bg-slate-900/70 px-2 text-sm font-black text-slate-100 outline-none focus:border-emerald-400/50 focus:ring-2 focus:ring-emerald-500/20"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-[36px_1fr_36px] items-center gap-2 sm:w-48">
                        <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="size-9 border-white/10 bg-transparent text-slate-200 hover:bg-white/10"
                            onClick={() => onChange(startTime, Math.max(30, durationMinutes - 30))}
                            disabled={durationMinutes <= 30}
                        >
                            <Minus className="size-4" />
                        </Button>
                        <span className="text-center text-sm font-black text-slate-100">
                            {formatDuration(durationMinutes)}
                        </span>
                        <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="size-9 border-white/10 bg-transparent text-slate-200 hover:bg-white/10"
                            onClick={() => onChange(startTime, durationMinutes + 30)}
                        >
                            <Plus className="size-4" />
                        </Button>
                    </div>
                </div>

                {startTime && (
                    <p className="mt-2 text-xs text-slate-500">
                        {startTime} - {endMinutes !== null ? toHHMM(endMinutes) : '--:--'}
                    </p>
                )}

                {hasConflict && (
                    <p className="mt-1 text-xs font-semibold text-red-400">
                        Este horario se cruza con otra reservación.
                    </p>
                )}

                {!hasConflict && outsideBookingHours && (
                    <p className="mt-1 text-xs font-semibold text-amber-400">
                        El horario debe estar entre {bookingHours?.start ?? '06:00'} y{' '}
                        {bookingHours?.end ?? '23:00'}.
                    </p>
                )}
            </div>
        </div>
    );
}
