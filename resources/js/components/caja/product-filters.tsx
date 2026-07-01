import { Search } from 'lucide-react';
import { CATEGORY_LABELS } from '@/lib/caja';

export function ProductFilters({
    categories,
    categoryFilter,
    searchQuery,
    onCategoryChange,
    onSearchChange,
}: {
    categories: string[];
    categoryFilter: string;
    searchQuery: string;
    onCategoryChange: (category: string) => void;
    onSearchChange: (query: string) => void;
}) {
    return (
        <section className="shrink-0 rounded-lg border border-slate-200 bg-white p-3 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0">
                    <button
                        type="button"
                        onClick={() => onCategoryChange('')}
                        className={`h-11 shrink-0 rounded-md px-4 text-sm font-bold transition ${
                            categoryFilter === ''
                                ? 'bg-emerald-600 text-white shadow-sm'
                                : 'border border-slate-200 bg-white text-slate-700 hover:border-emerald-300 hover:bg-emerald-50 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-emerald-950/20'
                        }`}
                    >
                        Todos
                    </button>
                    {categories.map((category) => (
                        <button
                            key={category}
                            type="button"
                            onClick={() =>
                                onCategoryChange(
                                    category === categoryFilter ? '' : category,
                                )
                            }
                            className={`h-11 shrink-0 rounded-md px-4 text-sm font-bold transition ${
                                categoryFilter === category
                                    ? 'bg-emerald-600 text-white shadow-sm'
                                    : 'border border-slate-200 bg-white text-slate-700 hover:border-emerald-300 hover:bg-emerald-50 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-emerald-950/20'
                            }`}
                        >
                            {CATEGORY_LABELS[category] ?? category}
                        </button>
                    ))}
                </div>

                <div className="relative w-full xl:w-[420px]">
                    <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-slate-400" />
                    <input
                        type="search"
                        placeholder="Buscar producto, codigo o presentacion"
                        value={searchQuery}
                        onChange={(event) => onSearchChange(event.target.value)}
                        className="h-11 w-full rounded-md border border-slate-200 bg-slate-50 pr-4 pl-11 text-sm font-semibold text-slate-900 shadow-sm transition outline-none placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/15 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100 dark:focus:border-emerald-700 dark:focus:bg-neutral-900"
                    />
                </div>
            </div>
        </section>
    );
}
