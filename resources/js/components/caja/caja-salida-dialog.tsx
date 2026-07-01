import { useForm } from '@inertiajs/react';
import { ArrowDownCircle, LoaderCircle } from 'lucide-react';
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

const EXPENSE_CATEGORIES = [
    { value: 'insumos', label: 'Pago de insumos / compras' },
    { value: 'servicios', label: 'Servicios (agua, luz, internet…)' },
    { value: 'mantenimiento', label: 'Mantenimiento' },
    { value: 'salario', label: 'Salario / pago a personal' },
    { value: 'renta', label: 'Renta' },
    { value: 'otro', label: 'Otro gasto' },
] as const;

type SalidaFormData = {
    category: string;
    description: string;
    amount: string;
    notes: string;
};

const EMPTY: SalidaFormData = {
    category: 'insumos',
    description: '',
    amount: '',
    notes: '',
};

export function CajaSalidaDialog({
    open,
    onOpenChange,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const form = useForm<SalidaFormData>(EMPTY);

    function submit(e: React.FormEvent) {
        e.preventDefault();
        form.post('/caja/expense', {
            preserveScroll: true,
            onSuccess: () => {
                form.reset();
                onOpenChange(false);
            },
        });
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <ArrowDownCircle className="size-5 text-red-500" />
                        Registrar salida de dinero
                    </DialogTitle>
                    <DialogDescription>
                        Registra un gasto o pago realizado desde caja (compras, servicios, etc.).
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={submit} className="space-y-4">
                    {/* Categoría */}
                    <div className="grid gap-1.5">
                        <Label htmlFor="salida-cat">
                            Tipo de gasto <span className="text-red-500">*</span>
                        </Label>
                        <select id="salida-cat" value={form.data.category} onChange={(e) => form.setData('category', e.target.value)}
                            className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm text-foreground shadow-xs focus-visible:ring-1 focus-visible:ring-red-400 focus-visible:outline-none dark:bg-input/30"
                            required >
                            {EXPENSE_CATEGORIES.map((c) => (
                                <option key={c.value} value={c.value}>
                                    {c.label}
                                </option>
                            ))}
                        </select>
                        {form.errors.category && (
                            <p className="text-xs text-red-500">{form.errors.category}</p>
                        )}
                    </div>

                    {/* Descripción */}
                    <div className="grid gap-1.5">
                        <Label htmlFor="salida-desc">
                            Descripción <span className="text-red-500">*</span>
                        </Label>
                        <Input id="salida-desc" value={form.data.description} onChange={(e) => form.setData('description', e.target.value)} placeholder="Ej: Compra de refrescos, pago de luz…" className="focus-visible:ring-red-400" required />
                        {form.errors.description && (
                            <p className="text-xs text-red-500">{form.errors.description}</p>
                        )}
                    </div>

                    {/* Monto */}
                    <div className="grid gap-1.5">
                        <Label htmlFor="salida-amount">
                            Monto <span className="text-red-500">*</span>
                        </Label>
                        <div className="relative">
                            <span className="absolute top-1/2 left-3 -translate-y-1/2 text-sm font-medium text-muted-foreground">
                                $
                            </span>
                            <Input id="salida-amount" type="number" min="0.01" step="0.01" value={form.data.amount} onChange={(e) => form.setData('amount', e.target.value)}
                                className="pl-7 focus-visible:ring-red-400"
                                placeholder="0.00" required />
                        </div>
                        {form.errors.amount && (
                            <p className="text-xs text-red-500">{form.errors.amount}</p>
                        )}
                    </div>

                    {/* Notas */}
                    <div className="grid gap-1.5">
                        <Label htmlFor="salida-notes">Notas (opcional)</Label>
                        <textarea id="salida-notes" rows={2} value={form.data.notes} onChange={(e) => form.setData('notes', e.target.value)}
                            className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm text-foreground shadow-xs focus-visible:ring-1 focus-visible:ring-red-400 focus-visible:outline-none dark:bg-input/30"
                            placeholder="Detalles adicionales…"
                        />
                    </div>

                    <DialogFooter className="border-t pt-4">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={form.processing} className="bg-red-600 hover:bg-red-700" >
                            {form.processing ? (
                                <>
                                    <LoaderCircle className="mr-2 size-4 animate-spin" />
                                    Registrando…
                                </>
                            ) : (
                                <>
                                    <ArrowDownCircle className="mr-2 size-4" />
                                    Registrar salida
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
