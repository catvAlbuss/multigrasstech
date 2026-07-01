import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

function GalleryBento({
    images,
    tenantName,
}: {
    images: string[];
    tenantName: string;
}) {
    return (
        <div className="grid grid-cols-12 gap-4">
            {images.slice(0, 6).map((image, index) => {
                const colSpanClass =
                    index === 0 || index === 3
                        ? 'col-span-12 md:col-span-7'
                        : index === 1 || index === 2
                          ? 'col-span-12 md:col-span-5'
                          : 'col-span-12 md:col-span-6';
                const heightClass =
                    index === 0 ? 'h-80 lg:h-[460px]' : 'h-72 lg:h-96';

                return (
                    <article
                        key={`${image}-${index}`}
                        className={cn(
                            'group relative overflow-hidden rounded-2xl border border-white/10 bg-[#0d1829] shadow-2xl shadow-black/20',
                            colSpanClass,
                            heightClass,
                        )}
                    >
                        <img
                            src={image}
                            alt={`Galeria ${index + 1}`}
                            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-linear-to-t from-black/75 via-black/15 to-transparent opacity-90 transition group-hover:opacity-100" />
                        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-5">
                            <div>
                                <span className="rounded-full bg-emerald-500/90 px-2.5 py-1 text-[10px] font-bold tracking-[0.18em] text-white uppercase">
                                    Espacio {index + 1}
                                </span>
                                <h3 className="mt-3 text-lg font-bold text-white sm:text-xl">
                                    {tenantName}
                                </h3>
                            </div>
                            <span className="grid size-11 shrink-0 place-items-center rounded-full bg-white/12 text-white backdrop-blur transition group-hover:bg-emerald-500">
                                <ArrowRight className="size-5 -rotate-45" />
                            </span>
                        </div>
                    </article>
                );
            })}
        </div>
    );
}

export function GallerySection({
    images,
    tenantName,
}: {
    images: string[];
    tenantName: string;
}) {
    if (images.length === 0) {
return null;
}

    return (
        <section className="bg-[#050d1a] py-16 sm:py-20">
            <div className="mx-auto max-w-8xl px-5 sm:px-10">
                <div className="mb-10 text-center">
                    <h2 className="text-3xl font-bold text-emerald-400 sm:text-4xl">
                        Galeria {tenantName}
                    </h2>
                    <div className="mx-auto mt-3 h-0.5 w-16 bg-emerald-400" />
                    <p className="mx-auto mt-4 max-w-2xl text-sm text-white/50">
                        Conoce nuestros ambientes, canchas y espacios preparados
                        para entrenamientos, reservas y eventos deportivos.
                    </p>
                </div>

                <GalleryBento images={images} tenantName={tenantName} />
            </div>
        </section>
    );
}
