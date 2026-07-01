import { format, parse, addHours, isBefore, startOfDay, parseISO } from 'date-fns';
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
}

export function TimeSlotPicker({
    fieldId,
    date,
    startTime,
    durationHours,
    onChangeTime,
    ignoreReservationId,
}: TimeSlotPickerProps) {
    const [occupiedSlots, setOccupiedSlots] = useState<{ start_time: string; end_time: string }[]>([]);
    const [loading, setLoading] = useState(false);

    // Fetch availability when fieldId or date changes
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

    // Generate slots from 06:00 to 23:00
    const generateSlots = () => {
        const slots = [];

        for (let i = 6; i <= 23; i++) {
            const h = i.toString().padStart(2, '0');
            slots.push(`${h}:00`);
        }

        return slots;
    };

    const isSlotOccupied = (timeSlot: string) => {
        const slotStart = `${timeSlot}:00`;
        const slotEnd = `${(parseInt(timeSlot.split(':')[0]) + 1).toString().padStart(2, '0')}:00:00`;
        
        return occupiedSlots.some(res => {
            return res.start_time < slotEnd && res.end_time > slotStart;
        });
    };

    const canExtend = () => {
        if (!startTime) {
return false;
}
        
        const nextHour = parseInt(startTime.split(':')[0]) + durationHours;

        if (nextHour > 24) {
return false;
}
        
        const nextTimeSlot = `${nextHour.toString().padStart(2, '0')}:00`;

        return !isSlotOccupied(nextTimeSlot);
    };

    const handleSelectSlot = (time: string) => {
        onChangeTime(time, 1); // Reset to 1 hour duration when picking a new slot
    };

    const format12h = (time24h: string) => {
        const dateObj = parse(time24h, 'HH:mm', new Date());

        return format(dateObj, 'h:mm a');
    };

    return (
        <div className="space-y-4">
            <Label className="text-base flex items-center justify-between">
                <span>2. Selecciona la Hora</span>
                {loading && <span className="text-xs text-muted-foreground animate-pulse">Cargando disponibilidad...</span>}
            </Label>
            
            {date ? (
                <div className="rounded-xl border bg-white p-4 shadow-sm dark:bg-neutral-900">
                    <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                        {generateSlots().map((time) => {
                            const occupied = isSlotOccupied(time);
                            const selected = startTime === time;
                            
                            return (
                                <Button
                                    key={time}
                                    type="button"
                                    variant={selected ? "default" : occupied ? "secondary" : "outline"}
                                    className={`h-10 text-xs ${selected ? 'bg-green-600 text-white hover:bg-green-700' : occupied ? 'opacity-40 line-through' : 'hover:border-green-500 hover:text-green-700'}`}
                                    disabled={occupied}
                                    onClick={() => handleSelectSlot(time)}
                                >
                                    {format12h(time)}
                                </Button>
                            );
                        })}
                    </div>
                    
                    {startTime && (
                        <div className="mt-6 border-t pt-4 space-y-3">
                            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Duración de la reserva
                            </Label>
                            <div className="flex items-center gap-4 bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg border">
                                <Clock className="h-5 w-5 text-green-600" />
                                <div className="flex-1 font-medium text-sm">
                                    {format12h(startTime)} — {format12h(`${(parseInt(startTime.split(':')[0]) + durationHours).toString().padStart(2, '0')}:00`)}
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button 
                                        type="button"
                                        variant="outline" 
                                        size="icon" 
                                        className="h-8 w-8"
                                        onClick={() => onChangeTime(startTime, Math.max(1, durationHours - 1))}
                                        disabled={durationHours <= 1}
                                    >
                                        <Minus className="h-4 w-4" />
                                    </Button>
                                    <span className="w-16 text-center text-sm font-medium">
                                        {durationHours} {durationHours === 1 ? 'hora' : 'horas'}
                                    </span>
                                    <Button 
                                        type="button"
                                        variant="outline" 
                                        size="icon" 
                                        className="h-8 w-8"
                                        onClick={() => onChangeTime(startTime, durationHours + 1)}
                                        disabled={!canExtend()}
                                    >
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center text-sm text-gray-500 dark:border-gray-800 dark:bg-neutral-900">
                    Selecciona una fecha primero para ver los horarios disponibles.
                </div>
            )}
        </div>
    );
}
