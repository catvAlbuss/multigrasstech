import { ArrowDownCircle, Minus, Package, Plus, ShoppingCart, Trash2 } from 'lucide-react';
import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import type { CartItem } from '@/types/caja';

const IGV_RATE = 0.18;

function fmt(n: number) {
    return `S/ ${n.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function calcTotals(cart: CartItem[], igvApplied: boolean) {
    let rawTotal = 0;
    let igvAmount = 0;

    for (const item of cart) {
        const lineTotal = item.unit_price * item.quantity;
        rawTotal += lineTotal;

        if (igvApplied && item.igv_type === 'gravado') {
            igvAmount += lineTotal - lineTotal / (1 + IGV_RATE);
        }
    }

    const subtotal = rawTotal - igvAmount;

    return {
        subtotal: Math.round(subtotal * 100) / 100,
        igvAmount: Math.round(igvAmount * 100) / 100,
        total: Math.round(rawTotal * 100) / 100,
    };
}

export function CheckoutPanel({
    cart,
    igvApplied,
    onIgvChange,
    onUpdateQty,
    onRemove,
    onCheckout,
    onSalida,
}: {
    cart: CartItem[];
    igvApplied: boolean;
    onIgvChange: (v: boolean) => void;
    onUpdateQty: (productId: number, qty: number, variantId?: number | null) => void;
    onRemove: (productId: number, variantId?: number | null) => void;
    onCheckout: () => void;
    onSalida: () => void;
}) {
    const totals = useMemo(() => calcTotals(cart, igvApplied), [cart, igvApplied]);
    const isEmpty = cart.length === 0;

    return (
        <div className="flex h-full max-h-[36dvh] min-h-0 flex-col rounded-lg border bg-white text-sm shadow-xs dark:bg-neutral-900 lg:max-h-none">
            {/* Header */}
            <div className="shrink-0 border-b px-4 py-3">
                <div className="flex items-center gap-2">
                    <ShoppingCart className="size-4 text-green-600" />
                    <span className="font-semibold text-gray-900 dark:text-gray-100">
                        Carrito
                    </span>
                    {cart.length > 0 && (
                        <span className="flex size-5 items-center justify-center rounded-full bg-green-600 text-[11px] font-bold text-white">
                            {cart.reduce((s, i) => s + i.quantity, 0)}
                        </span>
                    )}
                </div>
            </div>

            {/* Items list */}
            <div className="min-h-0 flex-1 overflow-y-auto">
                {isEmpty ? (
                    <div className="flex h-full min-h-32 flex-col items-center justify-center px-4 py-8 text-center text-muted-foreground">
                        <Package className="mb-3 size-10 opacity-20" />
                        <p className="text-sm">Selecciona productos del catálogo</p>
                    </div>
                ) : (
                    <ul className="divide-y">
                        {cart.map((item) => (
                            <li key={`${item.product_id}-${item.product_variant_id ?? 'none'}`} className="flex items-start gap-3 px-4 py-3">
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                                        {item.name}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        S/ {item.unit_price.toLocaleString('es-PE', { minimumFractionDigits: 2 })} / {item.unit}
                                        {item.igv_type !== 'gravado' && (
                                            <span className="ml-1 text-amber-600">({item.igv_type})</span>
                                        )}
                                    </p>
                                </div>
                                {/* Qty controls */}
                                <div className="flex shrink-0 items-center gap-1">
                                    <button
                                        onClick={() => onUpdateQty(item.product_id, item.quantity - 1, item.product_variant_id)}
                                        disabled={item.quantity <= 1}
                                        className="flex size-7 items-center justify-center rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 dark:border-gray-700 dark:hover:bg-gray-800"
                                        aria-label="Reducir cantidad"
                                    >
                                        <Minus className="size-3" />
                                    </button>
                                    <span className="w-7 text-center text-sm font-semibold tabular-nums">
                                        {item.quantity}
                                    </span>
                                    <button
                                        onClick={() => onUpdateQty(item.product_id, item.quantity + 1, item.product_variant_id)}
                                        disabled={item.quantity >= item.stock}
                                        className="flex size-7 items-center justify-center rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 dark:border-gray-700 dark:hover:bg-gray-800"
                                        aria-label="Aumentar cantidad"
                                    >
                                        <Plus className="size-3" />
                                    </button>
                                </div>
                                {/* Subtotal + remove */}
                                <div className="flex shrink-0 flex-col items-end gap-1">
                                    <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                                        S/ {(item.unit_price * item.quantity).toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                                    </span>
                                    <button
                                        onClick={() => onRemove(item.product_id, item.product_variant_id)}
                                        className="text-red-400 hover:text-red-600 transition-colors"
                                        aria-label={`Eliminar ${item.name}`}
                                    >
                                        <Trash2 className="size-3.5" />
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {/* Totals + IGV + CTA */}
            <div className="shrink-0 space-y-3 border-t p-4">
                {/* IGV toggle */}
                <label className="flex cursor-pointer items-center justify-between rounded-lg border border-dashed border-amber-300 bg-amber-50/60 px-3 py-2 dark:border-amber-800 dark:bg-amber-950/20">
                    <span className="text-sm font-medium text-amber-800 dark:text-amber-400">
                        Incluir IGV (18%)
                    </span>
                    <input
                        type="checkbox"
                        checked={igvApplied}
                        onChange={(e) => onIgvChange(e.target.checked)}
                        className="size-4 rounded border-amber-400 text-amber-600 focus:ring-amber-500"
                    />
                </label>

                {/* Totals */}
                <div className="space-y-1 text-sm">
                    {igvApplied && (
                        <>
                            <div className="flex justify-between text-muted-foreground">
                                <span>Base imponible</span>
                                <span>{fmt(totals.subtotal)}</span>
                            </div>
                            <div className="flex justify-between text-muted-foreground">
                                <span>IGV (18%)</span>
                                <span>{fmt(totals.igvAmount)}</span>
                            </div>
                            <div className="my-1 border-t" />
                        </>
                    )}
                    <div className="flex justify-between text-base font-bold text-gray-900 dark:text-gray-100">
                        <span>Total</span>
                        <span className="text-lg text-green-600">{fmt(totals.total)}</span>
                    </div>
                </div>

                {/* Checkout button */}
                <Button
                    onClick={onCheckout}
                    disabled={isEmpty}
                    className="w-full bg-green-600 py-2.5 font-semibold text-white hover:bg-green-700"
                    id="btn-ir-cobro"
                >
                    <ShoppingCart className="mr-2 size-4" />
                    Ir al cobro
                </Button>

                {/* Salida button */}
                <Button
                    onClick={onSalida}
                    variant="outline"
                    className="w-full border-red-200 text-red-600 hover:border-red-300 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-900/20"
                    id="btn-registrar-salida"
                >
                    <ArrowDownCircle className="mr-1.5 size-4" />
                    Registrar salida
                </Button>
            </div>
        </div>
    );
}
