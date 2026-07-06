import { ReceiptDialog } from '@/components/receipts/receipt-dialog';
import type { ReceiptTicketData } from '@/components/receipts/receipt-dialog';
import type { SaleData } from '@/types/caja';

const IGV_TYPE_LABELS: Record<string, string> = {
    gravado: 'G',
    exonerado: 'E',
    inafecto: 'I',
};

function fmt(n: number | string) {
    return `S/ ${Number(n).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function toTicketData(sale: SaleData, businessName?: string): ReceiptTicketData {
    return {
        documentType: sale.document_type,
        ticketNumber: sale.sale_number,
        issuedAt: sale.sold_at,
        businessName,
        successTitle: '¡Venta registrada!',
        customer: {
            name: sale.customer_name,
            docType: sale.customer_doc_type,
            docNumber: sale.customer_doc_number,
            address: sale.customer_address,
        },
        lines: sale.items.map((item) => ({
            id: item.id,
            label: item.product_name,
            detail: `${item.quantity} × ${fmt(item.unit_price_base)} ${
                sale.igv_applied ? `[${IGV_TYPE_LABELS[item.igv_type] ?? item.igv_type}]` : ''
            }`.trim(),
            total: item.total,
        })),
        igvApplied: sale.igv_applied,
        subtotal: sale.subtotal,
        igvAmount: sale.igv_amount,
        total: sale.total,
        paymentAmount: sale.payment_amount,
        changeAmount: Number(sale.change_amount),
        attendantName: sale.attendant?.name ?? null,
        footerNote: '¡Gracias por su compra!',
    };
}

export function SaleReceiptDialog({
    open,
    sale,
    businessName,
    onOpenChange,
}: {
    open: boolean;
    sale: SaleData | null;
    businessName?: string;
    onOpenChange: (open: boolean) => void;
}) {
    if (!sale) {
        return null;
    }

    return (
        <ReceiptDialog open={open} data={toTicketData(sale, businessName)} onOpenChange={onOpenChange} />
    );
}
