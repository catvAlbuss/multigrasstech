import { formatMoney } from '@/lib/caja';
import type { CajaExpenseTransaction, CajaSaleToday } from '@/types/caja';

export function TodayMovements({
    sales,
    expenses,
}: {
    sales: CajaSaleToday[];
    expenses: CajaExpenseTransaction[];
}) {
    const total = sales.length + expenses.length;

    if (total === 0) {
return null;
}

    return (
        <details className="group rounded-lg border border-slate-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
            <summary className="flex cursor-pointer items-center justify-between px-4 py-3 text-sm font-bold text-slate-700 dark:text-neutral-200">
                Movimientos de hoy ({total})
                <span className="text-xs font-semibold text-slate-500 group-open:hidden dark:text-neutral-400">
                    Ver
                </span>
                <span className="hidden text-xs font-semibold text-slate-500 group-open:inline dark:text-neutral-400">
                    Ocultar
                </span>
            </summary>
            <div className="max-h-56 divide-y divide-slate-100 overflow-y-auto border-t border-slate-100 px-4 dark:divide-neutral-800 dark:border-neutral-800">
                {sales.map((sale) => (
                    <div
                        key={sale.id}
                        className="flex items-center justify-between gap-3 py-2"
                    >
                        <div className="min-w-0">
                            <p className="truncate text-xs font-bold text-slate-800 dark:text-neutral-200">
                                {sale.sale_number}
                            </p>
                            <p className="truncate text-[11px] text-slate-500 dark:text-neutral-400">
                                {sale.customer_name}
                            </p>
                        </div>
                        <span className="shrink-0 text-xs font-black text-emerald-600">
                            +{formatMoney(Number(sale.total))}
                        </span>
                    </div>
                ))}
                {expenses.map((expense) => (
                    <div
                        key={expense.id}
                        className="flex items-center justify-between gap-3 py-2"
                    >
                        <div className="min-w-0">
                            <p className="truncate text-xs font-bold text-slate-800 dark:text-neutral-200">
                                {expense.description}
                            </p>
                            <p className="truncate text-[11px] text-slate-500 capitalize dark:text-neutral-400">
                                {expense.category}
                            </p>
                        </div>
                        <span className="shrink-0 text-xs font-black text-rose-600">
                            -{formatMoney(Number(expense.amount))}
                        </span>
                    </div>
                ))}
            </div>
        </details>
    );
}
