import { CheckCircle2, Printer, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';

export type ReceiptLine = {
    id: string | number;
    label: string;
    detail?: string;
    total: number;
};

/**
 * Normalized shape for any printable boleta/factura ticket in the app — sales
 * (caja) and reservation payments both map into this so they share one
 * printable layout. Extend here (not per-flow) as comprobante needs grow.
 */
export type ReceiptTicketData = {
    documentType: 'boleta' | 'factura';
    docLabel?: string;
    ticketNumber: string;
    issuedAt: string;
    businessName?: string;
    successTitle: string;
    customer: {
        name: string;
        docType?: string | null;
        docNumber?: string | null;
        address?: string | null;
    };
    lines: ReceiptLine[];
    igvApplied?: boolean;
    subtotal?: number;
    igvAmount?: number;
    total: number;
    paymentAmount?: number;
    changeAmount?: number;
    balanceAfter?: number;
    attendantName?: string | null;
    footerNote?: string;
};

function fmt(n: number | string) {
    return `S/ ${Number(n).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtDate(iso: string) {
    const d = new Date(iso);

    return d.toLocaleString('es-PE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

export function ReceiptTicket({ data }: { data: ReceiptTicketData }) {
    const docLabel = data.docLabel ?? (data.documentType === 'boleta' ? 'BOLETA DE VENTA' : 'FACTURA');

    return (
        <div
            id="receipt-ticket-printable"
            className="mx-auto max-w-[320px] rounded-lg border bg-white p-5 font-mono text-xs shadow-sm dark:bg-white dark:text-black"
            style={{ fontFamily: "'Courier New', monospace", color: '#000', background: '#fff' }}
        >
            <div className="mb-3 text-center">
                <p className="text-sm font-bold tracking-wide uppercase">
                    {data.businessName ?? 'MI NEGOCIO'}
                </p>
                <div className="my-2 border-t border-dashed border-gray-400" />
                <p className="font-bold uppercase">{docLabel}</p>
                <p className="text-[11px]">N° {data.ticketNumber}</p>
                <p className="text-[10px] text-gray-500">{fmtDate(data.issuedAt)}</p>
            </div>

            <div className="mb-3 border-t border-dashed border-gray-400 pt-2">
                <div className="flex gap-1">
                    <span className="text-[10px] text-gray-500 uppercase">Cliente:</span>
                    <span className="text-[11px] font-medium break-all">{data.customer.name}</span>
                </div>
                {data.customer.docNumber && (
                    <div className="flex gap-1">
                        <span className="text-[10px] text-gray-500 uppercase">
                            {(data.customer.docType ?? '').toUpperCase()}:
                        </span>
                        <span className="text-[11px]">{data.customer.docNumber}</span>
                    </div>
                )}
                {data.customer.address && (
                    <div className="flex gap-1">
                        <span className="text-[10px] text-gray-500 uppercase">Dir:</span>
                        <span className="text-[10px] break-all">{data.customer.address}</span>
                    </div>
                )}
            </div>

            <div className="mb-2 border-t border-dashed border-gray-400 pt-2">
                <div className="mb-1 flex justify-between text-[10px] text-gray-500 uppercase">
                    <span>Descripción</span>
                    <span>Total</span>
                </div>
                {data.lines.map((line) => (
                    <div key={line.id} className="mb-1.5">
                        <div className="flex justify-between">
                            <span className="text-[11px] font-medium">{line.label}</span>
                            <span className="text-[11px]">{fmt(line.total)}</span>
                        </div>
                        {line.detail && (
                            <div className="text-[10px] text-gray-500">{line.detail}</div>
                        )}
                    </div>
                ))}
            </div>

            <div className="mb-3 border-t border-dashed border-gray-400 pt-2">
                {data.igvApplied && (
                    <>
                        <div className="flex justify-between text-[11px]">
                            <span className="text-gray-500">OP. GRAVADAS</span>
                            <span>{fmt(data.subtotal ?? 0)}</span>
                        </div>
                        <div className="flex justify-between text-[11px]">
                            <span className="text-gray-500">IGV (18%)</span>
                            <span>{fmt(data.igvAmount ?? 0)}</span>
                        </div>
                    </>
                )}
                <div className="mt-1 flex justify-between text-[13px] font-bold">
                    <span>TOTAL</span>
                    <span>{fmt(data.total)}</span>
                </div>
            </div>

            {(data.paymentAmount !== undefined || data.balanceAfter !== undefined) && (
                <div className="mb-2 border-t border-dashed border-gray-400 pt-2 text-[11px]">
                    {data.paymentAmount !== undefined && (
                        <div className="flex justify-between">
                            <span className="text-gray-500">PAGADO</span>
                            <span>{fmt(data.paymentAmount)}</span>
                        </div>
                    )}
                    {!!data.changeAmount && data.changeAmount > 0 && (
                        <div className="flex justify-between font-bold">
                            <span>VUELTO</span>
                            <span>{fmt(data.changeAmount)}</span>
                        </div>
                    )}
                    {!!data.balanceAfter && data.balanceAfter > 0 && (
                        <div className="flex justify-between font-bold text-amber-700">
                            <span>SALDO PENDIENTE</span>
                            <span>{fmt(data.balanceAfter)}</span>
                        </div>
                    )}
                </div>
            )}

            {data.attendantName && (
                <div className="mb-2 border-t border-dashed border-gray-400 pt-2 text-[10px]">
                    <div className="flex justify-between">
                        <span className="text-gray-500 uppercase">Atendido por</span>
                        <span className="font-medium">{data.attendantName}</span>
                    </div>
                </div>
            )}

            <div className="border-t border-dashed border-gray-400 pt-2 text-center text-[10px] text-gray-500">
                <p>{data.footerNote ?? '¡Gracias por su preferencia!'}</p>
                <p className="mt-0.5">Comprobante electrónico</p>
            </div>
        </div>
    );
}

export function ReceiptDialog({
    open,
    data,
    onOpenChange,
}: {
    open: boolean;
    data: ReceiptTicketData | null;
    onOpenChange: (open: boolean) => void;
}) {
    if (!data) {
        return null;
    }

    return (
        <>
            <style>{`
                @media print {
                    body > * { display: none !important; }
                    #receipt-ticket-printable { display: block !important; }
                    #receipt-ticket-printable {
                        position: fixed;
                        top: 0;
                        left: 0;
                        width: 80mm;
                        font-family: 'Courier New', monospace;
                        font-size: 11px;
                        color: #000;
                        padding: 4mm;
                        background: white;
                    }
                }
            `}</style>

            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="overflow-hidden p-0 sm:max-w-md">
                    <DialogTitle className="sr-only">
                        {data.successTitle} {data.ticketNumber}
                    </DialogTitle>

                    <div className="flex items-center gap-3 bg-green-600 px-5 py-4">
                        <CheckCircle2 className="size-6 text-white" />
                        <div>
                            <p className="font-bold text-white">{data.successTitle}</p>
                            <p className="text-sm text-green-100">{data.ticketNumber}</p>
                        </div>
                        <button
                            onClick={() => onOpenChange(false)}
                            className="ml-auto text-white/80 hover:text-white"
                        >
                            <X className="size-5" />
                        </button>
                    </div>

                    <div className="p-5">
                        <ReceiptTicket data={data} />

                        <div className="mt-5 flex gap-3">
                            <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
                                Cerrar
                            </Button>
                            <Button
                                className="flex-1 bg-green-600 hover:bg-green-700"
                                onClick={() => window.print()}
                            >
                                <Printer className="mr-2 size-4" />
                                Imprimir
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
