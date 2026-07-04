import {
    AlertTriangle,
    BadgeCheck,
    Clock3,
    Layers2,
    Package,
    Plus,
    Star,
    Tags,
    Zap,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { CATEGORY_LABELS, formatMoney } from '@/lib/caja';
import type { CajaProduct } from '@/types/caja';

function ProductImage({ product }: { product: CajaProduct }) {
    const mainImage =
        product.image_url ??
        product.variants?.find((variant) => variant.image_url)?.image_url ??
        null;

    return (
        <div className="relative flex h-36 w-24 shrink-0 items-center justify-center overflow-hidden rounded-md border border-white/10 bg-slate-950/65">
            {mainImage ? (
                <img
                    src={mainImage}
                    alt={product.name}
                    className="h-full w-full object-contain p-2"
                />
            ) : (
                <Package className="size-9 text-slate-600" />
            )}
        </div>
    );
}

function StatusBadge({
    children,
    tone = 'emerald',
}: {
    children: ReactNode;
    tone?: 'emerald' | 'blue' | 'amber' | 'slate' | 'rose';
}) {
    const tones = {
        emerald:
            'border-emerald-400/25 bg-emerald-500/10 text-emerald-300',
        blue: 'border-blue-400/25 bg-blue-500/10 text-blue-300',
        amber: 'border-amber-400/25 bg-amber-500/10 text-amber-300',
        slate: 'border-white/10 bg-white/[0.04] text-slate-300',
        rose: 'border-rose-400/25 bg-rose-500/10 text-rose-300',
    }[tone];

    return (
        <span
            className={`inline-flex h-6 items-center gap-1 rounded-full border px-2 text-[10px] font-black leading-none ${tones}`}
        >
            {children}
        </span>
    );
}

function CardShell({
    children,
    active,
    disabled,
    label,
}: {
    children: ReactNode;
    active: boolean;
    disabled: boolean;
    label?: string;
}) {
    return (
        <article
            className={`group flex min-h-[255px] flex-col rounded-lg border bg-slate-900/72 p-3 text-left shadow-[0_18px_44px_rgba(0,0,0,0.22)] backdrop-blur transition ${
                disabled
                    ? 'border-white/10 opacity-60'
                    : active
                      ? 'border-emerald-400/55 ring-1 ring-emerald-400/30'
                      : 'border-white/10 hover:border-emerald-400/45 hover:bg-slate-900/90'
            }`}
            aria-label={label}
        >
            {children}
        </article>
    );
}

function StockSummary({
    stock,
    lowStock,
}: {
    stock: number | null | undefined;
    lowStock?: boolean;
}) {
    return (
        <div>
            <p className="text-[11px] text-slate-500">Stock total</p>
            <p
                className={`text-sm font-black ${
                    lowStock ? 'text-amber-300' : 'text-emerald-300'
                }`}
            >
                {stock ?? 0} u.
            </p>
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
        const totalStock = variants.reduce(
            (sum, variant) => sum + variant.stock,
            0,
        );
        const allOutOfStock = availableVariants.length === 0;
        const lowStock = totalStock > 0 && totalStock <= 10;

        return (
            <CardShell active={totalInCart > 0} disabled={allOutOfStock}>
                <div className="flex gap-3">
                    <ProductImage product={product} />

                    <div className="min-w-0 flex-1">
                        <div className="mb-2 flex flex-wrap items-center gap-1.5">
                            {totalInCart > 0 ? (
                                <StatusBadge>
                                    <BadgeCheck className="size-3" />
                                    En carrito {totalInCart}
                                </StatusBadge>
                            ) : (
                                <StatusBadge>
                                    <Star className="size-3" />
                                    Destacado
                                </StatusBadge>
                            )}
                            {allOutOfStock ? (
                                <StatusBadge tone="rose">
                                    <AlertTriangle className="size-3" />
                                    Sin stock
                                </StatusBadge>
                            ) : lowStock ? (
                                <StatusBadge tone="amber">
                                    <AlertTriangle className="size-3" />
                                    Stock bajo
                                </StatusBadge>
                            ) : (
                                <StatusBadge tone="blue">
                                    <Zap className="size-3" />
                                    Venta rápida
                                </StatusBadge>
                            )}
                        </div>

                        <h3 className="line-clamp-2 text-sm leading-tight font-black text-slate-50">
                            {product.name}
                        </h3>
                        {product.sku && (
                            <p className="mt-1 truncate text-[11px] font-medium text-slate-500">
                                Ref: {product.sku}
                            </p>
                        )}
                        <p className="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400">
                            <Layers2 className="size-3" />
                            Presentaciones
                        </p>
                    </div>
                </div>

                <div className="mt-3 overflow-hidden rounded-md border border-white/10 bg-slate-950/35">
                    {variants.map((variant) => {
                        const qty = getCartQty(product.id, variant.id);
                        const outOfStock = variant.stock === 0;
                        const cleanLabel =
                            variant.label.replace(product.name, '').trim() ||
                            variant.label;

                        return (
                            <button
                                key={variant.id}
                                type="button"
                                onClick={() =>
                                    !outOfStock &&
                                    onAddVariant(product, variant.id)
                                }
                                disabled={outOfStock}
                                className={`flex min-h-11 w-full items-center justify-between gap-3 border-b border-white/10 px-3 py-2 text-left transition last:border-b-0 ${
                                    outOfStock
                                        ? 'cursor-not-allowed text-slate-600'
                                        : qty > 0
                                          ? 'bg-emerald-500/10 text-emerald-100'
                                          : 'text-slate-200 hover:bg-emerald-500/10'
                                }`}
                                aria-label={`Agregar ${product.name} ${variant.label}`}
                            >
                                <span className="min-w-0">
                                    <span className="block truncate text-xs font-black">
                                        {cleanLabel}
                                    </span>
                                    <span className="block truncate text-[10px] text-slate-500">
                                        {outOfStock
                                            ? 'Agotado'
                                            : `${variant.stock} u. disponibles`}
                                    </span>
                                </span>

                                <span className="flex shrink-0 items-center gap-2">
                                    <span className="text-xs font-bold text-slate-100">
                                        {formatMoney(variant.price)}
                                    </span>
                                    <span
                                        className={`flex size-6 items-center justify-center rounded-full ${
                                            qty > 0
                                                ? 'bg-emerald-500 text-white'
                                                : 'bg-white/10 text-emerald-300'
                                        }`}
                                    >
                                        {qty > 0 ? (
                                            <span className="text-[11px] font-black">
                                                {qty}
                                            </span>
                                        ) : (
                                            <Plus className="size-3.5" />
                                        )}
                                    </span>
                                </span>
                            </button>
                        );
                    })}
                </div>

                <div className="mt-auto flex items-end justify-between border-t border-white/10 pt-3">
                    <StockSummary stock={totalStock} lowStock={lowStock} />
                    <button
                        type="button"
                        onClick={() => {
                            const firstAvailable = availableVariants[0];

                            if (firstAvailable) {
                                onAddVariant(product, firstAvailable.id);
                            }
                        }}
                        disabled={allOutOfStock}
                        className="flex size-9 items-center justify-center rounded-full bg-emerald-500 text-white shadow-[0_12px_26px_rgba(16,185,129,0.24)] transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-slate-700"
                        aria-label={`Agregar ${product.name}`}
                    >
                        <Plus className="size-5" />
                    </button>
                </div>
            </CardShell>
        );
    }

    const stock = product.stock ?? 0;
    const outOfStock = stock === 0;
    const lowStock = stock > 0 && stock <= 5;
    const cartQty = getCartQty(product.id);
    const inCart = cartQty > 0;

    return (
        <CardShell
            active={inCart}
            disabled={outOfStock}
            label={`Agregar ${product.name} al carrito`}
        >
            <div className="flex gap-3">
                <ProductImage product={product} />

                <div className="min-w-0 flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-1.5">
                        {inCart ? (
                            <StatusBadge>
                                <BadgeCheck className="size-3" />
                                En carrito {cartQty}
                            </StatusBadge>
                        ) : (
                            <StatusBadge>
                                <Star className="size-3" />
                                Destacado
                            </StatusBadge>
                        )}
                        {outOfStock ? (
                            <StatusBadge tone="rose">
                                <AlertTriangle className="size-3" />
                                Sin stock
                            </StatusBadge>
                        ) : lowStock ? (
                            <StatusBadge tone="amber">
                                <AlertTriangle className="size-3" />
                                Stock bajo
                            </StatusBadge>
                        ) : (
                            <StatusBadge tone="slate">
                                <Clock3 className="size-3" />
                                Más vendido
                            </StatusBadge>
                        )}
                    </div>

                    <h3 className="line-clamp-2 text-sm leading-tight font-black text-slate-50">
                        {product.name}
                    </h3>
                    {product.sku && (
                        <p className="mt-1 truncate text-[11px] font-medium text-slate-500">
                            Ref: {product.sku}
                        </p>
                    )}
                    <p className="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400">
                        <Tags className="size-3" />
                        {CATEGORY_LABELS[product.category] ?? product.category}
                    </p>
                </div>
            </div>

            <button
                type="button"
                onClick={() => !outOfStock && onAddSimple(product)}
                disabled={outOfStock}
                className={`mt-3 flex min-h-12 items-center justify-between gap-3 rounded-md border px-3 py-2 text-left transition ${
                    outOfStock
                        ? 'cursor-not-allowed border-white/10 bg-slate-950/35 text-slate-600'
                        : inCart
                          ? 'border-emerald-400/45 bg-emerald-500/10 text-emerald-100'
                          : 'border-white/10 bg-slate-950/35 text-slate-200 hover:border-emerald-400/40 hover:bg-emerald-500/10'
                }`}
                aria-label={`Agregar ${product.name}`}
            >
                <span className="min-w-0">
                    <span className="block truncate text-xs font-black">
                        {product.unit ?? 'Unidad'}
                    </span>
                    <span className="block truncate text-[10px] text-slate-500">
                        {outOfStock ? 'Agotado' : `${stock} u. disponibles`}
                    </span>
                </span>

                <span className="flex shrink-0 items-center gap-2">
                    <span className="text-xs font-bold text-slate-100">
                        {formatMoney(product.price)}
                    </span>
                    <span
                        className={`flex size-6 items-center justify-center rounded-full ${
                            inCart
                                ? 'bg-emerald-500 text-white'
                                : 'bg-white/10 text-emerald-300'
                        }`}
                    >
                        {inCart ? (
                            <span className="text-[11px] font-black">
                                {cartQty}
                            </span>
                        ) : (
                            <Plus className="size-3.5" />
                        )}
                    </span>
                </span>
            </button>

            <div className="mt-auto flex items-end justify-between border-t border-white/10 pt-3">
                <StockSummary stock={stock} lowStock={lowStock} />
                <button
                    type="button"
                    onClick={() => !outOfStock && onAddSimple(product)}
                    disabled={outOfStock}
                    className="flex size-9 items-center justify-center rounded-full bg-emerald-500 text-white shadow-[0_12px_26px_rgba(16,185,129,0.24)] transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-slate-700"
                    aria-label={`Agregar ${product.name} al carrito`}
                >
                    <Plus className="size-5" />
                </button>
            </div>
        </CardShell>
    );
}
