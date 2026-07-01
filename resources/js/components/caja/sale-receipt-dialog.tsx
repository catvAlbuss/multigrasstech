import { CheckCircle2, Printer, X } from 'lucide-react';
import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import type { SaleData } from '@/types/caja';

function fmt(n: number | string) {
    return `S/ ${Number(n).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtDate(iso: string) {
    const d = new Date(iso);

    return d.toLocaleString('es-PE', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });
}

const IGV_TYPE_LABELS: Record<string, string> = {
    gravado: 'G',
    exonerado: 'E',
    inafecto: 'I',
};

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
    const receiptRef = useRef<HTMLDivElement>(null);

    if (!sale) {
return null;
}

    function handlePrint() {
        window.print();
    }

    const docLabel = sale.document_type === 'boleta' ? 'BOLETA DE VENTA' : 'FACTURA';
    const change = Number(sale.change_amount);

    return (
        <>
            {/* Print styles injected globally */}
            <style>{`
                @media print {
                    body > * { display: none !important; }
                    #sale-receipt-printable { display: block !important; }
                    #sale-receipt-printable {
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
                <DialogContent className="sm:max-w-md p-0 overflow-hidden">
                    <DialogTitle className="sr-only">
                        Venta registrada {sale.sale_number}
                    </DialogTitle>

                    {/* Success banner */}
                    <div className="flex items-center gap-3 bg-green-600 px-5 py-4">
                        <CheckCircle2 className="size-6 text-white" />
                        <div>
                            <p className="font-bold text-white">¡Venta registrada!</p>
                            <p className="text-sm text-green-100">{sale.sale_number}</p>
                        </div>
                        <button
                            onClick={() => onOpenChange(false)}
                            className="ml-auto text-white/80 hover:text-white"
                        >
                            <X className="size-5" />
                        </button>
                    </div>

                    {/* Receipt preview */}
                    <div className="p-5">
                        <div
                            id="sale-receipt-printable"
                            ref={receiptRef}
                            className="mx-auto max-w-[320px] rounded-lg border bg-white p-5 shadow-sm font-mono text-xs dark:bg-white dark:text-black"
                            style={{ fontFamily: "'Courier New', monospace", color: '#000', background: '#fff' }}
                        >
                            {/* Header */}
                            <div className="text-center mb-3">
                                <p className="text-sm font-bold uppercase tracking-wide">{businessName ?? 'MI NEGOCIO'}</p>
                                <p className="text-[10px] text-gray-500">www.minegocio.pe</p>
                                <div className="my-2 border-t border-dashed border-gray-400" />
                                <p className="font-bold uppercase">{docLabel}</p>
                                <p className="text-[11px]">N° {sale.sale_number}</p>
                                <p className="text-[10px] text-gray-500">{fmtDate(sale.sold_at)}</p>
                            </div>

                            {/* Customer */}
                            <div className="mb-3 border-t border-dashed border-gray-400 pt-2">
                                <div className="flex gap-1">
                                    <span className="text-gray-500 uppercase text-[10px]">Cliente:</span>
                                    <span className="font-medium text-[11px] break-all">{sale.customer_name}</span>
                                </div>
                                {sale.customer_doc_number && (
                                    <div className="flex gap-1">
                                        <span className="text-gray-500 uppercase text-[10px]">{sale.customer_doc_type.toUpperCase()}:</span>
                                        <span className="text-[11px]">{sale.customer_doc_number}</span>
                                    </div>
                                )}
                                {sale.customer_address && (
                                    <div className="flex gap-1">
                                        <span className="text-gray-500 uppercase text-[10px]">Dir:</span>
                                        <span className="text-[10px] break-all">{sale.customer_address}</span>
                                    </div>
                                )}
                            </div>

                            {/* Items */}
                            <div className="border-t border-dashed border-gray-400 pt-2 mb-2">
                                <div className="flex justify-between text-[10px] text-gray-500 mb-1 uppercase">
                                    <span>Descripción</span>
                                    <span>Total</span>
                                </div>
                                {sale.items.map((item) => (
                                    <div key={item.id} className="mb-1.5">
                                        <div className="flex justify-between">
                                            <span className="font-medium text-[11px]">{item.product_name}</span>
                                            <span className="text-[11px]">{fmt(item.total)}</span>
                                        </div>
                                        <div className="text-[10px] text-gray-500">
                                            {item.quantity} × {fmt(item.unit_price_base)} {sale.igv_applied ? `[${IGV_TYPE_LABELS[item.igv_type] ?? item.igv_type}]` : ''}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Totals */}
                            <div className="border-t border-dashed border-gray-400 pt-2 mb-3">
                                {sale.igv_applied && (
                                    <>
                                        <div className="flex justify-between text-[11px]">
                                            <span className="text-gray-500">OP. GRAVADAS</span>
                                            <span>{fmt(sale.subtotal)}</span>
                                        </div>
                                        <div className="flex justify-between text-[11px]">
                                            <span className="text-gray-500">IGV (18%)</span>
                                            <span>{fmt(sale.igv_amount)}</span>
                                        </div>
                                    </>
                                )}
                                <div className="flex justify-between font-bold text-[13px] mt-1">
                                    <span>TOTAL</span>
                                    <span>{fmt(sale.total)}</span>
                                </div>
                            </div>

                            {/* Payment */}
                            <div className="border-t border-dashed border-gray-400 pt-2 mb-2 text-[11px]">
                                <div className="flex justify-between">
                                    <span className="text-gray-500">PAGADO CON</span>
                                    <span>{fmt(sale.payment_amount)}</span>
                                </div>
                                {change > 0 && (
                                    <div className="flex justify-between font-bold">
                                        <span>VUELTO</span>
                                        <span>{fmt(change)}</span>
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="border-t border-dashed border-gray-400 pt-2 text-center text-[10px] text-gray-500">
                                <p>¡Gracias por su compra!</p>
                                <p className="mt-0.5">Comprobante electrónico</p>
                            </div>
                        </div>

                        {/* Action buttons */}
                        <div className="mt-5 flex gap-3">
                            <Button
                                variant="outline"
                                className="flex-1"
                                onClick={() => onOpenChange(false)}
                            >
                                Cerrar
                            </Button>
                            <Button
                                className="flex-1 bg-green-600 hover:bg-green-700"
                                onClick={handlePrint}
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
