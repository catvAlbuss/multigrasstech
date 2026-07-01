import { ArrowRight, CheckCircle2, Clock3 } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function ChoiceGrid({ children, cols = 2 }: { children: ReactNode; cols?: 2 | 3 }) {
    return (
        <div className={cn('grid gap-2', cols === 2 ? 'grid-cols-2' : 'grid-cols-3')}>
            {children}
        </div>
    );
}

export function ChoiceButton({
    active,
    children,
    onClick,
    size = 'md',
}: {
    active: boolean;
    children: ReactNode;
    onClick: () => void;
    size?: 'sm' | 'md';
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                'rounded-xl border text-xs font-semibold transition',
                size === 'sm' ? 'px-2 py-1.5' : 'px-3 py-2',
                active
                    ? 'border-emerald-400 bg-emerald-500 text-white shadow-sm'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-emerald-300 hover:text-emerald-700',
            )}
        >
            {children}
        </button>
    );
}

export function NextButton({
    disabled,
    label = 'Continuar',
    onClick,
}: {
    disabled: boolean;
    label?: string;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            disabled={disabled}
            onClick={onClick}
            className="inline-flex h-10 items-center gap-2 rounded-full bg-emerald-500 px-5 text-xs font-black text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
            {label}
            <ArrowRight className="size-3.5" />
        </button>
    );
}

export function Segmented({
    onChange,
    value,
}: {
    onChange: (value: 'yape' | 'plin') => void;
    value: 'yape' | 'plin';
}) {
    return (
        <div className="grid grid-cols-2 gap-1 rounded-full bg-slate-100 p-1">
            {(['yape', 'plin'] as const).map((method) => (
                <button
                    key={method}
                    type="button"
                    onClick={() => onChange(method)}
                    className={cn(
                        'rounded-full px-3 py-1.5 text-xs font-black uppercase transition',
                        value === method
                            ? 'bg-emerald-500 text-white shadow-sm'
                            : 'text-slate-500 hover:text-emerald-700',
                    )}
                >
                    {method}
                </button>
            ))}
        </div>
    );
}

export function Timer({ secondsLeft }: { secondsLeft: number }) {
    const minutes = Math.floor(secondsLeft / 60);
    const seconds = String(secondsLeft % 60).padStart(2, '0');
    const urgent = secondsLeft <= 60;

    return (
        <div
            className={cn(
                'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold',
                urgent ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700',
            )}
        >
            <Clock3 className="size-3" />
            {minutes}:{seconds} para pagar
        </div>
    );
}

export function SuccessPanel({ code }: { code: string }) {
    return (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-center">
            <CheckCircle2 className="mx-auto size-12 text-emerald-500" />
            <p className="mt-3 text-sm font-black text-emerald-800">Reserva enviada</p>
            <p className="mt-1 text-xs text-emerald-700">
                Codigo: <strong>{code}</strong>
            </p>
            <p className="mt-1 text-xs text-emerald-600">
                Quedara pendiente hasta que validemos el adelanto.
            </p>
        </div>
    );
}
