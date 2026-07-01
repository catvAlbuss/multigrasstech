import { ArrowLeft, ArrowRight, Bot, MessageCircle, Send, X } from 'lucide-react';
import {
    
    
    useEffect,
    useMemo,
    useState
} from 'react';
import type {ChangeEvent, FormEvent} from 'react';
import type { PublicField } from '@/types/tenant';
import { BotBubble } from './assistant/bot-bubble';
import { ChatSection } from './assistant/chat-section';
import { StepClient } from './assistant/step-client';
import { StepField } from './assistant/step-field';
import { StepPayment } from './assistant/step-payment';
import { StepSchedule } from './assistant/step-schedule';
import { StepSport } from './assistant/step-sport';
import type { BotForm, Slot, Step } from './assistant/types';
import { SuccessPanel } from './assistant/ui';

type ClientLookupStatus = 'idle' | 'found' | 'missing';

const STEP_NUMBERS: Record<Step, number> = {
    sport: 1,
    field: 2,
    schedule: 3,
    client: 4,
    payment: 5,
};

const STEP_TITLES: Record<Step, string> = {
    sport: '1. Deporte',
    field: '2. Espacio',
    schedule: '3. Fecha y hora',
    client: '4. Tus datos',
    payment: '5. Pago',
};

const toLocalIso = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const todayIso = () => toLocalIso(new Date());

const initialForm: BotForm = {
    sport_type: '',
    field_id: '',
    date: todayIso(),
    start_time: '',
    duration_hours: '1',
    document_type: 'dni',
    document_number: '',
    client_name: '',
    client_phone: '',
    client_email: '',
    payment_method: 'yape',
    advance_amount: '',
    payment_operation_number: '',
    notes: '',
};

export function ReservationAssistant({
    fields,
    paymentPhone,
    paymentQrUrl,
    tenantAddress,
    tenantName,
}: {
    fields: PublicField[];
    paymentPhone: string | null;
    paymentQrUrl: string | null;
    tenantAddress: string | null;
    tenantName: string;
}) {
    const [open, setOpen] = useState(false);
    const [step, setStep] = useState<Step>('sport');
    const [form, setForm] = useState<BotForm>(initialForm);
    const [slots, setSlots] = useState<Slot[]>([]);
    const [proof, setProof] = useState<File | null>(null);
    const [secondsLeft, setSecondsLeft] = useState(10 * 60);
    const [lookupLoading, setLookupLoading] = useState(false);
    const [clientLookupStatus, setClientLookupStatus] =
        useState<ClientLookupStatus>('idle');
    const [submitting, setSubmitting] = useState(false);
    const [assistantReply, setAssistantReply] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [successCode, setSuccessCode] = useState<string | null>(null);

    const sports = useMemo(
        () =>
            Array.from(
                new Set(
                    fields
                        .map((f) => f.sport_type)
                        .filter(
                            (s): s is string => Boolean(s) && s !== 'multisport',
                        ),
                ),
            ),
        [fields],
    );

    const filteredFields = useMemo(
        () =>
            form.sport_type
                ? fields.filter((f) => f.sport_type === form.sport_type)
                : [],
        [fields, form.sport_type],
    );

    const selectedField = useMemo(
        () => fields.find((f) => String(f.id) === form.field_id) ?? null,
        [fields, form.field_id],
    );

    const dateOptions = useMemo(() => {
        const dates: string[] = [];
        const base = new Date();

        for (let i = 0; i < 14; i++) {
            const d = new Date(base);
            d.setDate(base.getDate() + i);
            dates.push(toLocalIso(d));
        }

        return dates;
    }, []);

    const duration = Number(form.duration_hours || 1);
    const totalAmount = selectedField
        ? Number(selectedField.hourly_rate) * duration
        : 0;
    const requiredAdvance = totalAmount > 0 ? totalAmount * 0.5 : 0;
    const availableSlots = useMemo(() => {
        return slots.filter((slot, index) => {
            if (!slot.available) {
return false;
}

            const candidateSlots = slots.slice(index, index + duration);

            return (
                candidateSlots.length === duration &&
                candidateSlots.every((candidate, candidateIndex) => {
                    if (!candidate.available) {
return false;
}

                    if (candidateIndex === 0) {
return true;
}

                    return (
                        candidate.start_time ===
                        candidateSlots[candidateIndex - 1].end_time
                    );
                })
            );
        });
    }, [duration, slots]);

    useEffect(() => {
        if (!open || step !== 'payment' || successCode) {
return;
}

        const timer = window.setInterval(
            () => setSecondsLeft((c) => Math.max(0, c - 1)),
            1000,
        );

        return () => window.clearInterval(timer);
    }, [open, step, successCode]);

    useEffect(() => {
        if (!selectedField || !form.date) {
            setSlots([]);

            return;
        }

        const params = new URLSearchParams({
            field_id: String(selectedField.id),
            date: form.date,
        });
        fetch(`/reservations/public/availability?${params.toString()}`, {
            headers: { Accept: 'application/json' },
        })
            .then((r) => r.json())
            .then((data: { slots?: Slot[] }) => setSlots(data.slots ?? []))
            .catch(() => setSlots([]));
    }, [form.date, selectedField]);

    function update<K extends keyof BotForm>(key: K, value: BotForm[K]) {
        setForm((c) => ({ ...c, [key]: value }));
    }

    function updateForm<K extends keyof BotForm>(key: K, value: BotForm[K]) {
        if (key === 'document_number' || key === 'document_type') {
            setClientLookupStatus('idle');
            setError(null);
            setForm((c) => ({
                ...c,
                [key]: value,
                client_name: '',
                client_phone: '',
                client_email: '',
            }));

            return;
        }

        update(key, value);
    }

    function csrfToken() {
        return (
            document
                .querySelector('meta[name="csrf-token"]')
                ?.getAttribute('content') ?? ''
        );
    }

    async function askAi(message: string) {
        try {
            const res = await fetch('/reservations/public/assistant-reply', {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken(),
                },
                body: JSON.stringify({
                    message,
                    context: {
                        tenant: tenantName,
                        address: tenantAddress,
                        sport: form.sport_type,
                        field: selectedField?.name,
                        date: form.date,
                        available_slots: availableSlots
                            .slice(0, 8)
                            .map((s) => s.start_time),
                        fields: filteredFields.map((field) => ({
                            name: field.name,
                            sport: field.sport_type,
                            hourly_rate: field.hourly_rate,
                            shared: Boolean(field.shared_group_id),
                        })),
                        total_amount: totalAmount,
                        required_advance: requiredAdvance,
                    },
                }),
            });
            const data = (await res.json()) as { reply?: string };
            setAssistantReply(data.reply ?? null);
        } catch {
            // AI is optional — ignore network errors
        }
    }

    async function lookupDocument() {
        setError(null);
        setLookupLoading(true);
        const params = new URLSearchParams({
            document_type: form.document_type,
            document_number: form.document_number,
        });

        try {
            const res = await fetch(
                `/reservations/public/document-lookup?${params.toString()}`,
                { headers: { Accept: 'application/json' } },
            );
            const data = (await res.json()) as {
                client?: {
                    name?: string;
                    phone?: string | null;
                    email?: string | null;
                };
                message?: string;
            };

            if (!res.ok || !data.client?.name) {
                throw new Error(
                    data.message ?? 'No encontramos el documento.',
                );
            }

            update('client_name', data.client.name);
            update('client_phone', data.client.phone ?? form.client_phone);
            update('client_email', data.client.email ?? form.client_email);
            setClientLookupStatus('found');
            setAssistantReply(null);
        } catch {
            setClientLookupStatus('missing');
            setAssistantReply(null);
            setError(null);
        } finally {
            setLookupLoading(false);
        }
    }

    function goTo(nextStep: Step, message: string) {
        setStep(nextStep);
        void askAi(message);
    }

    function goBack() {
        setError(null);
        setAssistantReply(null);

        if (step === 'field') {
            setStep('sport');
            update('field_id', '');
        }

        if (step === 'schedule') {
            setStep('field');
            update('start_time', '');
        }

        if (step === 'client') {
            setStep('schedule');
        }

        if (step === 'payment') {
            setStep('client');
        }
    }

    async function submit(event: FormEvent) {
        event.preventDefault();
        setError(null);

        if (!proof) {
            setError('Sube la foto del comprobante para enviar la reserva.');

            return;
        }

        if (secondsLeft === 0) {
            setError('El tiempo vencio. Reinicia el proceso para reservar.');

            return;
        }

        setSubmitting(true);
        const payload = new FormData();
        Object.entries(form).forEach(([k, v]) => payload.append(k, v));
        payload.set('advance_amount', requiredAdvance.toFixed(2));
        payload.append('payment_proof', proof);

        try {
            const res = await fetch('/reservations/public', {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': csrfToken(),
                },
                body: payload,
            });
            const data = (await res.json()) as {
                message?: string;
                reservation?: { code?: string };
                errors?: Record<string, string[]>;
            };

            if (!res.ok) {
                const firstError = data.errors
                    ? Object.values(data.errors)[0]?.[0]
                    : null;

                throw new Error(
                    firstError ?? data.message ?? 'No pudimos registrar la reserva.',
                );
            }

            setSuccessCode(data.reservation?.code ?? 'Pendiente');
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : 'No pudimos registrar la reserva.',
            );
        } finally {
            setSubmitting(false);
        }
    }

    if (!open) {
        return (
            <button
                type="button"
                onClick={() => setOpen(true)}
                className="fixed right-4 bottom-4 z-50 inline-flex max-w-[calc(100vw-2rem)] items-center gap-3 rounded-full bg-emerald-500 px-4 py-3 text-sm font-semibold text-white shadow-xl shadow-emerald-900/50 transition hover:bg-emerald-400 sm:right-6 sm:bottom-6 sm:px-5"
            >
                <span className="grid size-9 place-items-center rounded-full bg-white/20">
                    <MessageCircle className="size-5" />
                </span>
                <span className="hidden sm:inline">Reservar ahora</span>
                <ArrowRight className="size-4" />
            </button>
        );
    }

    return (
        <aside className="fixed right-3 bottom-3 z-50 flex max-h-[calc(100dvh-5rem)] w-[calc(100vw-1.5rem)] max-w-105 flex-col overflow-hidden rounded-2xl border border-white/10 bg-white text-slate-900 shadow-2xl shadow-emerald-950/30 sm:right-6 sm:bottom-6">
            {/* Header */}
            <div className="bg-linear-to-br from-emerald-700 via-green-600 to-teal-500 px-4 pt-4 pb-6 text-white">
                <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-white/20 ring-2 ring-white/30">
                            <Bot className="size-5" />
                        </span>
                        <div className="min-w-0">
                            <p className="text-[10px] font-semibold tracking-widest text-white/70 uppercase">
                                Asistente de reservas
                            </p>
                            <h2 className="truncate text-sm font-black leading-tight">
                                {tenantName}
                            </h2>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => setOpen(false)}
                        className="grid size-8 shrink-0 place-items-center rounded-full text-white/80 transition hover:bg-white/15 hover:text-white"
                        aria-label="Cerrar asistente"
                    >
                        <X className="size-4" />
                    </button>
                </div>
                <p className="mt-2.5 text-[11px] leading-5 text-white/72">
                    Disponibilidad en tiempo real. Campos compartidos bloquean
                    el mismo horario fisico.
                </p>
            </div>

            {/* Chat body */}
            <form
                onSubmit={submit}
                className="-mt-3 flex-1 space-y-3 overflow-y-auto px-4 pb-4"
            >
                <BotBubble>
                    Hola! Elige el deporte y te mostrare solo los espacios que
                    corresponden para reservar.
                </BotBubble>

                {assistantReply && <BotBubble>{assistantReply}</BotBubble>}

                {successCode ? (
                    <SuccessPanel code={successCode} />
                ) : (
                    <>
                        {step === 'sport' && (
                            <ChatSection
                                stepNumber={STEP_NUMBERS.sport}
                                title={STEP_TITLES.sport}
                            >
                                <StepSport
                                    form={form}
                                    sports={sports}
                                    update={updateForm}
                                    onNext={() =>
                                        goTo(
                                            'field',
                                            `Quiero practicar ${form.sport_type}.`,
                                        )
                                    }
                                />
                            </ChatSection>
                        )}

                        {step === 'field' && (
                            <ChatSection
                                stepNumber={STEP_NUMBERS.field}
                                title={STEP_TITLES.field}
                            >
                                <button
                                    type="button"
                                    onClick={goBack}
                                    className="inline-flex items-center gap-1 text-xs font-black text-slate-500 transition hover:text-emerald-700"
                                >
                                    <ArrowLeft className="size-3.5" />
                                    Regresar
                                </button>
                                <StepField
                                    filteredFields={filteredFields}
                                    form={form}
                                    update={updateForm}
                                    onNext={() =>
                                        goTo(
                                            'schedule',
                                            `Quiero reservar ${selectedField?.name}.`,
                                        )
                                    }
                                />
                            </ChatSection>
                        )}

                        {step === 'schedule' && (
                            <ChatSection
                                stepNumber={STEP_NUMBERS.schedule}
                                title={STEP_TITLES.schedule}
                            >
                                <button
                                    type="button"
                                    onClick={goBack}
                                    className="inline-flex items-center gap-1 text-xs font-black text-slate-500 transition hover:text-emerald-700"
                                >
                                    <ArrowLeft className="size-3.5" />
                                    Regresar
                                </button>
                                <StepSchedule
                                    availableSlots={availableSlots}
                                    dateOptions={dateOptions}
                                    form={form}
                                    totalAmount={totalAmount}
                                    update={updateForm}
                                    onNext={() =>
                                        goTo(
                                            'client',
                                            `Elijo ${form.date} a las ${form.start_time}.`,
                                        )
                                    }
                                />
                            </ChatSection>
                        )}

                        {step === 'client' && (
                            <ChatSection
                                stepNumber={STEP_NUMBERS.client}
                                title={STEP_TITLES.client}
                            >
                                <button
                                    type="button"
                                    onClick={goBack}
                                    className="inline-flex items-center gap-1 text-xs font-black text-slate-500 transition hover:text-emerald-700"
                                >
                                    <ArrowLeft className="size-3.5" />
                                    Regresar
                                </button>
                                <StepClient
                                    form={form}
                                    lookupStatus={clientLookupStatus}
                                    lookupLoading={lookupLoading}
                                    update={updateForm}
                                    onLookup={() => void lookupDocument()}
                                    onNext={() => {
                                        setSecondsLeft(10 * 60);
                                        goTo(
                                            'payment',
                                            'Mis datos estan completos. Quiero pagar.',
                                        );
                                    }}
                                />
                            </ChatSection>
                        )}

                        {step === 'payment' && (
                            <ChatSection
                                stepNumber={STEP_NUMBERS.payment}
                                title={STEP_TITLES.payment}
                            >
                                <button
                                    type="button"
                                    onClick={goBack}
                                    className="inline-flex items-center gap-1 text-xs font-black text-slate-500 transition hover:text-emerald-700"
                                >
                                    <ArrowLeft className="size-3.5" />
                                    Regresar
                                </button>
                                <StepPayment
                                    form={form}
                                    paymentPhone={paymentPhone}
                                    paymentQrUrl={paymentQrUrl}
                                    proofName={
                                        proof?.name ?? 'Sube la foto del pago'
                                    }
                                    secondsLeft={secondsLeft}
                                    tenantName={tenantName}
                                    totalAmount={totalAmount}
                                    requiredAdvance={requiredAdvance}
                                    update={updateForm}
                                    onProofChange={(e: ChangeEvent<HTMLInputElement>) =>
                                        setProof(e.target.files?.[0] ?? null)
                                    }
                                />
                            </ChatSection>
                        )}

                        {step === 'payment' && (
                            <textarea
                                value={form.notes}
                                onChange={(e) => update('notes', e.target.value)}
                                className="chat-input min-h-14 resize-none pt-2 text-xs"
                                placeholder="Nota opcional para el administrador..."
                            />
                        )}

                        {error && (
                            <p className="rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
                                {error}
                            </p>
                        )}

                        {step === 'payment' && (
                            <button
                                type="submit"
                                disabled={submitting || secondsLeft === 0}
                                className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-emerald-500 text-sm font-black text-white shadow-lg shadow-emerald-900/25 transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:bg-slate-300"
                            >
                                {submitting ? 'Enviando...' : 'Enviar reserva'}
                                <Send className="size-4" />
                            </button>
                        )}
                    </>
                )}
            </form>
        </aside>
    );
}
