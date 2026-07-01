import { ShoppingBasket } from 'lucide-react';
import { formatMoney } from '@/lib/caja';

type Metric = {
    label: string;
    value: string | number;
    sub?: string;
    tone?: 'default' | 'green' | 'red';
};

function MetricCard({ label, value, sub, tone = 'default' }: Metric) {
    const toneClass = {
        default: 'text-slate-950 dark:text-neutral-50',
        green: 'text-emerald-600 dark:text-emerald-300',
        red: 'text-rose-600 dark:text-rose-300',
    }[tone];

    return (
        <div className="min-w-[118px] rounded-md bg-slate-50 px-3 py-2 dark:bg-neutral-950 sm:min-w-0">
            <p className="truncate text-xs text-slate-500 dark:text-neutral-400">
                {label}
            </p>
            <p className={`truncate text-base leading-tight font-black ${toneClass}`}>
                {value}
            </p>
            {sub && (
                <p className="truncate text-xs text-slate-500 dark:text-neutral-400">
                    {sub}
                </p>
            )}
        </div>
    );
}

export function CajaHeader({ date, productsCount, variantsCount, cartUnits, resultsCount, totalsToday, movementsCount }: {
    date: string;
    productsCount: number;
    variantsCount: number;
    cartUnits: number;
    resultsCount: number;
    totalsToday: { income: number; expense: number; balance: number; sales_count: number; };
    movementsCount: number;
}) {
    return (
        <section className="shrink-0 rounded-lg border border-slate-200 bg-white p-3 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 sm:p-4">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                <div className="flex min-w-0 items-center gap-3">
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-sm">
                        <ShoppingBasket className="size-6" />
                    </span>

                    <div className="min-w-0">
                        <h1 className="truncate text-2xl leading-tight font-black text-slate-950 dark:text-neutral-50">
                            Caja
                        </h1>
                        <p className="truncate text-sm text-slate-500 capitalize dark:text-neutral-400">
                            {date}
                        </p>
                    </div>
                </div>

                <div className="-mx-1 grid auto-cols-[minmax(118px,1fr)] grid-flow-col gap-2 overflow-x-auto px-1 pb-1 sm:mx-0 sm:grid-flow-row sm:grid-cols-2 sm:overflow-visible sm:px-0 sm:pb-0 md:grid-cols-4 xl:min-w-[780px] xl:grid-cols-8">
                    <MetricCard label="Productos" value={productsCount} />
                    <MetricCard label="Presentaciones" value={variantsCount} />
                    <MetricCard label="En carrito" value={cartUnits} tone="green" />
                    <MetricCard label="Resultados" value={resultsCount} />
                    <MetricCard label="Ingresos" value={formatMoney(totalsToday.income)}
                        sub={`${totalsToday.sales_count} venta${totalsToday.sales_count !== 1 ? 's' : ''
                            }`}
                        tone="green" />
                    <MetricCard label="Salidas" value={formatMoney(totalsToday.expense)} tone="red" />
                    <MetricCard label="Balance" value={formatMoney(totalsToday.balance)} tone={totalsToday.balance >= 0 ? 'green' : 'red'} />
                    <MetricCard label="Movimientos" value={movementsCount} />
                </div>
            </div>
        </section>
    );
}
