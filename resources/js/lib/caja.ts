import type { CartItem } from '@/types/caja';

export const CATEGORY_LABELS: Record<string, string> = {
    bebida: 'Bebidas',
    snack: 'Snacks',
    protector: 'Protectores',
    equipo: 'Equipos',
    otro: 'Otros',
};

export function formatMoney(value: number | string | null) {
    return `S/ ${Number(value ?? 0).toLocaleString('es-PE', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;
}

export function getCartUnits(cart: CartItem[]) {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
}
