import { SpacesAccordion } from '@/components/welcome/spaces-accordion';
import type { PublicField } from '@/types/tenant';

export function FieldsSection({
    fields,
    primaryHref,
}: {
    fields: PublicField[];
    primaryHref: string;
}) {
    if (fields.length === 0) {
return null;
}

    return (
        <section id="servicios" className="bg-[#070e1b] py-16 sm:py-20">
            <div className="mx-auto max-w-8xl px-5 sm:px-10">
                <div className="mb-12 text-center">
                    <h2 className="text-3xl font-bold tracking-wider text-white uppercase sm:text-4xl">
                        Nuestros espacios
                    </h2>
                    <div className="mx-auto mt-3 h-0.5 w-16 bg-emerald-400" />
                </div>

                <SpacesAccordion fields={fields} primaryHref={primaryHref} />
            </div>
        </section>
    );
}
