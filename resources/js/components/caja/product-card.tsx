import { AlertTriangle, Layers2, Package, Plus, Tags } from 'lucide-react';
import { CATEGORY_LABELS, formatMoney } from '@/lib/caja';
import type { CajaProduct } from '@/types/caja';

function ProductImage({ product }: { product: CajaProduct }) {
    const mainImage =
        product.image_url ??
        product.variants?.find((variant) => variant.image_url)?.image_url ??
        null;

    return (
        <div className="relative flex aspect-[4/3] w-full items-center justify-center overflow-hidden rounded-md bg-slate-100 dark:bg-neutral-800">
            {mainImage ? (
                <img
                    src={mainImage}
                    alt={product.name}
                    className="h-full w-full object-contain p-2"
                />
            ) : (
                <Package className="size-10 text-slate-300 dark:text-neutral-600" />
            )}
        </div>
    );
}

export function ProductCard({
    product,
    getCartQty,
    onAddSimple,
    onAddVariant,
}: {
    product: CajaProduct;
    getCartQty: (productId: number, variantId?: number) => number;
    onAddSimple: (product: CajaProduct) => void;
    onAddVariant: (product: CajaProduct, variantId: number) => void;
}) {
    if (product.has_variants) {
        const variants = product.variants ?? [];
        const totalInCart = variants.reduce(
            (sum, variant) => sum + getCartQty(product.id, variant.id),
            0,
        );
        const availableVariants = variants.filter(
            (variant) => variant.stock > 0,
        );
        const allOutOfStock = availableVariants.length === 0;
        const minPrice =
            variants.length > 0
                ? Math.min(...variants.map((variant) => Number(variant.price)))
                : 0;

        return (
            <article
                className={`flex min-h-[340px] flex-col rounded-lg border bg-white p-3 shadow-sm transition dark:bg-neutral-900 ${
                    allOutOfStock
                        ? 'border-slate-200 opacity-60 dark:border-neutral-800'
                        : totalInCart > 0
                          ? 'border-emerald-300 ring-1 ring-emerald-300 dark:border-emerald-700 dark:ring-emerald-800'
                          : 'border-slate-200 hover:border-emerald-300 hover:shadow-md dark:border-neutral-800 dark:hover:border-emerald-800'
                }`}
            >
                <div className="relative">
                    <ProductImage product={product} />
                    {totalInCart > 0 && (
                        <span className="absolute top-2 right-2 flex size-7 items-center justify-center rounded-full bg-emerald-600 text-xs font-black text-white shadow-sm">
                            {totalInCart}
                        </span>
                    )}
                </div>

                <div className="mt-3 flex flex-1 flex-col">
                    <div className="min-h-[72px]">
                        <div className="mb-2 flex items-center gap-2">
                            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-1 text-[11px] font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                                <Layers2 className="size-3" />
                                {variants.length} pres.
                            </span>
                            {allOutOfStock && (
                                <span className="inline-flex items-center gap-1 rounded-md bg-rose-50 px-2 py-1 text-[11px] font-bold text-rose-600 dark:bg-rose-950/30 dark:text-rose-300">
                                    <AlertTriangle className="size-3" />
                                    Sin stock
                                </span>
                            )}
                        </div>
                        <h3 className="line-clamp-2 text-sm leading-tight font-bold text-slate-950 dark:text-neutral-50">
                            {product.name}
                        </h3>
                        <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-neutral-400">
                            Desde{' '}
                            <span className="text-emerald-700 dark:text-emerald-300">
                                {formatMoney(minPrice)}
                            </span>
                        </p>
                    </div>

                    <div className="mt-3 flex max-h-44 flex-1 flex-col gap-2 overflow-y-auto pr-1">
                        {variants.map((variant) => {
                            const qty = getCartQty(product.id, variant.id);
                            const outOfStock = variant.stock === 0;
                            const cleanLabel =
                                variant.label
                                    .replace(product.name, '')
                                    .trim() || variant.label;

                            return (
                                <button
                                    key={variant.id}
                                    type="button"
                                    onClick={() =>
                                        !outOfStock &&
                                        onAddVariant(product, variant.id)
                                    }
                                    disabled={outOfStock}
                                    className={`flex min-h-14 items-center justify-between gap-3 rounded-md border px-3 py-2 text-left text-sm transition ${
                                        outOfStock
                                            ? 'cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-600'
                                            : qty > 0
                                              ? 'border-emerald-400 bg-emerald-50 text-emerald-900 dark:border-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-100'
                                              : 'border-slate-200 bg-white text-slate-700 hover:border-emerald-300 hover:bg-emerald-50/60 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:border-emerald-800 dark:hover:bg-emerald-950/20'
                                    }`}
                                    aria-label={`Agregar ${product.name} ${variant.label}`}
                                >
                                    <span className="min-w-0">
                                        <span className="block truncate text-xs font-bold">
                                            {cleanLabel}
                                        </span>
                                        <span className="mt-0.5 block text-[11px] text-slate-500 dark:text-neutral-400">
                                            {outOfStock
                                                ? 'Agotado'
                                                : `${variant.stock} ${variant.unit} disponibles`}
                                        </span>
                                    </span>
                                    <span className="flex shrink-0 items-center gap-2">
                                        <span className="text-xs font-bold">
                                            {formatMoney(variant.price)}
                                        </span>
                                        <span
                                            className={`flex size-7 items-center justify-center rounded-full ${
                                                qty > 0
                                                    ? 'bg-emerald-600 text-white'
                                                    : 'bg-slate-100 text-emerald-700 dark:bg-neutral-800 dark:text-emerald-300'
                                            }`}
                                        >
                                            {qty > 0 ? (
                                                <span className="text-xs font-black">
                                                    {qty}
                                                </span>
                                            ) : (
                                                <Plus className="size-4" />
                                            )}
                                        </span>
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </article>
        );
    }

    const outOfStock = (product.stock ?? 0) === 0;
    const lowStock = (product.stock ?? 0) > 0 && (product.stock ?? 0) <= 5;
    const cartQty = getCartQty(product.id);
    const inCart = cartQty > 0;

    return (
        <article
            className={`flex min-h-[300px] flex-col rounded-lg border bg-white p-3 text-left shadow-sm transition dark:bg-neutral-900 ${
                outOfStock
                    ? 'border-slate-200 opacity-60 dark:border-neutral-800'
                    : inCart
                      ? 'border-emerald-300 ring-1 ring-emerald-300 dark:border-emerald-700 dark:ring-emerald-800'
                      : 'border-slate-200 hover:border-emerald-300 hover:shadow-md dark:border-neutral-800 dark:hover:border-emerald-800'
            }`}
            aria-label={`Agregar ${product.name} al carrito`}
        >
            <div className="relative">
                <ProductImage product={product} />
                {inCart ? (
                    <span className="absolute top-2 right-2 flex size-7 items-center justify-center rounded-full bg-emerald-600 text-xs font-black text-white shadow-sm">
                        {cartQty}
                    </span>
                ) : (
                    <span
                        className={`absolute top-2 right-2 rounded-md px-2 py-1 text-[11px] font-bold shadow-sm ${
                            outOfStock
                                ? 'bg-slate-100 text-slate-500 dark:bg-neutral-800 dark:text-neutral-400'
                                : lowStock
                                  ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300'
                                  : 'bg-white text-slate-700 dark:bg-neutral-950 dark:text-neutral-200'
                        }`}
                    >
                        {outOfStock
                            ? 'Sin stock'
                            : `${product.stock} ${product.unit ?? 'un.'}`}
                    </span>
                )}
            </div>

            <div className="mt-3 flex flex-1 flex-col">
                <div className="min-h-[82px]">
                    <span className="mb-2 inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1 text-[11px] font-bold text-slate-600 dark:bg-neutral-800 dark:text-neutral-300">
                        <Tags className="size-3" />
                        {CATEGORY_LABELS[product.category] ?? product.category}
                    </span>
                    <h3 className="line-clamp-2 text-sm leading-tight font-bold text-slate-950 dark:text-neutral-50">
                        {product.name}
                    </h3>
                    {product.sku && (
                        <p className="mt-1 truncate text-[11px] text-slate-500 dark:text-neutral-400">
                            Ref: {product.sku}
                        </p>
                    )}
                </div>

                <div className="mt-auto flex items-end justify-between gap-3 border-t border-slate-100 pt-3 dark:border-neutral-800">
                    <div>
                        <p className="text-base font-black text-emerald-700 dark:text-emerald-300">
                            {formatMoney(product.price)}
                        </p>
                        {product.igv_type !== 'gravado' && (
                            <span className="mt-1 inline-block rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700 capitalize dark:bg-amber-950/40 dark:text-amber-300">
                                {product.igv_type}
                            </span>
                        )}
                    </div>
                    <button
                        type="button"
                        onClick={() => !outOfStock && onAddSimple(product)}
                        disabled={outOfStock}
                        className="flex size-9 items-center justify-center rounded-full bg-emerald-600 text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300 dark:disabled:bg-neutral-700"
                        aria-label={`Agregar ${product.name} al carrito`}
                    >
                        <Plus className="size-5" />
                    </button>
                </div>
            </div>
        </article>
    );
}
