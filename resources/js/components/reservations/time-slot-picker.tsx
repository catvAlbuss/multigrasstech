import { addHours, format, parse } from 'date-fns';
import { Clock, Minus, Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

interface TimeSlotPickerProps {
    fieldId: number | null;
    date: string;
    startTime: string;
    durationHours: number;
    onChangeTime: (start: string, duration: number) => void;
    ignoreReservationId?: number;
    bookingHours?: { start: string; end: string };
}

export function TimeSlotPicker({
    fieldId,
    date,
    startTime,
    durationHours,
    onChangeTime,
    ignoreReservationId,
    bookingHours,
}: TimeSlotPickerProps) {
    const [occupiedSlots, setOccupiedSlots] = useState<
        { start_time: string; end_time: string }[]
    >([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!fieldId || !date) {
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
            .then((data) => {
                setOccupiedSlots(data);
                setLoading(false);
            })
            .catch((err) => {
                console.error(err);
                setLoading(false);
            });
    }, [fieldId, date, ignoreReservationId]);

    const startHour = Number((bookingHours?.start ?? '06:00').slice(0, 2));
    const endHour = Number((bookingHours?.end ?? '23:00').slice(0, 2));
    const slots = Array.from({ length: Math.max(0, endHour - startHour) }, (_, index) => {
        const hour = (index + startHour).toString().padStart(2, '0');

        return `${hour}:00`;
    });

    const isSlotOccupied = (timeSlot: string) => {
        const slotStart = `${timeSlot}:00`;
        const slotEnd = `${(parseInt(timeSlot.split(':')[0]) + 1)
            .toString()
            .padStart(2, '0')}:00:00`;

        return occupiedSlots.some((reservation) => {
            return (
                reservation.start_time < slotEnd &&
                reservation.end_time > slotStart
            );
        });
    };

    const canExtend = () => {
        if (!startTime) {
            return false;
        }

        const nextHour = parseInt(startTime.split(':')[0]) + durationHours;

        if (nextHour >= endHour) {
            return false;
        }

        const nextTimeSlot = `${nextHour.toString().padStart(2, '0')}:00`;

        return !isSlotOccupied(nextTimeSlot);
    };

    const format12h = (time24h: string) => {
        const dateObj = parse(time24h, 'HH:mm', new Date());

        return format(dateObj, 'h:mm a');
    };

    const selectedEndTime = startTime
        ? format(addHours(parse(startTime, 'HH:mm', new Date()), durationHours), 'HH:mm')
        : '';

    return (
        <div className="space-y-3">
            <Label className="flex items-center justify-between gap-3 text-sm font-black text-slate-100">
                <span>Horario disponible</span>
                {loading && (
                    <span className="text-xs font-medium text-slate-500">
                        Cargando...
                    </span>
                )}
            </Label>

            {date ? (
                <div className="rounded-lg border border-white/10 bg-slate-950/45 p-3">
                    <div className="grid max-h-[268px] grid-cols-2 gap-2 overflow-y-auto pr-1 min-[420px]:grid-cols-3 sm:grid-cols-4 lg:grid-cols-6">
                        {slots.map((time) => {
                            const occupied = isSlotOccupied(time);
                            const selected = startTime === time;

                            return (
                                <Button
                                    key={time}
                                    type="button"
                                    variant="outline"
                                    className={`h-11 border text-xs font-black ${
                                        selected
                                            ? 'border-emerald-400 bg-emerald-500/20 text-emerald-100 hover:bg-emerald-500/25'
                                            : occupied
                                              ? 'cursor-not-allowed border-white/5 bg-slate-900/60 text-slate-600 line-through opacity-60'
                                              : 'border-white/10 bg-white/[0.03] text-slate-200 hover:border-emerald-400/40 hover:bg-emerald-500/10 hover:text-emerald-200'
                                    }`}
                                    disabled={occupied}
                                    onClick={() => onChangeTime(time, 1)}
                                >
                                    {format12h(time)}
                                </Button>
                            );
                        })}
                    </div>

                    {startTime && (
                        <div className="mt-4 space-y-3 border-t border-white/10 pt-4">
                            <Label className="text-sm font-semibold text-slate-300">
                                Duración de la reserva
                            </Label>
                            <div className="flex flex-col gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-3 sm:flex-row sm:items-center">
                                <div className="flex min-w-0 flex-1 items-center gap-3">
                                    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-emerald-500/12 text-emerald-300">
                                        <Clock className="size-4" />
                                    </span>
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-black text-slate-100">
                                            {format12h(startTime)} -{' '}
                                            {format12h(selectedEndTime)}
                                        </p>
                                        <p className="text-xs text-slate-500">
                                            {durationHours}{' '}
                                            {durationHours === 1 ? 'hora' : 'horas'}
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-[40px_1fr_40px] items-center gap-2 sm:w-44">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="icon"
                                        className="size-10 border-white/10 bg-transparent text-slate-200 hover:bg-white/10"
                                        onClick={() =>
                                            onChangeTime(
                                                startTime,
                                                Math.max(1, durationHours - 1),
                                            )
                                        }
                                        disabled={durationHours <= 1}
                                    >
                                        <Minus className="size-4" />
                                    </Button>
                                    <span className="text-center text-sm font-black text-slate-100">
                                        {durationHours}h
                                    </span>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="icon"
                                        className="size-10 border-white/10 bg-transparent text-slate-200 hover:bg-white/10"
                                        onClick={() =>
                                            onChangeTime(
                                                startTime,
                                                durationHours + 1,
                                            )
                                        }
                                        disabled={!canExtend()}
                                    >
                                        <Plus className="size-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="rounded-lg border border-dashed border-white/10 bg-slate-950/45 p-6 text-center text-sm text-slate-500">
                    Selecciona una fecha para ver los horarios disponibles.
                </div>
            )}
        </div>
    );
}
