import { Link } from '@inertiajs/react';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export function HeroSection({
    description,
    heroImages,
    isAuthenticated,
    primaryHref,
    sliderIndex,
    tagline,
    onNext,
    onPrevious,
}: {
    description: string;
    heroImages: string[];
    isAuthenticated: boolean;
    primaryHref: string;
    sliderIndex: number;
    tagline: string;
    onNext: () => void;
    onPrevious: () => void;
}) {
    return (
        <section
            id="inicio"
            className="relative flex min-h-[calc(100vh-4rem)] flex-col justify-center overflow-hidden bg-[#050d1a]"
        >
            {heroImages.map((src, index) => (
                <div
                    key={`${src}-${index}`}
                    className={cn(
                        'absolute inset-0 bg-cover bg-center transition-opacity duration-1000',
                        index === sliderIndex ? 'opacity-65' : 'opacity-0',
                    )}
                    style={{ backgroundImage: `url('${src}')` }}
                />
            ))}
            <div className="absolute inset-0 bg-linear-to-r from-[#050d1a]/95 via-[#050d1a]/62 to-transparent" />
            <div className="absolute inset-0 bg-linear-to-t from-[#050d1a] via-transparent to-transparent" />

            <div className="relative z-10 mx-auto w-full max-w-7xl px-5 py-20 sm:px-10">
                <p className="text-xs font-bold tracking-[0.3em] text-emerald-400 uppercase">
                    Grass
                </p>
                <h1 className="mt-4 max-w-3xl text-4xl leading-[1.05] font-black text-white drop-shadow-lg sm:text-6xl">
                    {tagline}
                </h1>
                <p className="mt-5 max-w-xl text-base leading-7 text-white/72 sm:text-lg">
                    {description}
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                    <Link
                        href={primaryHref}
                        className="inline-flex h-11 items-center gap-2 rounded-full bg-emerald-500 px-6 text-sm font-semibold text-white shadow-lg shadow-emerald-900/40 transition hover:bg-emerald-400"
                    >
                        <ArrowRight className="size-4" />
                        {isAuthenticated ? 'Crear reserva' : 'Reservar ahora'}
                    </Link>
                    <a
                        href="#servicios"
                        className="inline-flex h-11 items-center rounded-full border border-white/15 bg-white/8 px-6 text-sm font-semibold text-white transition hover:bg-white/12"
                    >
                        Ver campos
                    </a>
                </div>
            </div>

            {heroImages.length > 1 && (
                <div className="absolute right-4 top-1/2 z-10 hidden -translate-y-1/2 flex-col items-center gap-3 sm:flex">
                    <button
                        type="button"
                        onClick={onPrevious}
                        className="flex size-9 items-center justify-center rounded-full border border-white/20 bg-black/30 text-white/70 transition hover:bg-black/50"
                        aria-label="Imagen anterior"
                    >
                        <ChevronLeft className="size-4" />
                    </button>
                    <span className="text-xs font-medium text-white/50">
                        {sliderIndex + 1}/{heroImages.length}
                    </span>
                    <button
                        type="button"
                        onClick={onNext}
                        className="flex size-9 items-center justify-center rounded-full border border-white/20 bg-black/30 text-white/70 transition hover:bg-black/50"
                        aria-label="Imagen siguiente"
                    >
                        <ChevronRight className="size-4" />
                    </button>
                </div>
            )}
        </section>
    );
}
