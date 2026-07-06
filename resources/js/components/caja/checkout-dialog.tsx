import { usePage } from '@inertiajs/react';
import {
    AlertCircle,
    BadgeCheck,
    Banknote,
    ChevronRight,
    CheckCircle2,
    Database,
    FileText,
    LoaderCircle,
    Receipt,
    Search,
    User,
    UserCog,
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
import type {
    CajaStaffOption,
    CartItem,
    CheckoutFormData,
    SaleData,
} from '@/types/caja';
import type { ClientLookupResponse } from '@/types/tenant';

const IGV_RATE = 0.18;

function fmt(n: number) {
    return `S/ ${n.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function calcTotals(cart: CartItem[], igvApplied: boolean) {
    let rawTotal = 0;
    let igvAmount = 0;

    for (const item of cart) {
        const lineTotal = item.unit_price * item.quantity;
        rawTotal += lineTotal;

        if (igvApplied && item.igv_type === 'gravado') {
            igvAmount += lineTotal - lineTotal / (1 + IGV_RATE);
        }
    }

    const subtotal = rawTotal - igvAmount;

    return {
        subtotal: Math.round(subtotal * 100) / 100,
        igvAmount: Math.round(igvAmount * 100) / 100,
        total: Math.round(rawTotal * 100) / 100,
    };
}

const EMPTY_FORM: Omit<CheckoutFormData, 'attended_by'> = {
    document_type: 'boleta',
    customer_doc_type: 'sin_documento',
    customer_doc_number: '',
    customer_name: 'CONSUMIDOR FINAL',
    customer_address: '',
    customer_email: '',
    igv_applied: false,
    payment_amount: '',
    notes: '',
};

type Step = 'comprobante' | 'cliente' | 'cobro';

const STEPS: { key: Step; label: string }[] = [
    { key: 'comprobante', label: 'Comprobante' },
    { key: 'cliente', label: 'Cliente' },
    { key: 'cobro', label: 'Cobro' },
];

function csrfToken() {
    return (
        document
            .querySelector<HTMLMetaElement>('meta[name="csrf-token"]')
            ?.getAttribute('content') ?? ''
    );
}

async function fetchJson<T>(
    url: string,
    options: RequestInit = {},
): Promise<T> {
    const response = await fetch(url, {
        credentials: 'same-origin',
        ...options,
        headers: {
            Accept: 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            ...options.headers,
        },
    });
    const data = (await response.json().catch(() => ({}))) as {
        message?: string;
    };

    if (!response.ok) {
        throw new Error(data.message ?? 'Error de consulta');
    }

    return data as T;
}

export function CheckoutDialog({
    open,
    cart,
    igvApplied,
    staff,
    onOpenChange,
    onSuccess,
}: {
    open: boolean;
    cart: CartItem[];
    igvApplied: boolean;
    staff: CajaStaffOption[];
    onOpenChange: (open: boolean) => void;
    onSuccess: (sale: SaleData) => void;
}) {
    const { auth } = usePage<{ auth: { user: { id: number } } }>().props;
    const [step, setStep] = useState<Step>('comprobante');
    const [form, setForm] = useState<CheckoutFormData>({
        ...EMPTY_FORM,
        igv_applied: igvApplied,
        attended_by: auth.user.id,
    });
    const [lookingUp, setLookingUp] = useState(false);
    const [lookupMsg, setLookupMsg] = useState<{
        text: string;
        type: 'success' | 'error' | 'info';
    } | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const totals = useMemo(
        () => calcTotals(cart, form.igv_applied),
        [cart, form.igv_applied],
    );
    const paymentNum = parseFloat(form.payment_amount) || 0;
    const change = Math.max(0, paymentNum - totals.total);

    function setField<K extends keyof CheckoutFormData>(
        key: K,
        value: CheckoutFormData[K],
    ) {
        setForm((prev) => ({ ...prev, [key]: value }));
    }

    function handleDocTypeChange(value: CheckoutFormData['customer_doc_type']) {
        setField('customer_doc_type', value);
        setLookupMsg(null);

        if (value === 'sin_documento') {
            setField('customer_name', 'CONSUMIDOR FINAL');
            setField('customer_doc_number', '');
        } else if (form.customer_name === 'CONSUMIDOR FINAL') {
            setField('customer_name', '');
        }
    }

    function handleDocTypeChange2(value: CheckoutFormData['document_type']) {
        setField('document_type', value);

        // Factura requiere RUC
        if (value === 'factura' && form.customer_doc_type !== 'ruc') {
            setField('customer_doc_type', 'ruc');
            setField('customer_name', '');
            setField('customer_doc_number', '');
        }
    }

    async function lookupDocument() {
        const docType = form.customer_doc_type;

        if (!['dni', 'ruc'].includes(docType)) {
return;
}

        const expectedLen = docType === 'dni' ? 8 : 11;
        const num = form.customer_doc_number.replace(/\D/g, '');

        if (num.length !== expectedLen) {
            setLookupMsg({
                text: `Ingresa ${expectedLen} dígitos para ${docType.toUpperCase()}.`,
                type: 'error',
            });

            return;
        }

        setLookingUp(true);
        setLookupMsg(null);

        try {
            const params = new URLSearchParams({
                document_type: docType,
                document_number: num,
            });
            const payload = await fetchJson<
                ClientLookupResponse & {
                    message?: string;
                }
            >(`/clients/document-lookup?${params.toString()}`);

            if (payload.exists && 'id' in payload.client) {
                const c =
                    payload.client as import('@/types/tenant').TenantClientEdit;
                setField('customer_name', c.name);

                if (c.lookup_metadata?.address) {
setField('customer_address', c.lookup_metadata.address);
}

                if (c.email) {
setField('customer_email', c.email);
}

                setLookupMsg({
                    text: 'Cliente encontrado en base de datos.',
                    type: 'success',
                });
            } else if ('metadata' in payload.client) {
                const c = payload.client as {
                    name: string;
                    metadata: import('@/types/tenant').ClientLookupMetadata;
                };
                setField('customer_name', c.name);

                if (c.metadata?.address) {
setField('customer_address', c.metadata.address);
}

                setLookupMsg({
                    text: 'Validado en RENIEC/SUNAT.',
                    type: 'info',
                });
            }
        } catch (e) {
            setLookupMsg({
                text: e instanceof Error ? e.message : 'Error de consulta',
                type: 'error',
            });
        } finally {
            setLookingUp(false);
        }
    }

    async function handleSubmit() {
        if (paymentNum < totals.total) {
            setError('El monto recibido es menor al total de la venta.');

            return;
        }

        if (
            form.document_type === 'factura' &&
            form.customer_doc_number.length !== 11
        ) {
            setError('La factura requiere RUC de 11 dígitos.');

            return;
        }

        setSubmitting(true);
        setError(null);

        const payload = {
            document_type: form.document_type,
            customer_doc_type: form.customer_doc_type,
            customer_doc_number: form.customer_doc_number || null,
            customer_name: form.customer_name || 'CONSUMIDOR FINAL',
            customer_address: form.customer_address || null,
            customer_email: form.customer_email || null,
            attended_by: form.attended_by || null,
            igv_applied: form.igv_applied,
            payment_amount: paymentNum,
            notes: form.notes || null,
            items: cart.map((i) => ({
                product_id: i.product_id,
                product_variant_id: i.product_variant_id ?? null,
                quantity: i.quantity,
            })),
        };

        try {
            const data = await fetchJson<{
                success: boolean;
                sale?: SaleData;
                message?: string;
            }>('/caja/checkout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken(),
                },
                body: JSON.stringify(payload),
            });

            if (!data.success) {
                setError(data.message ?? 'Error al procesar la venta.');

                return;
            }

            onSuccess(data.sale!);
            onOpenChange(false);
        } catch (err: any) {
            setError(
                err.response?.data?.message ||
                    'Error de conexión. Verifica tu red e intenta de nuevo.',
            );
        } finally {
            setSubmitting(false);
        }
    }

    const stepIndex = STEPS.findIndex((s) => s.key === step);
    const canGoNext =
        step === 'comprobante'
            ? true
            : step === 'cliente'
              ? form.customer_name.trim() !== ''
              : true;

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

    const paymentOptions = [
        { label: 'Exacto', value: totals.total },
        { label: '+ S/ 10', value: totals.total + 10 },
        { label: '+ S/ 20', value: totals.total + 20 },
        { label: 'Redondear', value: Math.ceil(totals.total / 10) * 10 },
    ].filter(
        (option, index, list) =>
            list.findIndex((item) => item.value === option.value) === index,
    );

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className="max-h-[94vh] overflow-hidden p-0 sm:max-w-4xl"
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
                                Cobrar venta
                                <span className="mt-1 block text-sm font-normal text-muted-foreground">
                                    Completa los datos y confirma el pago para
                                    cerrar la venta.
                                </span>
                            </span>
                        </DialogTitle>
                    </DialogHeader>
                </div>

                <div className="max-h-[calc(94vh-88px)] overflow-y-auto px-5 py-4">
                    {/* Stepper */}
                    <div className="mb-4 flex flex-wrap items-center gap-2">
                        {STEPS.map((s, i) => (
                            <div
                                key={s.key}
                                className="flex items-center gap-1"
                            >
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

                    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_260px]">
                        {/* Main form area */}
                        <div className="space-y-5">
                            {/* ─── Step 1: Comprobante ─── */}
                            {step === 'comprobante' && (
                                <div className="space-y-4">
                                    <div>
                                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                            ¿Qué tipo de comprobante emitirás?
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            Elige boleta para ventas rápidas o
                                            factura cuando el cliente solicite
                                            RUC.
                                        </p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        {[
                                            {
                                                value: 'boleta',
                                                icon: FileText,
                                                label: 'Boleta de Venta',
                                                sub: 'Persona natural / consumidor final',
                                            },
                                            {
                                                value: 'factura',
                                                icon: Receipt,
                                                label: 'Factura',
                                                sub: 'Persona jurídica · RUC obligatorio',
                                            },
                                        ].map(
                                            ({
                                                value,
                                                icon: Icon,
                                                label,
                                                sub,
                                            }) => (
                                                <button
                                                    key={value}
                                                    type="button"
                                                    onClick={() =>
                                                        handleDocTypeChange2(
                                                            value as
                                                                | 'boleta'
                                                                | 'factura',
                                                        )
                                                    }
                                                    className={`flex min-h-40 flex-col items-center gap-2 rounded-lg border-2 p-5 transition-all ${
                                                        form.document_type ===
                                                        value
                                                            ? 'border-green-500 bg-green-50 dark:bg-green-950/30'
                                                            : 'border-gray-200 hover:border-gray-300 dark:border-gray-700'
                                                    }`}
                                                >
                                                    <Icon
                                                        className={`size-8 ${form.document_type === value ? 'text-green-600' : 'text-gray-400'}`}
                                                    />
                                                    <span
                                                        className={`font-semibold ${form.document_type === value ? 'text-green-700 dark:text-green-400' : 'text-gray-700 dark:text-gray-300'}`}
                                                    >
                                                        {label}
                                                    </span>
                                                    <span className="text-center text-xs text-muted-foreground">
                                                        {sub}
                                                    </span>
                                                </button>
                                            ),
                                        )}
                                    </div>

                                    <div className="grid gap-1.5">
                                        <Label htmlFor="co-attendant">
                                            Atendido por
                                        </Label>
                                        <div className="relative">
                                            <UserCog className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                                            <select
                                                id="co-attendant"
                                                value={form.attended_by}
                                                onChange={(e) =>
                                                    setField(
                                                        'attended_by',
                                                        e.target.value ? Number(e.target.value) : '',
                                                    )
                                                }
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

                            {/* ─── Step 2: Cliente ─── */}
                            {step === 'cliente' && (
                                <div className="space-y-4">
                                    <div className="rounded-lg border border-green-100 bg-green-50/60 p-4 dark:border-green-900 dark:bg-green-950/30">
                                        <div className="mb-3 flex items-center gap-2 text-sm font-medium text-green-800 dark:text-green-300">
                                            <Search className="size-4" />{' '}
                                            Consulta documental
                                        </div>

                                        {/* Doc type selector */}
                                        <div className="mb-3 flex flex-wrap gap-2">
                                            {form.document_type ===
                                                'boleta' && (
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleDocTypeChange(
                                                            'sin_documento',
                                                        )
                                                    }
                                                    className={`rounded-md px-3 py-2 text-xs font-bold transition-colors ${
                                                        form.customer_doc_type ===
                                                        'sin_documento'
                                                            ? 'bg-green-600 text-white'
                                                            : 'border border-green-200 text-green-700 hover:bg-green-50'
                                                    }`}
                                                >
                                                    Consumidor Final
                                                </button>
                                            )}
                                            {(
                                                [
                                                    'dni',
                                                    'ruc',
                                                    'pasaporte',
                                                ] as const
                                            )
                                                .filter(
                                                    (t) =>
                                                        form.document_type !==
                                                            'boleta' ||
                                                        t !== 'ruc' ||
                                                        false,
                                                )
                                                .map((t) => (
                                                    <button
                                                        key={t}
                                                        type="button"
                                                        onClick={() =>
                                                            handleDocTypeChange(
                                                                t,
                                                            )
                                                        }
                                                        className={`rounded-md px-3 py-2 text-xs font-bold uppercase transition-colors ${
                                                            form.customer_doc_type ===
                                                            t
                                                                ? 'bg-green-600 text-white'
                                                                : 'border border-green-200 text-green-700 hover:bg-green-50'
                                                        }`}
                                                    >
                                                        {t}
                                                    </button>
                                                ))}
                                        </div>

                                        {/* Lookup row */}
                                        {form.customer_doc_type !==
                                            'sin_documento' && (
                                            <div className="flex gap-2">
                                                <Input
                                                    value={
                                                        form.customer_doc_number
                                                    }
                                                    onChange={(e) =>
                                                        setField(
                                                            'customer_doc_number',
                                                            e.target.value.replace(
                                                                /\D/g,
                                                                '',
                                                            ),
                                                        )
                                                    }
                                                    placeholder={
                                                        form.customer_doc_type ===
                                                        'ruc'
                                                            ? 'RUC de 11 dígitos'
                                                            : form.customer_doc_type ===
                                                                'dni'
                                                              ? 'DNI de 8 dígitos'
                                                              : 'Nº documento'
                                                    }
                                                    maxLength={
                                                        form.customer_doc_type ===
                                                        'ruc'
                                                            ? 11
                                                            : 50
                                                    }
                                                    className="focus-visible:ring-green-500"
                                                />
                                                {['dni', 'ruc'].includes(
                                                    form.customer_doc_type,
                                                ) && (
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        onClick={lookupDocument}
                                                        disabled={lookingUp}
                                                        className="shrink-0"
                                                    >
                                                        {lookingUp ? (
                                                            <LoaderCircle className="size-4 animate-spin" />
                                                        ) : (
                                                            <Search className="size-4" />
                                                        )}
                                                        Consultar
                                                    </Button>
                                                )}
                                            </div>
                                        )}

                                        {/* Lookup message */}
                                        {lookupMsg && (
                                            <div
                                                className={`mt-2 flex items-center gap-2 text-xs ${
                                                    lookupMsg.type === 'error'
                                                        ? 'text-red-600'
                                                        : lookupMsg.type ===
                                                            'success'
                                                          ? 'text-blue-600'
                                                          : 'text-green-700'
                                                }`}
                                            >
                                                {lookupMsg.type ===
                                                'success' ? (
                                                    <Database className="size-3.5" />
                                                ) : (
                                                    <BadgeCheck className="size-3.5" />
                                                )}
                                                {lookupMsg.text}
                                            </div>
                                        )}
                                    </div>

                                    {/* Customer name */}
                                    <div className="grid gap-1.5">
                                        <Label htmlFor="co-name">
                                            Nombre / Razón social
                                            {form.document_type ===
                                                'factura' && (
                                                <span className="text-red-500">
                                                    {' '}
                                                    *
                                                </span>
                                            )}
                                        </Label>
                                        <div className="relative">
                                            <User className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                                            <Input
                                                id="co-name"
                                                value={form.customer_name}
                                                onChange={(e) =>
                                                    setField(
                                                        'customer_name',
                                                        e.target.value,
                                                    )
                                                }
                                                className="pl-9 focus-visible:ring-green-500"
                                                placeholder="Nombre completo o razón social"
                                            />
                                        </div>
                                    </div>

                                    {/* Address (only factura) */}
                                    {form.document_type === 'factura' && (
                                        <div className="grid gap-1.5">
                                            <Label htmlFor="co-address">
                                                Dirección fiscal
                                            </Label>
                                            <Input
                                                id="co-address"
                                                value={form.customer_address}
                                                onChange={(e) =>
                                                    setField(
                                                        'customer_address',
                                                        e.target.value,
                                                    )
                                                }
                                                className="focus-visible:ring-green-500"
                                                placeholder="Av. Principal 123, Lima"
                                            />
                                        </div>
                                    )}

                                    {/* Email */}
                                    <div className="grid gap-1.5">
                                        <Label htmlFor="co-email">
                                            Email (opcional)
                                        </Label>
                                        <Input
                                            id="co-email"
                                            type="email"
                                            value={form.customer_email}
                                            onChange={(e) =>
                                                setField(
                                                    'customer_email',
                                                    e.target.value,
                                                )
                                            }
                                            className="focus-visible:ring-green-500"
                                            placeholder="correo@cliente.com"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* ─── Step 3: Cobro ─── */}
                            {step === 'cobro' && (
                                <div className="space-y-4">
                                    {/* IGV */}
                                    <label className="flex cursor-pointer items-center justify-between rounded-lg border border-dashed border-amber-300 bg-amber-50/60 px-3 py-2.5 dark:border-amber-800 dark:bg-amber-950/20">
                                        <div>
                                            <p className="text-sm font-medium text-amber-800 dark:text-amber-400">
                                                Incluir IGV (18%)
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                Se desglosa en el comprobante
                                            </p>
                                        </div>
                                        <input
                                            type="checkbox"
                                            checked={form.igv_applied}
                                            onChange={(e) =>
                                                setField(
                                                    'igv_applied',
                                                    e.target.checked,
                                                )
                                            }
                                            className="size-4 rounded border-amber-400 text-amber-600"
                                        />
                                    </label>

                                    {/* Payment amount */}
                                    <div className="grid gap-1.5">
                                        <Label htmlFor="co-payment">
                                            Monto recibido (S/){' '}
                                            <span className="text-red-500">
                                                *
                                            </span>
                                        </Label>
                                        <div className="relative">
                                            <span className="absolute top-1/2 left-3 -translate-y-1/2 text-sm font-semibold text-muted-foreground">
                                                S/
                                            </span>
                                            <Input
                                                id="co-payment"
                                                type="number"
                                                step="0.01"
                                                min={totals.total}
                                                value={form.payment_amount}
                                                onChange={(e) =>
                                                    setField(
                                                        'payment_amount',
                                                        e.target.value,
                                                    )
                                                }
                                                className="pl-9 text-lg font-bold focus-visible:ring-green-500"
                                                placeholder="0.00"
                                            />
                                        </div>
                                    </div>

                                    {/* Change */}
                                    {paymentNum > 0 && (
                                        <div
                                            className={`flex items-center justify-between rounded-lg p-3 ${
                                                paymentNum >= totals.total
                                                    ? 'bg-green-50 dark:bg-green-950/30'
                                                    : 'bg-red-50 dark:bg-red-950/30'
                                            }`}
                                        >
                                            <span
                                                className={`text-sm font-medium ${paymentNum >= totals.total ? 'text-green-700' : 'text-red-600'}`}
                                            >
                                                {paymentNum >= totals.total
                                                    ? 'Vuelto:'
                                                    : 'Falta:'}
                                            </span>
                                            <span
                                                className={`text-xl font-bold ${paymentNum >= totals.total ? 'text-green-600' : 'text-red-600'}`}
                                            >
                                                {paymentNum >= totals.total
                                                    ? fmt(change)
                                                    : fmt(
                                                          totals.total -
                                                              paymentNum,
                                                      )}
                                            </span>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                                        {paymentOptions.map((option) => (
                                            <button
                                                key={`${option.label}-${option.value}`}
                                                type="button"
                                                onClick={() =>
                                                    setField(
                                                        'payment_amount',
                                                        option.value.toFixed(2),
                                                    )
                                                }
                                                className="rounded-md border border-green-200 bg-white px-3 py-2 text-sm font-bold text-green-700 transition hover:border-green-400 hover:bg-green-50 dark:border-green-900 dark:bg-neutral-900 dark:text-green-300 dark:hover:bg-green-950/30"
                                            >
                                                <span className="block text-xs text-muted-foreground">
                                                    {option.label}
                                                </span>
                                                {fmt(option.value)}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Notes */}
                                    <div className="grid gap-1.5">
                                        <Label htmlFor="co-notes">
                                            Notas (opcional)
                                        </Label>
                                        <textarea
                                            id="co-notes"
                                            rows={2}
                                            value={form.notes}
                                            onChange={(e) =>
                                                setField(
                                                    'notes',
                                                    e.target.value,
                                                )
                                            }
                                            className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus-visible:ring-1 focus-visible:ring-green-500 focus-visible:outline-none dark:bg-input/30"
                                            placeholder="Observaciones…"
                                        />
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

                        {/* Right: Order summary */}
                        <div className="h-fit rounded-lg border bg-gray-50 p-4 text-sm lg:sticky lg:top-0 dark:bg-neutral-800/50">
                            <div className="mb-3 flex items-center gap-2 font-semibold text-gray-900 dark:text-gray-100">
                                <Banknote className="size-4 text-green-600" />
                                Resumen de venta
                            </div>
                            <ul className="max-h-56 space-y-1.5 overflow-y-auto pr-1 text-xs text-muted-foreground">
                                {cart.map((item) => (
                                    <li
                                        key={`${item.product_id}-${item.product_variant_id ?? 'none'}`}
                                        className="flex justify-between gap-2"
                                    >
                                        <span className="truncate">
                                            {item.quantity}× {item.name}
                                        </span>
                                        <span className="shrink-0 font-medium text-gray-800 dark:text-gray-200">
                                            S/{' '}
                                            {(
                                                item.unit_price * item.quantity
                                            ).toLocaleString('es-PE', {
                                                minimumFractionDigits: 2,
                                            })}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                            <div className="mt-3 space-y-1 border-t pt-3">
                                {form.igv_applied && (
                                    <>
                                        <div className="flex justify-between text-xs text-muted-foreground">
                                            <span>Base</span>
                                            <span>{fmt(totals.subtotal)}</span>
                                        </div>
                                        <div className="flex justify-between text-xs text-muted-foreground">
                                            <span>IGV</span>
                                            <span>{fmt(totals.igvAmount)}</span>
                                        </div>
                                    </>
                                )}
                                <div className="flex justify-between text-base font-black text-green-600">
                                    <span>Total</span>
                                    <span>{fmt(totals.total)}</span>
                                </div>
                            </div>
                            <div className="mt-3 space-y-1 border-t pt-3 text-xs">
                                <div className="flex justify-between text-muted-foreground">
                                    <span>Comprobante</span>
                                    <span className="font-medium capitalize">
                                        {form.document_type}
                                    </span>
                                </div>
                                <div className="flex justify-between text-muted-foreground">
                                    <span>Cliente</span>
                                    <span className="max-w-[80px] truncate text-right font-medium">
                                        {form.customer_name || '—'}
                                    </span>
                                </div>
                                <div className="flex justify-between text-muted-foreground">
                                    <span>Atendió</span>
                                    <span className="max-w-[80px] truncate text-right font-medium">
                                        {staff.find((member) => member.id === form.attended_by)?.name ?? '—'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer navigation */}
                    <div className="mt-5 flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={
                                step === 'comprobante'
                                    ? () => onOpenChange(false)
                                    : goPrev
                            }
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
                                disabled={
                                    submitting || paymentNum < totals.total
                                }
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
                                        Cerrar Venta
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
