import {
    ArrowDownCircle,
    Minus,
    Package,
    Plus,
    ShoppingCart,
    Trash2,
} from 'lucide-react';
import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import type { CartItem } from '@/types/caja';

const IGV_RATE = 0.18;

function fmt(n: number) {
    return `S/ ${n.toLocaleString('es-PE', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;
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
    onUpdateQty: (
        productId: number,
        qty: number,
        variantId?: number | null,
    ) => void;
    onRemove: (productId: number, variantId?: number | null) => void;
    onCheckout: () => void;
    onSalida: () => void;
}) {
    const totals = useMemo(
        () => calcTotals(cart, igvApplied),
        [cart, igvApplied],
    );
    const isEmpty = cart.length === 0;

    return (
        <div className="flex h-full max-h-[36dvh] min-h-0 flex-col rounded-lg border border-white/10 bg-slate-900/80 text-sm text-slate-100 shadow-[0_18px_44px_rgba(0,0,0,0.24)] backdrop-blur lg:max-h-none">
            <div className="shrink-0 border-b border-white/10 px-4 py-3">
                <div className="flex items-center gap-2">
                    <ShoppingCart className="size-4 text-emerald-300" />
                    <span className="font-semibold text-slate-50">Carrito</span>
                    {cart.length > 0 && (
                        <span className="flex size-5 items-center justify-center rounded-full bg-emerald-500 text-[11px] font-bold text-white">
                            {cart.reduce((s, i) => s + i.quantity, 0)}
                        </span>
                    )}
                </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto">
                {isEmpty ? (
                    <div className="flex h-full min-h-32 flex-col items-center justify-center px-4 py-8 text-center text-slate-500">
                        <Package className="mb-3 size-10 opacity-20" />
                        <p className="text-sm">
                            Selecciona productos del catálogo
                        </p>
                    </div>
                ) : (
                    <ul className="divide-y divide-white/10">
                        {cart.map((item) => (
                            <li
                                key={`${item.product_id}-${item.product_variant_id ?? 'none'}`}
                                className="flex items-start gap-3 px-4 py-3"
                            >
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-medium text-slate-50">
                                        {item.name}
                                    </p>
                                    <p className="text-xs text-slate-500">
                                        S/{' '}
                                        {item.unit_price.toLocaleString(
                                            'es-PE',
                                            { minimumFractionDigits: 2 },
                                        )}{' '}
                                        / {item.unit}
                                        {item.igv_type !== 'gravado' && (
                                            <span className="ml-1 text-amber-300">
                                                ({item.igv_type})
                                            </span>
                                        )}
                                    </p>
                                </div>

                                <div className="flex shrink-0 items-center gap-1">
                                    <button
                                        onClick={() =>
                                            onUpdateQty(
                                                item.product_id,
                                                item.quantity - 1,
                                                item.product_variant_id,
                                            )
                                        }
                                        disabled={item.quantity <= 1}
                                        className="flex size-7 items-center justify-center rounded-md border border-white/10 text-slate-300 hover:bg-white/10 disabled:opacity-40"
                                        aria-label="Reducir cantidad"
                                    >
                                        <Minus className="size-3" />
                                    </button>
                                    <span className="w-7 text-center text-sm font-semibold tabular-nums">
                                        {item.quantity}
                                    </span>
                                    <button
                                        onClick={() =>
                                            onUpdateQty(
                                                item.product_id,
                                                item.quantity + 1,
                                                item.product_variant_id,
                                            )
                                        }
                                        disabled={item.quantity >= item.stock}
                                        className="flex size-7 items-center justify-center rounded-md border border-white/10 text-slate-300 hover:bg-white/10 disabled:opacity-40"
                                        aria-label="Aumentar cantidad"
                                    >
                                        <Plus className="size-3" />
                                    </button>
                                </div>

                                <div className="flex shrink-0 flex-col items-end gap-1">
                                    <span className="text-sm font-bold text-slate-50">
                                        S/{' '}
                                        {(
                                            item.unit_price * item.quantity
                                        ).toLocaleString('es-PE', {
                                            minimumFractionDigits: 2,
                                        })}
                                    </span>
                                    <button
                                        onClick={() =>
                                            onRemove(
                                                item.product_id,
                                                item.product_variant_id,
                                            )
                                        }
                                        className="text-red-400 transition-colors hover:text-red-300"
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

            <div className="shrink-0 space-y-3 border-t border-white/10 p-4">
                <label className="flex cursor-pointer items-center justify-between rounded-lg border border-dashed border-amber-400/35 bg-amber-500/10 px-3 py-2">
                    <span className="text-sm font-medium text-amber-300">
                        Incluir IGV (18%)
                    </span>
                    <input
                        type="checkbox"
                        checked={igvApplied}
                        onChange={(e) => onIgvChange(e.target.checked)}
                        className="size-4 rounded border-amber-400 text-amber-500 focus:ring-amber-500"
                    />
                </label>

                <div className="space-y-1 text-sm">
                    {igvApplied && (
                        <>
                            <div className="flex justify-between text-slate-500">
                                <span>Base imponible</span>
                                <span>{fmt(totals.subtotal)}</span>
                            </div>
                            <div className="flex justify-between text-slate-500">
                                <span>IGV (18%)</span>
                                <span>{fmt(totals.igvAmount)}</span>
                            </div>
                            <div className="my-1 border-t border-white/10" />
                        </>
                    )}
                    <div className="flex justify-between text-base font-bold text-slate-50">
                        <span>Total</span>
                        <span className="text-lg text-emerald-300">
                            {fmt(totals.total)}
                        </span>
                    </div>
                </div>

                <Button
                    onClick={onCheckout}
                    disabled={isEmpty}
                    className="w-full bg-emerald-500 py-2.5 font-semibold text-white hover:bg-emerald-400 disabled:bg-slate-700"
                    id="btn-ir-cobro"
                >
                    <ShoppingCart className="mr-2 size-4" />
                    Ir al cobro
                </Button>

                <Button
                    onClick={onSalida}
                    variant="outline"
                    className="w-full border-red-500/40 bg-transparent text-red-300 hover:border-red-400 hover:bg-red-500/10 hover:text-red-200"
                    id="btn-registrar-salida"
                >
                    <ArrowDownCircle className="mr-1.5 size-4" />
                    Registrar salida
                </Button>
            </div>
        </div>
    );
}
