export function formatCurrency(value: number | null) {
    return new Intl.NumberFormat('es-PE', {
        style: 'currency',
        currency: 'PEN',
        minimumFractionDigits: 2,
    }).format(value ?? 0);
}

export function formatPercentage(value: number) {
    const sign = value > 0 ? '+' : '';

    return `${sign}${value.toFixed(1)}%`;
}
