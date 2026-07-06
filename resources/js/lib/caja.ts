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

export function csrfToken() {
    return (
        document
            .querySelector<HTMLMetaElement>('meta[name="csrf-token"]')
            ?.getAttribute('content') ?? ''
    );
}

export async function fetchJson<T>(url: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(url, {
        credentials: 'same-origin',
        ...options,
        headers: {
            Accept: 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            ...options.headers,
        },
    });
    const data = (await response.json().catch(() => ({}))) as { message?: string };

    if (!response.ok) {
        throw new Error(data.message ?? 'Error de conexión.');
    }

    return data as T;
}
