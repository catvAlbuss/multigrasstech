import { Form, Head } from '@inertiajs/react';
import { CreditCard } from 'lucide-react';
import PlanController from '@/actions/App/Http/Controllers/Admin/PlanController';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function PlanCreate() {
    return (
        <>
            <Head title="Nuevo plan" />
            <div className="mx-auto max-w-2xl space-y-6">
                <div className="flex items-center gap-3 rounded-xl bg-green-700 px-6 py-5 text-white shadow-sm">
                    <CreditCard className="h-6 w-6 text-green-200" />
                    <div>
                        <h1 className="text-xl font-semibold">Nuevo plan</h1>
                        <p className="text-sm text-green-200">
                            Configura precio y modalidad de facturación
                        </p>
                    </div>
                </div>

                <div className="rounded-xl border border-green-100 bg-white p-6 shadow-sm dark:border-green-900/30 dark:bg-neutral-900">
                    <Form
                        {...PlanController.store.form()}
                        className="space-y-5"
                    >
                        {({ processing, errors }) => (
                            <>
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <div className="grid gap-1.5">
                                        <Label htmlFor="name">Nombre *</Label>
                                        <Input id="name" name="name" required />
                                        <InputError message={errors.name} />
                                    </div>
                                    <div className="grid gap-1.5">
                                        <Label htmlFor="slug">
                                            Identificador *
                                        </Label>
                                        <Input
                                            id="slug"
                                            name="slug"
                                            placeholder="premium"
                                            pattern="[a-z0-9-]+"
                                            required
                                        />
                                        <InputError message={errors.slug} />
                                    </div>
                                </div>
                                <div className="grid gap-1.5">
                                    <Label htmlFor="description">
                                        Descripción
                                    </Label>
                                    <textarea
                                        id="description"
                                        name="description"
                                        rows={3}
                                        className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs focus-visible:ring-1 focus-visible:ring-green-500 focus-visible:outline-none dark:bg-input/30"
                                    />
                                    <InputError message={errors.description} />
                                </div>
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <div className="grid gap-1.5">
                                        <Label htmlFor="price">
                                            Precio (USD)
                                        </Label>
                                        <Input
                                            id="price"
                                            name="price"
                                            type="number"
                                            min="0"
                                            step="0.01"
                                        />
                                        <InputError message={errors.price} />
                                    </div>
                                    <div className="grid gap-1.5">
                                        <Label htmlFor="billing_period">
                                            Modalidad *
                                        </Label>
                                        <select
                                            id="billing_period"
                                            name="billing_period"
                                            defaultValue="monthly"
                                            className="h-9 rounded-md border border-input bg-transparent px-3 text-sm text-foreground dark:bg-input/30"
                                            required
                                        >
                                            <option value="monthly">
                                                Mensual
                                            </option>
                                            <option value="yearly">
                                                Anual
                                            </option>
                                            <option value="lifetime">
                                                De por vida
                                            </option>
                                            <option value="contact">
                                                Contáctenos
                                            </option>
                                        </select>
                                        <InputError
                                            message={errors.billing_period}
                                        />
                                    </div>
                                </div>
                                <div className="grid gap-1.5">
                                    <Label htmlFor="sort_order">Orden</Label>
                                    <Input
                                        id="sort_order"
                                        name="sort_order"
                                        type="number"
                                        min="0"
                                        defaultValue="0"
                                        required
                                    />
                                    <InputError message={errors.sort_order} />
                                </div>
                                <div className="flex items-center gap-3">
                                    <input
                                        id="is_active"
                                        name="is_active"
                                        type="checkbox"
                                        value="1"
                                        defaultChecked
                                        className="h-4 w-4 rounded border-green-300 text-green-600 focus:ring-green-500"
                                    />
                                    <Label htmlFor="is_active">
                                        Plan activo
                                    </Label>
                                </div>
                                <div className="flex justify-end gap-3 border-t border-green-50 pt-4 dark:border-green-900/30">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => history.back()}
                                    >
                                        Cancelar
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={processing}
                                        className="bg-green-600 hover:bg-green-700"
                                    >
                                        {processing ? 'Creando…' : 'Crear plan'}
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

PlanCreate.layout = {
    breadcrumbs: [
        { title: 'Planes de pago', href: '/admin/plans' },
        { title: 'Nuevo plan', href: '/admin/plans/create' },
    ],
};
