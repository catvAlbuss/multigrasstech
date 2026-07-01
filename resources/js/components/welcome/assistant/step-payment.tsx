import { ImagePlus } from 'lucide-react';
import type { ChangeEvent } from 'react';
import type { BotForm, UpdateForm } from './types';
import { Segmented, Timer } from './ui';

export function StepPayment({
    form,
    paymentPhone,
    paymentQrUrl,
    proofName,
    requiredAdvance,
    secondsLeft,
    tenantName,
    totalAmount,
    update,
    onProofChange,
}: {
    form: BotForm;
    onProofChange: (event: ChangeEvent<HTMLInputElement>) => void;
    paymentPhone: string | null;
    paymentQrUrl: string | null;
    proofName: string;
    requiredAdvance: number;
    secondsLeft: number;
    tenantName: string;
    totalAmount: number;
    update: UpdateForm;
}) {
    return (
        <>
            <div className="space-y-3">
                <div className="mx-auto grid aspect-square w-48 place-items-center overflow-hidden rounded-2xl border border-emerald-100 bg-emerald-50 shadow-sm">
                    {paymentQrUrl ? (
                        <img
                            src={paymentQrUrl}
                            alt="QR de pago"
                            className="h-full w-full object-cover"
                        />
                    ) : (
                        <p className="p-2 text-center text-[10px] font-semibold text-emerald-600">
                            QR Yape/Plin
                            <span className="mt-1 block text-[9px] font-normal">
                                Configuralo en Pagina web
                            </span>
                        </p>
                    )}
                </div>

                <Segmented
                    value={form.payment_method}
                    onChange={(v) => update('payment_method', v)}
                />

                <div className="space-y-1 rounded-xl bg-slate-50 px-3 py-2 text-center text-xs text-slate-600">
                    <p>
                        Titular: <strong>{tenantName}</strong>
                    </p>
                    <p>Numero: {paymentPhone ?? 'por configurar'}</p>
                    <Timer secondsLeft={secondsLeft} />
                </div>
            </div>

            <div className="rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-600">
                Total:{' '}
                <strong className="text-emerald-700">
                    S/ {totalAmount.toFixed(2)}
                </strong>
                <span className="ml-1.5 text-slate-400">
                    - Adelanto 50%: S/ {requiredAdvance.toFixed(2)}
                </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
                <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs">
                    <span className="block text-[10px] font-black tracking-wider text-emerald-600 uppercase">
                        Adelanto automatico
                    </span>
                    <strong className="text-sm text-emerald-800">
                        S/ {requiredAdvance.toFixed(2)}
                    </strong>
                </div>
                <input
                    value={form.payment_operation_number}
                    onChange={(e) =>
                        update('payment_operation_number', e.target.value)
                    }
                    className="chat-input"
                    placeholder="Nro. operacion"
                    required
                />
            </div>

            <label className="flex cursor-pointer items-center justify-between gap-2 rounded-xl border border-dashed border-emerald-300 bg-emerald-50/70 px-3 py-2.5 text-xs text-emerald-700 transition hover:bg-emerald-50">
                <span className="min-w-0 truncate">{proofName}</span>
                <ImagePlus className="size-4 shrink-0" />
                <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={onProofChange}
                    required
                />
            </label>
        </>
    );
}
