import { Form, Head } from '@inertiajs/react';
import { Package } from 'lucide-react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { TenantProduct as Product } from '@/types/tenant';

export default function ProductEdit({ product }: { product: Product }) {
    return (
        <>
            <Head title={`Editar: ${product.name}`} />

            <div className="mx-auto max-w-2xl space-y-6">
                <div className="flex items-center gap-3 rounded-xl bg-green-700 px-6 py-5 text-white shadow-sm">
                    <Package className="h-6 w-6 text-green-200" />
                    <div>
                        <h1 className="text-xl font-semibold">Editar Producto</h1>
                        <p className="text-sm text-green-200">{product.name}</p>
                    </div>
                </div>

                <div className="rounded-xl border border-green-100 bg-white p-6 shadow-sm dark:border-green-900/30 dark:bg-neutral-900">
                    <Form action={`/products/${product.id}`} method="put" className="space-y-5">
                        {({ processing, errors }) => (
                            <>
                                <div className="grid gap-1.5">
                                    <Label htmlFor="name">Nombre <span className="text-red-500">*</span></Label>
                                    <Input id="name" name="name" defaultValue={product.name} className="focus-visible:ring-green-500" required />
                                    <InputError message={errors.name} />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-1.5">
                                        <Label htmlFor="category">Categoría <span className="text-red-500">*</span></Label>
                                        <select id="category" name="category" defaultValue={product.category} className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm text-foreground shadow-xs focus-visible:ring-1 focus-visible:ring-green-500 focus-visible:outline-none dark:bg-input/30" required>
                                            <option value="bebida">Bebida</option>
                                            <option value="snack">Snack</option>
                                            <option value="protector">Protector</option>
                                            <option value="equipo">Equipo</option>
                                            <option value="otro">Otro</option>
                                        </select>
                                        <InputError message={errors.category} />
                                    </div>
                                    <div className="grid gap-1.5">
                                        <Label htmlFor="unit">Unidad <span className="text-red-500">*</span></Label>
                                        <Input id="unit" name="unit" defaultValue={product.unit} className="focus-visible:ring-green-500" required />
                                        <InputError message={errors.unit} />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-1.5">
                                        <Label htmlFor="stock">Stock <span className="text-red-500">*</span></Label>
                                        <Input id="stock" name="stock" type="number" min="0" defaultValue={product.stock} className="focus-visible:ring-green-500" required />
                                        <InputError message={errors.stock} />
                                    </div>
                                    <div className="grid gap-1.5">
                                        <Label htmlFor="price">Precio <span className="text-red-500">*</span></Label>
                                        <Input id="price" name="price" type="number" min="0" step="0.01" defaultValue={product.price} className="focus-visible:ring-green-500" required />
                                        <InputError message={errors.price} />
                                    </div>
                                </div>

                                <div className="grid gap-1.5">
                                    <Label htmlFor="description">Descripción</Label>
                                    <textarea id="description" name="description" rows={2} defaultValue={product.description ?? ''} className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm text-foreground shadow-xs focus-visible:ring-1 focus-visible:ring-green-500 focus-visible:outline-none dark:bg-input/30" />
                                    <InputError message={errors.description} />
                                </div>

                                <div className="flex items-center gap-3">
                                    <input id="is_active" name="is_active" type="checkbox" defaultChecked={product.is_active} value="1" className="h-4 w-4 rounded border-green-300 text-green-600 focus:ring-green-500" />
                                    <Label htmlFor="is_active" className="cursor-pointer">Producto activo</Label>
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

ProductEdit.layout = {
    breadcrumbs: [
        { title: 'Productos', href: '/products' },
        { title: 'Editar Producto', href: '#' },
    ],
};
