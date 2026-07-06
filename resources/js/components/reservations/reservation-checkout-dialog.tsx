import { usePage } from '@inertiajs/react';
import {
    AlertCircle,
    CheckCircle2,
    ChevronRight,
    CreditCard,
    FileText,
    LoaderCircle,
    Receipt,
    User,
    UserCog,
    UserPlus,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { csrfToken, fetchJson, formatMoney } from '@/lib/caja';
import type { CajaStaffOption } from '@/types/caja';
import type { TenantClientOption, TenantReservation } from '@/types/tenant';

type Step = 'comprobante' | 'cliente' | 'cobro';

const STEPS: { key: Step; label: string }[] = [
    { key: 'comprobante', label: 'Comprobante' },
    { key: 'cliente', label: 'Cliente' },
    { key: 'cobro', label: 'Cobro' },
];

export function ReservationCheckoutDialog({
    open,
    reservation,
    clients,
    staff,
    defaultPaymentType,
    onOpenChange,
    onSuccess,
}: {
    open: boolean;
    reservation: TenantReservation;
    clients: TenantClientOption[];
    staff: CajaStaffOption[];
    defaultPaymentType?: 'advance' | 'full';
    onOpenChange: (open: boolean) => void;
    onSuccess: (reservation: TenantReservation) => void;
}) {
    const { auth } = usePage<{ auth: { user: { id: number } } }>().props;

    const total = Number(reservation.amount ?? 0);
    const alreadyPaid = Number(reservation.advance_amount ?? 0);
    const balance = Math.max(0, total - alreadyPaid);
    const hasPriorPayment = alreadyPaid > 0;

    const [step, setStep] = useState<Step>('comprobante');
    const [documentType, setDocumentType] = useState<'boleta' | 'factura'>('boleta');
    const [attendedBy, setAttendedBy] = useState<number>(auth.user.id);
    const [clientId, setClientId] = useState<string>(
        reservation.client?.id ? String(reservation.client.id) : '',
    );
    const [addingNewClient, setAddingNewClient] = useState(false);
    const [newClientName, setNewClientName] = useState('');
    const [newClientPhone, setNewClientPhone] = useState('');
    const [paymentType, setPaymentType] = useState<'advance' | 'full'>(
        hasPriorPayment ? 'full' : (defaultPaymentType ?? 'advance'),
    );
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const chargeAmount = useMemo(() => {
        if (paymentType === 'full') {
            return balance;
        }

        return Math.min(balance, Math.max(1, Math.round(total * 0.5 * 100) / 100));
    }, [paymentType, balance, total]);

    const stepIndex = STEPS.findIndex((s) => s.key === step);
    const canGoNext =
        step === 'cliente' ? (addingNewClient ? newClientName.trim() !== '' : true) : true;

    function goNext() {
        const idx = STEPS.findIndex((s) => s.key === step);

        if (idx < STEPS.length - 1) {
            setStep(STEPS[idx + 1].key);
        }
    }

    function goPrev() {
        const idx = STEPS.findIndex((s) => s.key === step);

        if (idx > 0) {
            setStep(STEPS[idx - 1].key);
        }
    }

    async function handleSubmit() {
        if (chargeAmount <= 0) {
            setError('No hay saldo pendiente por cobrar en esta reserva.');

            return;
        }

        setSubmitting(true);
        setError(null);

        const payload = {
            reservation_id: reservation.id,
            payment_type: paymentType,
            amount: chargeAmount,
            document_type: documentType,
            attended_by: attendedBy,
            client_id: addingNewClient ? null : clientId || null,
            new_client_name: addingNewClient ? newClientName : null,
            new_client_phone: addingNewClient ? newClientPhone || null : null,
        };

        try {
            const data = await fetchJson<{
                success: boolean;
                reservation?: TenantReservation;
                message?: string;
            }>('/caja/reservation-payment', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken(),
                },
                body: JSON.stringify(payload),
            });

            if (!data.success || !data.reservation) {
                setError(data.message ?? 'Error al procesar el cobro.');

                return;
            }

            onSuccess(data.reservation);
            onOpenChange(false);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error de conexión. Intenta de nuevo.');
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className="max-h-[94vh] overflow-hidden p-0 sm:max-w-3xl"
                onEscapeKeyDown={(event) => event.preventDefault()}
                onInteractOutside={(event) => event.preventDefault()}
            >
                <div className="border-b bg-slate-50 px-5 py-4 dark:bg-neutral-950">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-3 text-xl">
                            <span className="flex size-10 items-center justify-center rounded-lg bg-green-600 text-white">
                                <Receipt className="size-5" />
                            </span>
                            <span>
                                Cobrar reserva
                                <span className="mt-1 block text-sm font-normal text-muted-foreground">
                                    {reservation.field?.name ?? 'Cancha'} · {reservation.date} ·{' '}
                                    {reservation.start_time.slice(0, 5)}-
                                    {reservation.end_time.slice(0, 5)}
                                </span>
                            </span>
                        </DialogTitle>
                    </DialogHeader>
                </div>

                <div className="max-h-[calc(94vh-88px)] overflow-y-auto px-5 py-4">
                    {/* Stepper */}
                    <div className="mb-4 flex flex-wrap items-center gap-2">
                        {STEPS.map((s, i) => (
                            <div key={s.key} className="flex items-center gap-1">
                                <button
                                    type="button"
                                    onClick={() => setStep(s.key)}
                                    className={`flex items-center gap-2 rounded-md px-3 py-2 text-xs font-bold transition-all ${
                                        s.key === step
                                            ? 'bg-green-600 text-white shadow-sm'
                                            : i < stepIndex
                                              ? 'bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-300'
                                              : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                                    }`}
                                >
                                    <span className="flex size-5 items-center justify-center rounded-full bg-white/20 text-[10px] font-black">
                                        {i < stepIndex ? (
                                            <CheckCircle2 className="size-3.5" />
                                        ) : (
                                            i + 1
                                        )}
                                    </span>
                                    {s.label}
                                </button>
                                {i < STEPS.length - 1 && (
                                    <ChevronRight className="size-3.5 text-gray-400" />
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_240px]">
                        <div className="space-y-5">
                            {/* Step 1: Comprobante */}
                            {step === 'comprobante' && (
                                <div className="space-y-4">
                                    <div>
                                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                            ¿Qué tipo de comprobante emitirás?
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            Elige boleta para cobros rápidos o factura cuando el
                                            cliente solicite RUC.
                                        </p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        {[
                                            {
                                                value: 'boleta' as const,
                                                icon: FileText,
                                                label: 'Boleta de Venta',
                                                sub: 'Persona natural / consumidor final',
                                            },
                                            {
                                                value: 'factura' as const,
                                                icon: Receipt,
                                                label: 'Factura',
                                                sub: 'Persona jurídica · RUC obligatorio',
                                            },
                                        ].map(({ value, icon: Icon, label, sub }) => (
                                            <button
                                                key={value}
                                                type="button"
                                                onClick={() => setDocumentType(value)}
                                                className={`flex min-h-36 flex-col items-center gap-2 rounded-lg border-2 p-5 transition-all ${
                                                    documentType === value
                                                        ? 'border-green-500 bg-green-50 dark:bg-green-950/30'
                                                        : 'border-gray-200 hover:border-gray-300 dark:border-gray-700'
                                                }`}
                                            >
                                                <Icon
                                                    className={`size-8 ${documentType === value ? 'text-green-600' : 'text-gray-400'}`}
                                                />
                                                <span
                                                    className={`font-semibold ${documentType === value ? 'text-green-700 dark:text-green-400' : 'text-gray-700 dark:text-gray-300'}`}
                                                >
                                                    {label}
                                                </span>
                                                <span className="text-center text-xs text-muted-foreground">
                                                    {sub}
                                                </span>
                                            </button>
                                        ))}
                                    </div>

                                    <div className="grid gap-1.5">
                                        <Label htmlFor="rc-attendant">Atendido por</Label>
                                        <div className="relative">
                                            <UserCog className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                                            <select
                                                id="rc-attendant"
                                                value={attendedBy}
                                                onChange={(e) => setAttendedBy(Number(e.target.value))}
                                                className="h-10 w-full rounded-md border border-input bg-transparent pl-9 text-sm focus-visible:ring-1 focus-visible:ring-green-500 focus-visible:outline-none dark:bg-input/30"
                                            >
                                                {staff.map((member) => (
                                                    <option key={member.id} value={member.id}>
                                                        {member.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Step 2: Cliente */}
                            {step === 'cliente' && (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between gap-2">
                                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                            ¿Quién hizo la reserva?
                                        </p>
                                        <button
                                            type="button"
                                            onClick={() => setAddingNewClient((v) => !v)}
                                            className="inline-flex items-center gap-1 text-xs font-semibold text-green-700 hover:text-green-600 dark:text-green-400"
                                        >
                                            <UserPlus className="size-3.5" />
                                            {addingNewClient ? 'Elegir existente' : 'Cliente nuevo'}
                                        </button>
                                    </div>

                                    {addingNewClient ? (
                                        <div className="grid gap-2 sm:grid-cols-2">
                                            <Input
                                                value={newClientName}
                                                onChange={(e) => setNewClientName(e.target.value)}
                                                placeholder="Nombre"
                                                className="focus-visible:ring-green-500"
                                            />
                                            <Input
                                                value={newClientPhone}
                                                onChange={(e) => setNewClientPhone(e.target.value)}
                                                placeholder="Teléfono"
                                                className="focus-visible:ring-green-500"
                                            />
                                        </div>
                                    ) : (
                                        <div className="relative">
                                            <User className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                                            <select
                                                value={clientId}
                                                onChange={(e) => setClientId(e.target.value)}
                                                className="h-10 w-full rounded-md border border-input bg-transparent pl-9 text-sm focus-visible:ring-1 focus-visible:ring-green-500 focus-visible:outline-none dark:bg-input/30"
                                            >
                                                <option value="">Sin cliente asignado</option>
                                                {clients.map((client) => (
                                                    <option key={client.id} value={client.id}>
                                                        {client.name}
                                                        {client.phone ? ` - ${client.phone}` : ''}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Step 3: Cobro */}
                            {step === 'cobro' && (
                                <div className="space-y-4">
                                    <div className="grid gap-1.5">
                                        <Label>Tipo de pago</Label>
                                        <div className="grid grid-cols-2 gap-2">
                                            <button
                                                type="button"
                                                disabled={hasPriorPayment}
                                                onClick={() => setPaymentType('advance')}
                                                className={`h-10 rounded-md border text-sm font-black transition disabled:cursor-not-allowed disabled:opacity-40 ${
                                                    paymentType === 'advance'
                                                        ? 'border-green-500 bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400'
                                                        : 'border-gray-200 text-gray-600 hover:border-gray-300 dark:border-gray-700 dark:text-gray-300'
                                                }`}
                                            >
                                                Adelanto (50%)
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setPaymentType('full')}
                                                className={`h-10 rounded-md text-sm font-black text-white transition ${
                                                    paymentType === 'full'
                                                        ? 'bg-green-600 hover:bg-green-700'
                                                        : 'bg-gray-400 hover:bg-gray-500'
                                                }`}
                                            >
                                                {hasPriorPayment ? 'Cobrar saldo' : 'Pago completo'}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="rounded-lg bg-green-50 p-3 dark:bg-green-950/30">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium text-green-700 dark:text-green-400">
                                                Monto a cobrar
                                            </span>
                                            <span className="text-xl font-bold text-green-600">
                                                {formatMoney(chargeAmount)}
                                            </span>
                                        </div>
                                        {hasPriorPayment && (
                                            <p className="mt-1 text-xs text-muted-foreground">
                                                Ya se cobró {formatMoney(alreadyPaid)} de{' '}
                                                {formatMoney(total)}.
                                            </p>
                                        )}
                                    </div>

                                    {error && (
                                        <div className="flex items-start gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-950/30">
                                            <AlertCircle className="mt-0.5 size-4 shrink-0" />
                                            {error}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Right: summary */}
                        <div className="h-fit rounded-lg border bg-gray-50 p-4 text-sm lg:sticky lg:top-0 dark:bg-neutral-800/50">
                            <div className="mb-3 flex items-center gap-2 font-semibold text-gray-900 dark:text-gray-100">
                                <CreditCard className="size-4 text-green-600" />
                                Resumen
                            </div>
                            <div className="space-y-1 text-xs">
                                <div className="flex justify-between text-muted-foreground">
                                    <span>Comprobante</span>
                                    <span className="font-medium capitalize">{documentType}</span>
                                </div>
                                <div className="flex justify-between text-muted-foreground">
                                    <span>Cliente</span>
                                    <span className="max-w-[110px] truncate text-right font-medium">
                                        {addingNewClient
                                            ? newClientName || 'Cliente nuevo'
                                            : (clients.find((c) => String(c.id) === clientId)?.name ??
                                              'Sin cliente')}
                                    </span>
                                </div>
                                <div className="flex justify-between text-muted-foreground">
                                    <span>Atendió</span>
                                    <span className="max-w-[110px] truncate text-right font-medium">
                                        {staff.find((m) => m.id === attendedBy)?.name ?? '—'}
                                    </span>
                                </div>
                            </div>
                            <div className="mt-3 space-y-1 border-t pt-3">
                                <div className="flex justify-between text-xs text-muted-foreground">
                                    <span>Total reserva</span>
                                    <span>{formatMoney(total)}</span>
                                </div>
                                <div className="flex justify-between text-base font-black text-green-600">
                                    <span>A cobrar</span>
                                    <span>{formatMoney(chargeAmount)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="mt-5 flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={step === 'comprobante' ? () => onOpenChange(false) : goPrev}
                            disabled={submitting}
                            className="sm:min-w-28"
                        >
                            {step === 'comprobante' ? 'Cancelar' : 'Atrás'}
                        </Button>

                        {step !== 'cobro' ? (
                            <Button
                                type="button"
                                onClick={goNext}
                                disabled={!canGoNext}
                                className="bg-green-600 hover:bg-green-700 sm:min-w-32"
                            >
                                Siguiente
                                <ChevronRight className="ml-1 size-4" />
                            </Button>
                        ) : (
                            <Button
                                type="button"
                                onClick={handleSubmit}
                                disabled={submitting || chargeAmount <= 0}
                                className="min-w-40 bg-green-600 hover:bg-green-700"
                            >
                                {submitting ? (
                                    <>
                                        <LoaderCircle className="mr-2 size-4 animate-spin" />
                                        Procesando…
                                    </>
                                ) : (
                                    <>
                                        <Receipt className="mr-2 size-4" />
                                        Cobrar reserva
                                    </>
                                )}
                            </Button>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
