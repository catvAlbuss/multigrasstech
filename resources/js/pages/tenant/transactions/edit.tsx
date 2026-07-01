import { Form, Head } from '@inertiajs/react';
import { DollarSign } from 'lucide-react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { TransactionEditPageProps as Props } from '@/types/tenant';

export default function TransactionEdit({ transaction, reservations }: Props) {
    return (
        <>
            <Head title="Editar Transacción" />

            <div className="mx-auto max-w-2xl space-y-6">
                <div className="flex items-center gap-3 rounded-xl bg-green-700 px-6 py-5 text-white shadow-sm">
                    <DollarSign className="h-6 w-6 text-green-200" />
                    <div>
                        <h1 className="text-xl font-semibold">Editar Transacción</h1>
                        <p className="text-sm text-green-200">{transaction.description}</p>
                    </div>
                </div>

                <div className="rounded-xl border border-green-100 bg-white p-6 shadow-sm dark:border-green-900/30 dark:bg-neutral-900">
                    <Form action={`/transactions/${transaction.id}`} method="put" className="space-y-5">
                        {({ processing, errors }) => (
                            <>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-1.5">
                                        <Label htmlFor="type">Tipo <span className="text-red-500">*</span></Label>
                                        <select id="type" name="type" defaultValue={transaction.type} className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm text-foreground shadow-xs focus-visible:ring-1 focus-visible:ring-green-500 focus-visible:outline-none dark:bg-input/30" required>
                                            <option value="income">Ingreso</option>
                                            <option value="expense">Gasto</option>
                                        </select>
                                        <InputError message={errors.type} />
                                    </div>
                                    <div className="grid gap-1.5">
                                        <Label htmlFor="category">Categoría <span className="text-red-500">*</span></Label>
                                        <Input id="category" name="category" defaultValue={transaction.category} className="focus-visible:ring-green-500" required />
                                        <InputError message={errors.category} />
                                    </div>
                                </div>

                                <div className="grid gap-1.5">
                                    <Label htmlFor="description">Descripción <span className="text-red-500">*</span></Label>
                                    <Input id="description" name="description" defaultValue={transaction.description} className="focus-visible:ring-green-500" required />
                                    <InputError message={errors.description} />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-1.5">
                                        <Label htmlFor="amount">Monto <span className="text-red-500">*</span></Label>
                                        <Input id="amount" name="amount" type="number" min="0.01" step="0.01" defaultValue={transaction.amount} className="focus-visible:ring-green-500" required />
                                        <InputError message={errors.amount} />
                                    </div>
                                    <div className="grid gap-1.5">
                                        <Label htmlFor="date">Fecha <span className="text-red-500">*</span></Label>
                                        <Input id="date" name="date" type="date" defaultValue={transaction.date} className="focus-visible:ring-green-500" required />
                                        <InputError message={errors.date} />
                                    </div>
                                </div>

                                {reservations.length > 0 && (
                                    <div className="grid gap-1.5">
                                        <Label htmlFor="reservation_id">Reservación vinculada</Label>
                                        <select id="reservation_id" name="reservation_id" defaultValue={transaction.reservation_id ?? ''} className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm text-foreground shadow-xs focus-visible:ring-1 focus-visible:ring-green-500 focus-visible:outline-none dark:bg-input/30">
                                            <option value="">Sin reservación</option>
                                            {reservations.map((r) => <option key={r.id} value={r.id}>{r.code} — {new Date(r.date).toLocaleDateString('es-CO')}</option>)}
                                        </select>
                                        <InputError message={errors.reservation_id} />
                                    </div>
                                )}

                                <div className="grid gap-1.5">
                                    <Label htmlFor="notes">Notas</Label>
                                    <textarea id="notes" name="notes" rows={2} defaultValue={transaction.notes ?? ''} className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm text-foreground shadow-xs focus-visible:ring-1 focus-visible:ring-green-500 focus-visible:outline-none dark:bg-input/30" />
                                    <InputError message={errors.notes} />
                                </div>

                                <div className="flex items-center justify-end gap-3 border-t border-green-50 pt-4 dark:border-green-900/30">
                                    <Button type="button" variant="outline" onClick={() => history.back()}>Cancelar</Button>
                                    <Button type="submit" disabled={processing} className="bg-green-600 hover:bg-green-700">
                                        {processing ? 'Guardando…' : 'Guardar Cambios'}
                                    </Button>
                                </div>
                            </>
                        )}
                    </Form>
                </div>
            </div>
        </>
    );
}

TransactionEdit.layout = {
    breadcrumbs: [
        { title: 'Finanzas', href: '/transactions' },
        { title: 'Editar Transacción', href: '#' },
    ],
};
