import { Form, Head } from '@inertiajs/react';
import { Users } from 'lucide-react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function ClientCreate() {
    return (
        <>
            <Head title="Nuevo Cliente" />

            <div className="mx-auto max-w-2xl space-y-6">
                <div className="flex items-center gap-3 rounded-xl bg-green-700 px-6 py-5 text-white shadow-sm">
                    <Users className="h-6 w-6 text-green-200" />
                    <div>
                        <h1 className="text-xl font-semibold">Nuevo Cliente</h1>
                        <p className="text-sm text-green-200">Registra un nuevo cliente</p>
                    </div>
                </div>

                <div className="rounded-xl border border-green-100 bg-white p-6 shadow-sm dark:border-green-900/30 dark:bg-neutral-900">
                    <Form action="/clients" method="post" className="space-y-5">
                        {({ processing, errors }) => (
                            <>
                                <div className="grid gap-1.5">
                                    <Label htmlFor="name">Nombre completo <span className="text-red-500">*</span></Label>
                                    <Input id="name" name="name" placeholder="Juan Pérez" className="focus-visible:ring-green-500" required />
                                    <InputError message={errors.name} />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-1.5">
                                        <Label htmlFor="email">Email</Label>
                                        <Input id="email" name="email" type="email" placeholder="juan@email.com" className="focus-visible:ring-green-500" />
                                        <InputError message={errors.email} />
                                    </div>
                                    <div className="grid gap-1.5">
                                        <Label htmlFor="phone">Teléfono</Label>
                                        <Input id="phone" name="phone" type="tel" placeholder="+57 300 000 0000" className="focus-visible:ring-green-500" />
                                        <InputError message={errors.phone} />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-1.5">
                                        <Label htmlFor="document_type">Tipo documento</Label>
                                        <select id="document_type" name="document_type" className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm text-foreground shadow-xs focus-visible:ring-1 focus-visible:ring-green-500 focus-visible:outline-none dark:bg-input/30">
                                            <option value="">Sin documento</option>
                                            <option value="cc">C.C. (Cédula)</option>
                                            <option value="nit">NIT</option>
                                            <option value="passport">Pasaporte</option>
                                            <option value="other">Otro</option>
                                        </select>
                                        <InputError message={errors.document_type} />
                                    </div>
                                    <div className="grid gap-1.5">
                                        <Label htmlFor="document_number">Número documento</Label>
                                        <Input id="document_number" name="document_number" placeholder="12345678" className="focus-visible:ring-green-500" />
                                        <InputError message={errors.document_number} />
                                    </div>
                                </div>

                                <div className="grid gap-1.5">
                                    <Label htmlFor="notes">Notas</Label>
                                    <textarea id="notes" name="notes" rows={3} placeholder="Observaciones opcionales..." className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm text-foreground shadow-xs focus-visible:ring-1 focus-visible:ring-green-500 focus-visible:outline-none dark:bg-input/30" />
                                    <InputError message={errors.notes} />
                                </div>

                                <div className="flex items-center gap-3">
                                    <input id="is_active" name="is_active" type="checkbox" defaultChecked value="1" className="h-4 w-4 rounded border-green-300 text-green-600 focus:ring-green-500" />
                                    <Label htmlFor="is_active" className="cursor-pointer">Cliente activo</Label>
                                </div>

                                <div className="flex items-center justify-end gap-3 border-t border-green-50 pt-4 dark:border-green-900/30">
                                    <Button type="button" variant="outline" onClick={() => history.back()}>Cancelar</Button>
                                    <Button type="submit" disabled={processing} className="bg-green-600 hover:bg-green-700">
                                        {processing ? 'Guardando…' : 'Crear Cliente'}
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

ClientCreate.layout = {
    breadcrumbs: [
        { title: 'Clientes', href: '/clients' },
        { title: 'Nuevo Cliente', href: '/clients/create' },
    ],
};
