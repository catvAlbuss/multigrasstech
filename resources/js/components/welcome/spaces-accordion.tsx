import { Link } from '@inertiajs/react';
import { ArrowRight, ChevronDown, Trophy } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { getFieldMeta } from '@/lib/welcome';
import type { PublicField } from '@/types/tenant';

export function SpacesAccordion({
    fields,
    primaryHref,
}: {
    fields: PublicField[];
    primaryHref: string;
}) {
    const defaultIndex = Math.max(
        0,
        fields.findIndex((field) => field.is_featured),
    );
    const [activeIndex, setActiveIndex] = useState<number>(defaultIndex);

    return (
        <div className="space-y-6">
            <div className="hidden h-[560px] gap-4 overflow-hidden lg:flex">
                {fields.map((field, index) => {
                    const isActive = index === activeIndex;
                    const meta = getFieldMeta(field);

                    return (
                        <button
                            key={field.id ?? index}
                            type="button"
                            onClick={() => setActiveIndex(index)}
                            onMouseEnter={() => setActiveIndex(index)}
                            onFocus={() => setActiveIndex(index)}
                            aria-expanded={isActive}
                            className={cn(
                                'group relative h-full overflow-hidden rounded-[28px] border border-white/10 bg-[#101b2d] text-left shadow-2xl shadow-black/25 transition-[flex,opacity,filter] duration-300 ease-out',
                                isActive
                                    ? 'flex-[3.5] opacity-100'
                                    : 'flex-[0.82] opacity-75 grayscale-[18%] hover:flex-[1.1] hover:opacity-95 hover:grayscale-0',
                            )}
                        >
                            {field.image_url ? (
                                <img
                                    src={field.image_url}
                                    alt={field.name}
                                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                />
                            ) : (
                                <div className="absolute inset-0 bg-linear-to-br from-emerald-950 via-[#101b2d] to-[#17243a]" />
                            )}
                            <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/35 to-black/10" />
                            <div className="absolute inset-0 ring-1 ring-white/10 ring-inset" />

                            {!isActive && (
                                <div className="absolute inset-x-0 bottom-0 flex justify-center pb-8">
                                    <div className="flex -rotate-90 items-center gap-3 whitespace-nowrap">
                                        <span className="text-xs font-bold tracking-[0.28em] text-white/80 uppercase">
                                            {field.name}
                                        </span>
                                        <span className="h-px w-10 bg-emerald-300/70" />
                                        <span className="text-xs font-semibold text-emerald-300">
                                            {meta.price}
                                        </span>
                                    </div>
                                </div>
                            )}

                            <div
                                className={cn(
                                    'absolute inset-x-0 bottom-0 p-7 transition-all duration-300',
                                    isActive
                                        ? 'translate-y-0 opacity-100'
                                        : 'translate-y-8 opacity-0',
                                )}
                            >
                                <div className="mb-4 flex flex-wrap items-center gap-2">
                                    {field.is_featured && (
                                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500 px-3 py-1 text-xs font-bold text-white shadow-lg">
                                            <Trophy className="size-3.5" />
                                            Mas popular
                                        </span>
                                    )}
                                    <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold text-white/80 backdrop-blur">
                                        {meta.label}
                                    </span>
                                    <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold text-white/80 backdrop-blur">
                                        {field.capacity} personas
                                    </span>
                                </div>

                                <h3 className="max-w-xl text-4xl font-bold tracking-tight text-white">
                                    {field.name}
                                </h3>
                                {field.description && (
                                    <p className="mt-3 line-clamp-3 max-w-xl text-sm leading-6 text-white/68">
                                        {field.description}
                                    </p>
                                )}

                                <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-5">
                                    <div>
                                        <p className="text-xs font-semibold tracking-[0.22em] text-white/45 uppercase">
                                            Tarifa
                                        </p>
                                        <p className="mt-1 text-2xl font-bold text-emerald-300">
                                            {meta.price}
                                        </p>
                                    </div>
                                    <Link
                                        href={primaryHref}
                                        className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-900/35 transition hover:bg-emerald-400"
                                    >
                                        Reservar
                                        <ArrowRight className="size-4" />
                                    </Link>
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>

            <div className="flex flex-col gap-4 lg:hidden">
                {fields.map((field, index) => {
                    const isOpen = activeIndex === index;
                    const meta = getFieldMeta(field);

                    return (
                        <article
                            key={field.id ?? index}
                            className="overflow-hidden rounded-2xl border border-white/10 bg-[#0d1829]"
                        >
                            <button
                                type="button"
                                onClick={() => setActiveIndex(index)}
                                aria-expanded={isOpen}
                                className="relative flex min-h-28 w-full items-end text-left"
                            >
                                {field.image_url ? (
                                    <img
                                        src={field.image_url}
                                        alt={field.name}
                                        className="absolute inset-0 h-full w-full object-cover"
                                    />
                                ) : (
                                    <div className="absolute inset-0 bg-linear-to-r from-[#0d1829] via-[#0f1d30] to-[#0d1829]" />
                                )}
                                <div className="absolute inset-0 bg-black/65" />
                                <div className="relative flex w-full items-center justify-between gap-4 p-5">
                                    <div className="min-w-0">
                                        <p className="text-xs font-semibold tracking-[0.18em] text-emerald-300 uppercase">
                                            {meta.label}
                                        </p>
                                        <h3 className="mt-1 truncate font-bold text-white">
                                            {field.name}
                                        </h3>
                                    </div>
                                    <ChevronDown
                                        className={cn(
                                            'size-5 shrink-0 text-white transition-transform duration-300',
                                            isOpen && 'rotate-180',
                                        )}
                                    />
                                </div>
                            </button>

                            <div
                                className={cn(
                                    'grid transition-all duration-300 ease-in-out',
                                    isOpen
                                        ? 'grid-rows-[1fr]'
                                        : 'grid-rows-[0fr]',
                                )}
                            >
                                <div className="overflow-hidden">
                                    <div className="space-y-4 border-t border-white/5 p-5">
                                        <div className="flex flex-wrap gap-2">
                                            <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/70">
                                                {field.capacity} personas
                                            </span>
                                            <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-bold text-emerald-300">
                                                {meta.price}
                                            </span>
                                        </div>
                                        {field.description && (
                                            <p className="line-clamp-3 text-sm text-white/60">
                                                {field.description}
                                            </p>
                                        )}
                                        <Link
                                            href={primaryHref}
                                            className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-emerald-400"
                                        >
                                            Reservar ahora
                                            <ArrowRight className="size-4" />
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </article>
                    );
                })}
            </div>
        </div>
    );
}
