import { useForm } from '@inertiajs/react';
import { isBefore, parseISO, startOfDay } from 'date-fns';
import {
    CalendarDays,
    Check,
    CreditCard,
    History,
    Save,
    User,
    UserPlus,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import InputError from '@/components/input-error';
import { ReservationTimeField } from '@/components/reservations/reservation-time-field';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type {
    TenantClientOption as ClientOption,
    TenantFieldOption as FieldOption,
    ReservationCheckoutDraft,
} from '@/types/tenant';

function money(value: string | number | null | undefined) {
    return `S/ ${Number(value ?? 0).toLocaleString('es-PE', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;
}

const STATUS_LABELS: Record<string, string> = {
    pending: 'Pendiente',
    confirmed: 'Confirmada',
    completed: 'Completada',
    cancelled: 'Cancelada',
};

interface ReservationQuickModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    fields: FieldOption[];
    clients: ClientOption[];
    bookingHours?: { start: string; end: string };
    defaultFieldId?: number | null;
    defaultDate?: string;
    defaultStartTime?: string;
    onSubmitForPayment?: (draft: ReservationCheckoutDraft) => void;
}

export function ReservationQuickModal({
    open,
    onOpenChange,
    fields,
    clients,
    bookingHours,
    defaultFieldId,
    defaultDate,
    defaultStartTime,
    onSubmitForPayment,
}: ReservationQuickModalProps) {
    const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
        field_id: '' as number | string,
        client_id: '' as number | string,
        new_client_name: '',
        new_client_phone: '',
        date: '',
        start_time: '',
        end_time: '',
        status: 'confirmed',
        amount: '',
        payment_type: 'full' as 'advance' | 'full',
        mark_as_paid: false,
    });

    const [durationMinutes, setDurationMinutes] = useState(60);
    const [amountEdited, setAmountEdited] = useState(false);
    const [addingNewClient, setAddingNewClient] = useState(false);
    const [hasTimeConflict, setHasTimeConflict] = useState(false);

    useEffect(() => {
        if (!open) {
            return;
        }

        clearErrors();
        setAmountEdited(false);
        setAddingNewClient(false);
        setDurationMinutes(60);

        const fieldId = defaultFieldId ?? (fields[0]?.id ?? '');

        setData({
            field_id: fieldId,
            client_id: '',
            new_client_name: '',
            new_client_phone: '',
            date: defaultDate ?? new Date().toISOString().slice(0, 10),
            start_time: defaultStartTime ?? '',
            end_time: '',
            status: 'confirmed',
            amount: '',
            payment_type: 'full',
            mark_as_paid: false,
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    const selectedField = useMemo(
        () => fields.find((field) => String(field.id) === String(data.field_id)) ?? null,
        [fields, data.field_id],
    );

    useEffect(() => {
        if (!amountEdited && selectedField?.hourly_rate) {
            const rate = Number(selectedField.hourly_rate);
            setData('amount', ((rate * durationMinutes) / 60).toFixed(2));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedField, durationMinutes, amountEdited]);

    // end_time must always be derived from start_time + duration, not just set
    // reactively on user interaction — otherwise a pre-filled defaultStartTime
    // (e.g. clicking a calendar slot) shows the right range in the time field
    // but leaves end_time empty until the user touches the picker again,
    // failing the "hora de fin" required validation on submit.
    useEffect(() => {
        if (!data.start_time) {
            return;
        }

        const [h, m] = data.start_time.split(':').map(Number);
        const endTotal = h * 60 + m + durationMinutes;
        const endTime = `${Math.floor(endTotal / 60)
            .toString()
            .padStart(2, '0')}:${(endTotal % 60).toString().padStart(2, '0')}`;

        setData((current) => (current.end_time === endTime ? current : { ...current, end_time: endTime }));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [data.start_time, durationMinutes]);

    function handleTimeChange(start: string, minutes: number) {
        setDurationMinutes(minutes);
        setData('start_time', start);
    }

    const isPastDate = data.date ? isBefore(parseISO(data.date), startOfDay(new Date())) : false;

    useEffect(() => {
        if (!isPastDate && data.mark_as_paid) {
            setData('mark_as_paid', false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isPastDate]);

    const selectedClient = useMemo(
        () => clients.find((client) => String(client.id) === String(data.client_id)),
        [clients, data.client_id],
    );

    function toggleAddingNewClient() {
        setAddingNewClient((current) => {
            const next = !current;

            if (next) {
                setData('client_id', '');
            } else {
                setData((state) => ({ ...state, new_client_name: '', new_client_phone: '' }));
            }

            return next;
        });
    }

    function handleSubmit(e: FormEvent) {
        e.preventDefault();

        if (data.mark_as_paid) {
            post('/reservations', {
                onSuccess: () => {
                    onOpenChange(false);
                    reset();
                },
            });

            return;
        }

        // Nothing is saved yet — the checkout wizard collects comprobante/
        // cliente/cobro and only then creates the reservation together with
        // its payment in one request (see ReservationController::storeAndCharge).
        onOpenChange(false);
        onSubmitForPayment?.({
            field_id: Number(data.field_id),
            field_name: selectedField?.name,
            date: data.date,
            start_time: data.start_time,
            end_time: data.end_time,
            status: data.status,
            amount: Number(data.amount),
            payment_type: data.payment_type,
        });
        reset();
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[90vh] overflow-y-auto border-white/10 bg-slate-900/95 text-slate-100 sm:max-w-[560px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-slate-50">
                        <CalendarDays className="size-5 text-emerald-300" />
                        Nueva reserva
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-1.5">
                            <Label className="text-xs font-black uppercase tracking-wide text-slate-400">
                                Cancha
                            </Label>
                            <select
                                value={data.field_id}
                                onChange={(e) => setData('field_id', e.target.value)}
                                className="h-10 w-full rounded-md border border-white/10 bg-slate-950/70 px-3 text-sm font-semibold text-slate-100 outline-none focus:border-emerald-400/50 focus:ring-2 focus:ring-emerald-500/20"
                                required
                            >
                                {fields.map((field) => (
                                    <option key={field.id} value={field.id}>
                                        {field.name}
                                    </option>
                                ))}
                            </select>
                            {selectedField && (
                                <p className="text-xs font-semibold text-emerald-300">
                                    {money(selectedField.hourly_rate)} / hora
                                </p>
                            )}
                            <InputError message={errors.field_id} />
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs font-black uppercase tracking-wide text-slate-400">
                                Fecha
                            </Label>
                            <input
                                type="date"
                                value={data.date}
                                onChange={(e) => setData('date', e.target.value)}
                                className="h-10 w-full rounded-md border border-white/10 bg-slate-950/70 px-3 text-sm font-semibold text-slate-100 outline-none focus:border-emerald-400/50 focus:ring-2 focus:ring-emerald-500/20"
                                required
                            />
                            <InputError message={errors.date} />
                        </div>
                    </div>

                    {/* <div className="space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                            <Label className="text-xs font-black uppercase tracking-wide text-slate-400">
                                Cliente <span className="font-normal normal-case text-slate-500">(se asigna en caja)</span>
                            </Label>
                            <button
                                type="button"
                                onClick={toggleAddingNewClient}
                                className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-300 hover:text-emerald-200"
                            >
                                <UserPlus className="size-3.5" />
                                {addingNewClient ? 'Elegir existente' : 'Cliente nuevo'}
                            </button>
                        </div>

                        {addingNewClient ? (
                            <div className="grid gap-2 sm:grid-cols-2">
                                <Input
                                    value={data.new_client_name}
                                    onChange={(e) => setData('new_client_name', e.target.value)}
                                    placeholder="Nombre"
                                    className="h-10 border-white/10 bg-slate-950/70 text-slate-100 placeholder:text-slate-500"
                                />
                                <Input
                                    value={data.new_client_phone}
                                    onChange={(e) => setData('new_client_phone', e.target.value)}
                                    placeholder="Teléfono"
                                    className="h-10 border-white/10 bg-slate-950/70 text-slate-100 placeholder:text-slate-500"
                                />
                            </div>
                        ) : (
                            <select
                                value={data.client_id}
                                onChange={(e) => setData('client_id', e.target.value)}
                                className="h-10 w-full rounded-md border border-white/10 bg-slate-950/70 px-3 text-sm font-semibold text-slate-100 outline-none focus:border-emerald-400/50 focus:ring-2 focus:ring-emerald-500/20"
                            >
                                <option value="">Sin cliente asignado</option>
                                {clients.map((client) => (
                                    <option key={client.id} value={client.id}>
                                        {client.name}
                                        {client.phone ? ` - ${client.phone}` : ''}
                                    </option>
                                ))}
                            </select>
                        )}
                        <InputError message={errors.client_id} />
                        <InputError message={errors.new_client_name} />
                    </div> */}

                    <ReservationTimeField
                        fieldId={data.field_id ? Number(data.field_id) : null}
                        date={data.date}
                        startTime={data.start_time}
                        durationMinutes={durationMinutes}
                        onChange={handleTimeChange}
                        onConflictChange={setHasTimeConflict}
                        bookingHours={bookingHours}
                    />
                    <InputError message={errors.start_time} />

                    <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-1.5">
                            <Label className="text-xs font-black uppercase tracking-wide text-slate-400">
                                Estado
                            </Label>
                            <select
                                value={data.status}
                                onChange={(e) => setData('status', e.target.value)}
                                className="h-10 w-full rounded-md border border-white/10 bg-slate-950/70 px-3 text-sm font-semibold text-slate-100 outline-none focus:border-emerald-400/50 focus:ring-2 focus:ring-emerald-500/20"
                                required
                            >
                                <option value="pending">Pendiente</option>
                                <option value="confirmed">Confirmada</option>
                                <option value="completed">Completada</option>
                                <option value="cancelled">Cancelada</option>
                            </select>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs font-black uppercase tracking-wide text-slate-400">
                                Monto (S/)
                            </Label>
                            <Input
                                type="number"
                                min="0"
                                step="0.01"
                                value={data.amount}
                                onChange={(e) => {
                                    setData('amount', e.target.value);
                                    setAmountEdited(true);
                                }}
                                className="h-10 border-white/10 bg-slate-950/70 font-bold text-emerald-300"
                                required
                            />
                            <InputError message={errors.amount} />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-xs font-black uppercase tracking-wide text-slate-400">
                            Tipo de pago
                        </Label>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                type="button"
                                onClick={() =>
                                    setData((current) => ({
                                        ...current,
                                        payment_type: 'advance',
                                        status: 'pending',
                                    }))
                                }
                                className={`h-10 rounded-md border text-sm font-black transition ${
                                    data.payment_type === 'advance'
                                        ? 'border-emerald-400 bg-emerald-500/20 text-emerald-100'
                                        : 'border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/10'
                                }`}
                            >
                                Adelanto (50%)
                            </button>
                            <button
                                type="button"
                                onClick={() =>
                                    setData((current) => ({
                                        ...current,
                                        payment_type: 'full',
                                        status: 'confirmed',
                                    }))
                                }
                                className={`h-10 rounded-md border text-sm font-black transition ${
                                    data.payment_type === 'full'
                                        ? 'border-emerald-400 bg-emerald-500/20 text-emerald-100'
                                        : 'border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/10'
                                }`}
                            >
                                Pago completo
                            </button>
                        </div>
                        {data.payment_type === 'advance' && Number(data.amount) > 0 && (
                            <p className="text-xs font-semibold text-amber-300">
                                Adelanto a cobrar ahora: {money(Number(data.amount) * 0.5)} (50% de{' '}
                                {money(data.amount)})
                            </p>
                        )}
                    </div>

                    {isPastDate && (
                        <label className="flex items-start gap-2 rounded-md border border-amber-400/30 bg-amber-500/10 p-3 text-sm text-amber-200">
                            <input
                                type="checkbox"
                                checked={data.mark_as_paid}
                                onChange={(e) => setData('mark_as_paid', e.target.checked)}
                                className="mt-0.5 size-4 rounded border-amber-400"
                            />
                            <span className="inline-flex items-start gap-1.5">
                                <History className="mt-0.5 size-4 shrink-0" />
                                Ya fue pagada (reserva histórica). No pasará por caja.
                            </span>
                        </label>
                    )}

                    <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                        <div className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-wide text-slate-400">
                            <CreditCard className="size-3.5 text-emerald-300" />
                            Resumen
                        </div>
                        <div className="space-y-1 text-sm">
                            {/* <div className="flex items-center justify-between gap-2">
                                <span className="inline-flex items-center gap-1.5 text-slate-400">
                                    <User className="size-3.5" />
                                    Cliente
                                </span>
                                <span className="font-semibold text-slate-100">
                                    {addingNewClient
                                        ? data.new_client_name || 'Cliente nuevo'
                                        : (selectedClient?.name ?? 'Sin cliente')}
                                </span>
                            </div> */}
                            <div className="flex items-center justify-between gap-2">
                                <span className="inline-flex items-center gap-1.5 text-slate-400">
                                    <Check className="size-3.5" />
                                    Estado
                                </span>
                                <span className="font-semibold text-slate-100">
                                    {STATUS_LABELS[data.status] ?? data.status}
                                </span>
                            </div>
                            <div className="flex items-center justify-between border-t border-white/10 pt-2">
                                <span className="font-black text-emerald-300">
                                    {data.mark_as_paid
                                        ? 'Total (ya pagado)'
                                        : data.payment_type === 'advance'
                                          ? 'Adelanto listo para caja (50%)'
                                          : 'Monto listo para caja'}
                                </span>
                                <span className="text-lg font-black text-emerald-300">
                                    {money(
                                        data.mark_as_paid || data.payment_type === 'full'
                                            ? data.amount
                                            : Number(data.amount || 0) * 0.5,
                                    )}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            className="border-white/15 bg-transparent text-slate-200 hover:bg-white/10 hover:text-white"
                            disabled={processing}
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            disabled={processing || !data.start_time || hasTimeConflict}
                            className="bg-emerald-500 font-black text-white hover:bg-emerald-400 disabled:bg-slate-700"
                        >
                            <Save className="size-4" />
                            {processing
                                ? 'Guardando...'
                                : data.mark_as_paid
                                  ? 'Guardar reserva histórica'
                                  : 'Guardar y cobrar en caja'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
