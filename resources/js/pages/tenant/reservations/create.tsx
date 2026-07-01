import { Head, useForm } from '@inertiajs/react';
import { format, parseISO, isBefore, startOfDay } from 'date-fns';
import { CalendarDays } from 'lucide-react';
import { useState, useEffect } from 'react';
import InputError from '@/components/input-error';
import { TimeSlotPicker } from '@/components/reservations/time-slot-picker';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type {
    ReservationFormPageProps as Props,
    TenantFieldOption as FieldOption,
} from '@/types/tenant';

export default function ReservationCreate({ fields, clients }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        field_id: fields[0]?.id ?? '',
        client_id: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        start_time: '',
        end_time: '',
        status: 'confirmed',
        amount: '',
        notes: '',
    });

    const [selectedField, setSelectedField] = useState<FieldOption | null>(fields[0] ?? null);
    const [durationHours, setDurationHours] = useState(1);

    // Update the default amount when field or duration changes
    useEffect(() => {
        if (selectedField && selectedField.hourly_rate) {
            const rate = Number(selectedField.hourly_rate);
            setData('amount', (rate * durationHours).toFixed(2));
        }
    }, [selectedField, durationHours]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/reservations');
    };

    const handleTimeChange = (start: string, duration: number) => {
        setDurationHours(duration);
        const endHour = parseInt(start.split(':')[0]) + duration;
        const endTimeStr = `${endHour.toString().padStart(2, '0')}:00`;
        
        setData(data => ({
            ...data,
            start_time: start,
            end_time: endTimeStr
        }));
    };

    const selectedDateObj = data.date ? parseISO(data.date) : undefined;

    return (
        <>
            <Head title="Nueva Reservación" />

            <div className="mx-auto max-w-[90rem] space-y-6">
                <div className="flex items-center gap-3 rounded-xl bg-green-700 px-6 py-5 text-white shadow-sm">
                    <CalendarDays className="h-6 w-6 text-green-200" />
                    <div>
                        <h1 className="text-xl font-semibold">Nueva Reservación</h1>
                        <p className="text-sm text-green-200">Registra una nueva reservación en el calendario interactivo</p>
                    </div>
                </div>

                <div className="rounded-xl border border-green-100 bg-white p-6 md:p-8 shadow-sm dark:border-green-900/30 dark:bg-neutral-900">
                    <form onSubmit={handleSubmit}>
                        
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-12">
                            
                            {/* Left Column: Huge Calendar */}
                            <div className="space-y-4">
                                <Label className="text-base font-bold">1. Selecciona la Fecha</Label>
                                <div className="rounded-2xl border bg-gray-50/30 dark:bg-neutral-900/50 shadow-sm flex items-center justify-center min-h-[500px]">
                                    <Calendar
                                        mode="single"
                                        selected={selectedDateObj}
                                        onSelect={(d) => {
                                            if (d) {
                                                setData('date', format(d, 'yyyy-MM-dd'));
                                            }
                                        }}
                                        disabled={(d) => isBefore(d, startOfDay(new Date()))}
                                        className="w-full h-full max-w-full"
                                    />
                                </div>
                                <InputError message={errors.date} />
                            </div>

                            {/* Right Column: Form Details & Hours */}
                            <div className="space-y-8">
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50/50 dark:bg-neutral-800/50 p-5 rounded-xl border border-gray-100 dark:border-neutral-800">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="field_id">Campo <span className="text-red-500">*</span></Label>
                                        <select
                                            id="field_id"
                                            value={data.field_id}
                                            onChange={(e) => {
                                                setData('field_id', e.target.value);
                                                setSelectedField(fields.find((f) => f.id === Number(e.target.value)) ?? null);
                                            }}
                                            className="h-10 w-full rounded-md border border-input bg-white px-3 py-1 text-sm text-foreground shadow-xs focus-visible:ring-1 focus-visible:ring-green-500 focus-visible:outline-none dark:bg-neutral-900"
                                            required
                                        >
                                            {fields.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
                                        </select>
                                        {selectedField && (
                                            <p className="text-xs text-green-700 dark:text-green-400">Tarifa: ${Number(selectedField.hourly_rate).toLocaleString('es-CO')}/hora</p>
                                        )}
                                        <InputError message={errors.field_id} />
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label htmlFor="client_id">Cliente</Label>
                                        <select 
                                            id="client_id" 
                                            value={data.client_id}
                                            onChange={(e) => setData('client_id', e.target.value)}
                                            className="h-10 w-full rounded-md border border-input bg-white px-3 py-1 text-sm text-foreground shadow-xs focus-visible:ring-1 focus-visible:ring-green-500 focus-visible:outline-none dark:bg-neutral-900"
                                        >
                                            <option value="">Sin cliente asignado</option>
                                            {clients.map((c) => <option key={c.id} value={c.id}>{c.name}{c.phone ? ` — ${c.phone}` : ''}</option>)}
                                        </select>
                                        <InputError message={errors.client_id} />
                                    </div>
                                </div>

                                <TimeSlotPicker
                                    fieldId={Number(data.field_id)}
                                    date={data.date}
                                    startTime={data.start_time}
                                    durationHours={durationHours}
                                    onChangeTime={handleTimeChange}
                                />

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-gray-100 dark:border-neutral-800">
                                    <div className="space-y-4">
                                        <div className="space-y-1.5">
                                            <Label htmlFor="status">Estado <span className="text-red-500">*</span></Label>
                                            <select 
                                                id="status" 
                                                value={data.status}
                                                onChange={(e) => setData('status', e.target.value)}
                                                className="h-10 w-full rounded-md border border-input bg-white px-3 py-1 text-sm text-foreground shadow-xs focus-visible:ring-1 focus-visible:ring-green-500 focus-visible:outline-none dark:bg-neutral-900" 
                                                required
                                            >
                                                <option value="pending">Pendiente</option>
                                                <option value="confirmed">Confirmada</option>
                                                <option value="completed">Completada</option>
                                                <option value="cancelled">Cancelada</option>
                                            </select>
                                            <InputError message={errors.status} />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label htmlFor="amount">Monto total (S/) <span className="text-red-500">*</span></Label>
                                            <Input 
                                                id="amount" 
                                                type="number" 
                                                min="0" 
                                                step="0.01" 
                                                value={data.amount}
                                                onChange={(e) => setData('amount', e.target.value)}
                                                className="h-12 bg-white dark:bg-neutral-900 focus-visible:ring-green-500 text-lg font-bold text-green-700 dark:text-green-500" 
                                                required 
                                            />
                                            <InputError message={errors.amount} />
                                        </div>
                                    </div>

                                    <div className="space-y-1.5 h-full">
                                        <Label htmlFor="notes">Notas</Label>
                                        <Textarea 
                                            id="notes" 
                                            value={data.notes}
                                            onChange={(e) => setData('notes', e.target.value)}
                                            className="w-full h-[100px] bg-white dark:bg-neutral-900 focus-visible:ring-green-500 resize-none" 
                                        />
                                        <InputError message={errors.notes} />
                                    </div>
                                </div>
                            </div>

                        </div>

                        <div className="flex items-center justify-end gap-3 border-t border-gray-200 pt-6 mt-10 dark:border-neutral-800">
                            <Button type="button" variant="outline" onClick={() => history.back()} className="h-12 px-6">Cancelar</Button>
                            <Button 
                                type="submit" 
                                disabled={processing || !data.start_time} 
                                className="h-12 bg-green-600 hover:bg-green-700 px-10 text-base"
                            >
                                {processing ? 'Guardando…' : 'Crear Reservación'}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
}

ReservationCreate.layout = {
    breadcrumbs: [
        { title: 'Reservaciones', href: '/reservations' },
        { title: 'Nueva Reservación', href: '/reservations/create' },
    ],
};
