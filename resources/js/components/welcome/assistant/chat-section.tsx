import type { ReactNode } from 'react';

const STEP_COUNT = 5;

export function ChatSection({
    children,
    stepNumber,
    title,
}: {
    children: ReactNode;
    stepNumber: number;
    title: string;
}) {
    return (
        <section className="space-y-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-black text-emerald-700">{title}</span>
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-600">
                    {stepNumber}/{STEP_COUNT}
                </span>
            </div>
            <div className="flex gap-1">
                {Array.from({ length: STEP_COUNT }, (_, i) => (
                    <div
                        key={i}
                        className={`h-0.5 flex-1 rounded-full transition-colors duration-300 ${
                            i < stepNumber ? 'bg-emerald-500' : 'bg-slate-100'
                        }`}
                    />
                ))}
            </div>
            {children}
        </section>
    );
}
