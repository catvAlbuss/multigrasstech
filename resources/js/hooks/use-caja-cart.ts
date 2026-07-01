import { useCallback, useMemo, useState } from 'react';
import type { CajaProduct, CartItem } from '@/types/caja';

export function useCajaCart() {
    const [cart, setCart] = useState<CartItem[]>([]);
    const [igvApplied, setIgvApplied] = useState(false);

    const addToCart = useCallback((product: CajaProduct) => {
        setCart((prev) => {
            const existing = prev.find(
                (item) =>
                    item.product_id === product.id && !item.product_variant_id,
            );

            if (existing) {
                if (existing.quantity >= (product.stock ?? 0)) {
return prev;
}

                return prev.map((item) =>
                    item.product_id === product.id && !item.product_variant_id
                        ? { ...item, quantity: item.quantity + 1 }
                        : item,
                );
            }

            return [
                ...prev,
                {
                    product_id: product.id,
                    product_variant_id: null,
                    name: product.name,
                    sku: product.sku,
                    unit: product.unit ?? 'unidad',
                    unit_price: Number(product.price),
                    igv_type: product.igv_type,
                    quantity: 1,
                    stock: product.stock ?? 0,
                },
            ];
        });
    }, []);

    const addVariantToCart = useCallback(
        (product: CajaProduct, variantId: number) => {
            const variant = product.variants?.find(
                (item) => item.id === variantId,
            );

            if (!variant) {
return;
}

            setCart((prev) => {
                const existing = prev.find(
                    (item) =>
                        item.product_id === product.id &&
                        item.product_variant_id === variantId,
                );

                if (existing) {
                    if (existing.quantity >= variant.stock) {
return prev;
}

                    return prev.map((item) =>
                        item.product_id === product.id &&
                        item.product_variant_id === variantId
                            ? { ...item, quantity: item.quantity + 1 }
                            : item,
                    );
                }

                return [
                    ...prev,
                    {
                        product_id: product.id,
                        product_variant_id: variantId,
                        name: `${product.name} - ${variant.label}`,
                        sku: variant.sku,
                        unit: variant.unit,
                        unit_price: Number(variant.price),
                        igv_type: product.igv_type,
                        quantity: 1,
                        stock: variant.stock,
                    },
                ];
            });
        },
        [],
    );

    const updateQty = useCallback(
        (productId: number, qty: number, variantId?: number | null) => {
            if (qty <= 0) {
                setCart((prev) =>
                    prev.filter(
                        (item) =>
                            !(
                                item.product_id === productId &&
                                item.product_variant_id === (variantId ?? null)
                            ),
                    ),
                );

                return;
            }

            setCart((prev) =>
                prev.map((item) =>
                    item.product_id === productId &&
                    item.product_variant_id === (variantId ?? null)
                        ? { ...item, quantity: Math.min(qty, item.stock) }
                        : item,
                ),
            );
        },
        [],
    );

    const removeFromCart = useCallback(
        (productId: number, variantId?: number | null) => {
            setCart((prev) =>
                prev.filter(
                    (item) =>
                        !(
                            item.product_id === productId &&
                            item.product_variant_id === (variantId ?? null)
                        ),
                ),
            );
        },
        [],
    );

    const getCartQty = useCallback(
        (productId: number, variantId?: number) => {
            const item = cart.find(
                (cartItem) =>
                    cartItem.product_id === productId &&
                    cartItem.product_variant_id === (variantId ?? null),
            );

            return item?.quantity ?? 0;
        },
        [cart],
    );

    const cartUnits = useMemo(
        () => cart.reduce((sum, item) => sum + item.quantity, 0),
        [cart],
    );

    const resetCart = useCallback(() => {
        setCart([]);
        setIgvApplied(false);
    }, []);

    return {
        cart,
        cartUnits,
        igvApplied,
        setIgvApplied,
        addToCart,
        addVariantToCart,
        updateQty,
        removeFromCart,
        getCartQty,
        resetCart,
    };
}
