import { ReceiptDialog } from '@/components/receipts/receipt-dialog';
import type { ReceiptTicketData } from '@/components/receipts/receipt-dialog';
import type { ReservationChargeSummary, TenantReservation } from '@/types/tenant';

export function ReservationReceiptDialog({
    open,
    reservation,
    charge,
    onOpenChange,
}: {
    open: boolean;
    reservation: TenantReservation | null;
    charge: ReservationChargeSummary | null;
    onOpenChange: (open: boolean) => void;
}) {
    if (!reservation || !charge) {
        return null;
    }

    const total = Number(reservation.amount ?? 0);
    const paidToDate = Number(reservation.advance_amount ?? 0);
    const balance = Math.max(0, total - paidToDate);

    const data: ReceiptTicketData = {
        documentType: charge.documentType,
        ticketNumber: reservation.code,
        issuedAt: new Date().toISOString(),
        successTitle: '¡Cobro registrado!',
        customer: {
            name: reservation.client?.name ?? 'Cliente sin registrar',
        },
        lines: [
            {
                id: reservation.id,
                label: `Reserva ${reservation.field?.name ?? 'Cancha'}`,
                detail: `${reservation.date} · ${reservation.start_time.slice(0, 5)}-${reservation.end_time.slice(0, 5)}`,
                total,
            },
        ],
        total,
        paymentAmount: charge.amount,
        balanceAfter: balance,
        attendantName: charge.attendantName,
        footerNote: balance > 0 ? 'Reserva pendiente de saldo.' : '¡Reserva confirmada!',
    };

    return <ReceiptDialog open={open} data={data} onOpenChange={onOpenChange} />;
}
