import { ArrowDownRight, ArrowRight, ArrowUpRight } from 'lucide-react';
import type { DashboardKpiCardProps } from '@/types/dashboard';
import { formatPercentage } from './utils';

export function KpiCard({
    label,
    value,
    detail,
    trend,
    icon: Icon,
    accent,
    progress,
}: DashboardKpiCardProps) {
    const toneClass =
        trend?.tone === 'positive'
            ? 'text-emerald-400'
            : trend?.tone === 'negative'
              ? 'text-red-400'
              : 'text-slate-400';
    const TrendIcon =
        trend?.direction === 'up'
            ? ArrowUpRight
            : trend?.direction === 'down'
              ? ArrowDownRight
              : ArrowRight;

    return (
        <div className="relative overflow-hidden rounded-lg border border-white/10 bg-slate-950/70 p-4 shadow-[0_18px_50px_rgba(0,0,0,0.28)]">
            <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-white/20 to-transparent" />
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-xs font-medium text-slate-300">
                        {label}
                    </p>
                    <p className="mt-2 truncate text-2xl font-bold tracking-tight text-white">
                        {value}
                    </p>
                </div>
                <div
                    className={`flex size-10 shrink-0 items-center justify-center rounded-full ${accent}`}
                >
                    <Icon className="size-5" />
                </div>
            </div>

            <div className="mt-4 flex min-h-4 items-center gap-1 text-xs">
                {trend ? (
                    <>
                        <TrendIcon className={`size-3.5 ${toneClass}`} />
                        <span className={`font-semibold ${toneClass}`}>
                            {formatPercentage(trend.percentage)}
                        </span>
                        <span className="truncate text-slate-400">
                            {trend.label}
                        </span>
                    </>
                ) : (
                    <span className="truncate text-slate-400">{detail}</span>
                )}
            </div>

            {typeof progress === 'number' && (
                <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-800">
                    <div
                        className="h-full rounded-full bg-emerald-400"
                        style={{
                            width: `${Math.min(Math.max(progress, 0), 100)}%`,
                        }}
                    />
                </div>
            )}
        </div>
    );
}
