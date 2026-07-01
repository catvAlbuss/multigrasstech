export type BillingPeriod = 'monthly' | 'yearly' | 'lifetime' | 'contact';

export function automaticExpirationLabel(
    period: BillingPeriod,
    baseDate = new Date(),
): string {
    if (period === 'lifetime' || period === 'contact') {
        return 'Sin vencimiento automático (de por vida).';
    }

    const day = baseDate.getDate();
    const target = new Date(baseDate);
    target.setDate(1);

    if (period === 'monthly') {
        target.setMonth(target.getMonth() + 1);
    } else {
        target.setFullYear(target.getFullYear() + 1);
    }

    const lastDay = new Date(
        target.getFullYear(),
        target.getMonth() + 1,
        0,
    ).getDate();
    target.setDate(Math.min(day, lastDay));

    return `Vencimiento automático: ${target.toLocaleDateString('es-CO')}.`;
}
