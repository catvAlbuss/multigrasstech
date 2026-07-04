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
        <section className="shrink-0 rounded-lg border border-white/10 bg-slate-900/70 p-3 shadow-[0_18px_44px_rgba(0,0,0,0.2)] backdrop-blur">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0">
                    <button
                        type="button"
                        onClick={() => onCategoryChange('')}
                        className={`h-11 shrink-0 rounded-md px-4 text-sm font-bold transition ${
                            categoryFilter === ''
                                ? 'border border-emerald-400/50 bg-emerald-500/20 text-emerald-200 shadow-[inset_0_0_0_1px_rgba(34,197,94,0.12)]'
                                : 'border border-white/10 bg-white/[0.03] text-slate-300 hover:border-emerald-400/40 hover:bg-emerald-500/10 hover:text-emerald-200'
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
                                    ? 'border border-emerald-400/50 bg-emerald-500/20 text-emerald-200 shadow-[inset_0_0_0_1px_rgba(34,197,94,0.12)]'
                                    : 'border border-white/10 bg-white/[0.03] text-slate-300 hover:border-emerald-400/40 hover:bg-emerald-500/10 hover:text-emerald-200'
                            }`}
                        >
                            {CATEGORY_LABELS[category] ?? category}
                        </button>
                    ))}
                </div>

                <div className="relative w-full xl:w-[420px]">
                    <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-slate-500" />
                    <input
                        type="search"
                        placeholder="Buscar producto, codigo o presentacion"
                        value={searchQuery}
                        onChange={(event) => onSearchChange(event.target.value)}
                        className="h-11 w-full rounded-md border border-white/10 bg-slate-950/70 pr-4 pl-11 text-sm font-semibold text-slate-100 shadow-sm transition outline-none placeholder:text-slate-500 focus:border-emerald-400/50 focus:bg-slate-950 focus:ring-2 focus:ring-emerald-500/15"
                    />
                </div>
            </div>
        </section>
    );
}
