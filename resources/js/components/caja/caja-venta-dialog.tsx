import { useForm } from '@inertiajs/react';
import { LoaderCircle, Minus, ShoppingCart } from 'lucide-react';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { CajaProduct } from '@/types/caja';

type VentaFormData = {
    product_id: number;
    quantity: number;
    notes: string;
};

export function CajaVentaDialog({
    open,
    product,
    onOpenChange,
}: {
    open: boolean;
    product: CajaProduct | null;
    onOpenChange: (open: boolean) => void;
}) {
    const form = useForm<VentaFormData>({
        product_id: product?.id ?? 0,
        quantity: 1,
        notes: '',
    });

    // Reset form when product changes
    useEffect(() => {
        if (product) {
            form.setData({
                product_id: product.id,
                quantity: 1,
                notes: '',
            });
        }
    }, [product?.id]);

    if (!product) {
return null;
}

    const price = Number(product.price ?? 0);
    const stock = product.stock ?? 0;
    const total = (price * form.data.quantity).toLocaleString('es-CO', {
        minimumFractionDigits: 2,
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        form.post('/caja/sell', {
            preserveScroll: true,
            onSuccess: () => onOpenChange(false),
        });
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <ShoppingCart className="size-5 text-green-600" />
                        Registrar venta
                    </DialogTitle>
                    <DialogDescription>
                        Confirma la cantidad vendida. El stock se actualizará automáticamente.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={submit} className="space-y-4">
                    {/* Producto info */}
                    <div className="rounded-lg border border-green-100 bg-green-50/60 p-4 dark:border-green-900 dark:bg-green-950/30">
                        <p className="font-semibold text-gray-900 dark:text-gray-100">{product.name}</p>
                        <div className="mt-1 flex items-center justify-between text-sm text-muted-foreground">
                            <span>Precio unitario: <strong className="text-green-700">${price.toLocaleString('es-CO')}</strong></span>
                            <span>Stock disponible: <strong className={stock <= 5 ? 'text-red-600' : 'text-gray-800 dark:text-gray-200'}>{stock} {product.unit}</strong></span>
                        </div>
                    </div>

                    {/* Cantidad */}
                    <div className="grid gap-1.5">
                        <Label htmlFor="venta-qty">
                            Cantidad <span className="text-red-500">*</span>
                        </Label>
                        <div className="flex items-center gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                className="h-9 w-9 shrink-0"
                                onClick={() => form.setData('quantity', Math.max(1, form.data.quantity - 1))}
                                disabled={form.data.quantity <= 1}
                            >
                                <Minus className="size-3.5" />
                            </Button>
                            <Input
                                id="venta-qty"
                                type="number"
                                min={1}
                                max={stock}
                                value={form.data.quantity}
                                onChange={(e) => form.setData('quantity', Number(e.target.value))}
                                className="text-center focus-visible:ring-green-500"
                                required
                            />
                            <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                className="h-9 w-9 shrink-0"
                                onClick={() => form.setData('quantity', Math.min(stock, form.data.quantity + 1))}
                                disabled={form.data.quantity >= stock}
                            >
                                <span className="text-base font-bold">+</span>
                            </Button>
                        </div>
                        {form.errors.quantity && (
                            <p className="text-xs text-red-500">{form.errors.quantity}</p>
                        )}
                    </div>

                    {/* Notas */}
                    <div className="grid gap-1.5">
                        <Label htmlFor="venta-notes">Notas (opcional)</Label>
                        <Input
                            id="venta-notes"
                            value={form.data.notes}
                            onChange={(e) => form.setData('notes', e.target.value)}
                            placeholder="Cliente, observación…"
                            className="focus-visible:ring-green-500"
                        />
                    </div>

                    {/* Total */}
                    <div className="rounded-lg bg-gray-50 p-3 dark:bg-neutral-800">
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Total a cobrar:</span>
                            <span className="text-lg font-bold text-green-600">${total}</span>
                        </div>
                    </div>

                    <DialogFooter className="border-t pt-4">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            disabled={form.processing || form.data.quantity < 1 || form.data.quantity > stock}
                            className="bg-green-600 hover:bg-green-700"
                        >
                            {form.processing ? (
                                <>
                                    <LoaderCircle className="mr-2 size-4 animate-spin" />
                                    Registrando…
                                </>
                            ) : (
                                <>
                                    <ShoppingCart className="mr-2 size-4" />
                                    Confirmar venta
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
