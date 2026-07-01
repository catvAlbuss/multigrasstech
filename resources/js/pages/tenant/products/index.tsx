import { Head, router, usePage } from '@inertiajs/react';
import { Package, Plus, Search, Trash2, Pencil } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import Swal from 'sweetalert2';
import { ProductFormDialog } from '@/components/products/product-form-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type {
    ProductsIndexPageProps as Props,
    TenantProduct as Product,
} from '@/types/tenant';

const CATEGORY_LABELS: Record<string, string> = {
    bebida: 'Bebida',
    snack: 'Snack',
    protector: 'Protector',
    equipo: 'Equipo',
    otro: 'Otro',
};

export default function ProductsIndex({ products, filters }: Props) {
    const { flash } = usePage<{ flash: { success?: string; error?: string } }>().props;
    const searchRef = useRef<HTMLInputElement>(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

    useEffect(() => {
        if (flash?.success) {
toast.success(flash.success);
}

        if (flash?.error) {
toast.error(flash.error);
}
    }, [flash]);

    function openCreate() {
        setSelectedProduct(null);
        setDialogOpen(true);
    }

    function openEdit(product: Product) {
        setSelectedProduct(product);
        setDialogOpen(true);
    }

    function handleSearch(e: React.FormEvent) {
        e.preventDefault();
        router.get(
            '/products',
            { search: searchRef.current?.value ?? '', category: filters.category },
            { preserveState: true, replace: true },
        );
    }

    function handleFilter(key: string, value: string) {
        router.get('/products', { ...filters, [key]: value }, { preserveState: true, replace: true });
    }

    async function handleDelete(product: Product) {
        const result = await Swal.fire({
            icon: 'warning',
            title: '¿Eliminar producto?',
            text: `"${product.name}" será eliminado permanentemente.`,
            showCancelButton: true,
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#dc2626',
            reverseButtons: true,
        });

        if (result.isConfirmed) {
            router.delete(`/products/${product.id}`);
        }
    }

    return (
        <>
            <Head title="Productos" />

            <div className="space-y-5 px-4 pb-6">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <div className="flex items-center gap-2">
                            <Package className="size-5 text-green-600" />
                            <h1 className="text-2xl font-bold tracking-tight">Productos</h1>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Gestiona tu inventario de productos.
                        </p>
                    </div>
                    <Button
                        onClick={openCreate}
                        className="bg-green-600 hover:bg-green-700"
                        id="btn-nuevo-producto"
                    >
                        <Plus className="mr-1.5 size-4" /> Nuevo producto
                    </Button>
                </div>

                <div className="overflow-hidden rounded-2xl border bg-card shadow-sm mb-6">
                    {/* Filtros */}
                    <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
                        <form onSubmit={handleSearch} className="flex w-full max-w-xl gap-2">
                            <div className="relative flex-1">
                                <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    ref={searchRef}
                                    defaultValue={filters.search}
                                    placeholder="Buscar producto por nombre o código…"
                                    className="pl-9 rounded-xl"
                                />
                            </div>
                            <Button type="submit" variant="outline" className="rounded-xl">
                                Buscar
                            </Button>
                            {(filters.search || filters.category) && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    className="rounded-xl"
                                    onClick={() => router.get('/products', {}, { replace: true })}
                                >
                                    Limpiar
                                </Button>
                            )}
                        </form>
                        <div className="flex items-center gap-3">
                            <select
                                value={filters.category}
                                onChange={(e) => handleFilter('category', e.target.value)}
                                className="h-9 rounded-xl border border-input bg-background px-3 py-1 text-sm text-foreground focus-visible:ring-1 focus-visible:ring-green-500 focus-visible:outline-none"
                            >
                                <option value="">Todas las categorías</option>
                                {Object.entries(CATEGORY_LABELS).map(([v, l]) => (
                                    <option key={v} value={v}>{l}</option>
                                ))}
                            </select>
                            <div className="flex flex-col text-right">
                                <span className="text-xs text-muted-foreground">Total</span>
                                <span className="text-sm font-bold text-foreground leading-none">{products.total}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Grid de Productos */}
                {products.data.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed py-24 text-muted-foreground bg-gray-50/50 dark:bg-gray-900/20">
                        <Package className="mb-4 size-12 opacity-20" />
                        <p className="text-base font-medium">No hay productos registrados.</p>
                        <p className="text-sm mt-1">Crea tu primer producto para empezar a vender.</p>
                        <Button onClick={openCreate} variant="outline" className="mt-6 rounded-xl">
                            <Plus className="mr-2 size-4" /> Agregar producto
                        </Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                        {products.data.map((product) => (
                            <div
                                key={product.id}
                                className="group flex flex-col overflow-hidden rounded-[2rem] bg-white shadow-sm ring-1 ring-gray-200/60 transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-green-900/5 hover:ring-green-300 dark:bg-neutral-900 dark:ring-gray-800 dark:hover:ring-green-800/60"
                            >
                                {/* Imagen superior */}
                                <div className="relative h-48 w-full overflow-hidden bg-gradient-to-b from-gray-50 to-gray-100/50 dark:from-neutral-800 dark:to-neutral-900/50">
                                    {product.image_url ? (
                                        <img
                                            src={product.image_url}
                                            alt={product.name}
                                            className="h-full w-full object-contain p-4 transition-transform duration-500 group-hover:scale-105"
                                        />
                                    ) : (
                                        <div className="flex h-full items-center justify-center">
                                            <Package className="size-16 text-gray-300/50 dark:text-gray-600/30" />
                                        </div>
                                    )}
                                    
                                    {/* Badges superiores */}
                                    <div className="absolute left-4 top-4 flex flex-col gap-2">
                                        <Badge
                                            variant="secondary"
                                            className="bg-white/95 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-gray-700 shadow-sm backdrop-blur-md dark:bg-neutral-900/95 dark:text-gray-300"
                                        >
                                            {CATEGORY_LABELS[product.category] ?? product.category}
                                        </Badge>
                                    </div>
                                    <div className="absolute right-4 top-4 flex flex-col items-end gap-2">
                                        <Badge
                                            className={`px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider shadow-sm backdrop-blur-md ${
                                                product.is_active
                                                    ? 'bg-green-500/90 text-white hover:bg-green-600'
                                                    : 'bg-gray-500/90 text-white hover:bg-gray-600'
                                            }`}
                                        >
                                            {product.is_active ? 'Activo' : 'Inactivo'}
                                        </Badge>
                                        {product.igv_type !== 'gravado' && (
                                            <Badge variant="outline" className="bg-white/95 px-2 py-0.5 text-[10px] font-bold text-amber-600 border-amber-200 shadow-sm backdrop-blur-md dark:bg-neutral-900/95 dark:border-amber-900/50 dark:text-amber-500">
                                                {product.igv_type}
                                            </Badge>
                                        )}
                                    </div>
                                </div>

                                {/* Contenido */}
                                <div className="flex flex-1 flex-col p-6">
                                    <div className="mb-4 flex flex-col gap-1">
                                        <div className="flex items-start justify-between gap-3">
                                            <h3 className="text-xl font-extrabold leading-tight text-gray-900 dark:text-gray-100 line-clamp-2">
                                                {product.name}
                                            </h3>
                                            {!product.has_variants && (
                                                <p className="shrink-0 text-2xl font-black tracking-tight text-green-600 dark:text-green-500">
                                                    <span className="text-sm font-bold text-green-600/70 dark:text-green-500/70 mr-0.5">S/</span>
                                                    {Number(product.price).toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                                                </p>
                                            )}
                                        </div>
                                        
                                        {!product.has_variants && product.sku && (
                                            <p className="text-xs font-mono font-medium text-gray-400 dark:text-gray-500">
                                                Ref: {product.sku}
                                            </p>
                                        )}
                                        
                                        {product.has_variants && (
                                            <div className="mt-1">
                                                <span className="inline-flex items-center rounded-lg bg-green-50 px-2.5 py-1 text-xs font-bold text-green-700 dark:bg-green-950/40 dark:text-green-400">
                                                    <Package className="mr-1.5 size-3.5" />
                                                    {product.variants?.length ?? 0} {product.variants?.length === 1 ? 'Presentación' : 'Presentaciones'}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {product.description && (
                                        <p className="mb-5 text-sm text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">
                                            {product.description}
                                        </p>
                                    )}

                                    {/* Variantes (Mejorado para legibilidad) */}
                                    {product.has_variants && product.variants && product.variants.length > 0 && (
                                        <div className="mb-6 flex flex-col gap-2">
                                            {product.variants.slice(0, 4).map((v) => (
                                                <div
                                                    key={v.id}
                                                    className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 px-3 py-2 transition-colors hover:bg-green-50/50 dark:border-gray-800 dark:bg-neutral-800/40"
                                                >
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-bold text-gray-800 dark:text-gray-200">{v.label}</span>
                                                        <span className={`text-[11px] font-semibold ${ v.stock === 0 ? 'text-red-500' : v.stock <= 5 ? 'text-orange-500' : 'text-gray-500 dark:text-gray-400'}`}>
                                                            {v.stock} {v.unit} disp.
                                                        </span>
                                                    </div>
                                                    <span className="text-sm font-black text-green-600 dark:text-green-400">
                                                        S/ {Number(v.price).toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                                                    </span>
                                                </div>
                                            ))}
                                            {product.variants.length > 4 && (
                                                <div className="text-center text-xs font-semibold text-gray-400">
                                                    + {product.variants.length - 4} presentaciones más...
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Stats: solo para productos simples */}
                                    {!product.has_variants && (
                                        <div className="mb-6 mt-auto flex gap-3">
                                            <div className="flex flex-1 flex-col items-center justify-center rounded-2xl bg-gray-50/80 py-3 dark:bg-neutral-800/40">
                                                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Stock</span>
                                                <span className={`text-lg font-black ${(product.stock ?? 0) === 0 ? 'text-red-500' : (product.stock ?? 0) <= 5 ? 'text-orange-500' : 'text-gray-800 dark:text-gray-200'}`}>
                                                    {product.stock} <span className="text-xs font-bold text-gray-400">{product.unit}</span>
                                                </span>
                                            </div>
                                            <div className="flex flex-1 flex-col items-center justify-center rounded-2xl bg-gray-50/80 py-3 dark:bg-neutral-800/40">
                                                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Ventas</span>
                                                <span className="text-lg font-black text-gray-800 dark:text-gray-200">—</span>
                                            </div>
                                        </div>
                                    )}

                                    {/* Acciones */}
                                    <div className="mt-auto flex items-center gap-2 pt-2 border-t border-gray-100 dark:border-gray-800/60">
                                        <Button
                                            variant="ghost"
                                            className="h-11 flex-1 rounded-xl font-bold text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-neutral-800 dark:hover:text-white"
                                            onClick={() => openEdit(product)}
                                        >
                                            <Pencil className="mr-2 size-4" />
                                            Editar
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            className="h-11 flex-none rounded-xl px-3 text-red-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30"
                                            onClick={() => handleDelete(product)}
                                            aria-label="Eliminar"
                                        >
                                            <Trash2 className="size-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                {/* Paginación */}
                {products.last_page > 1 && (
                    <div className="mt-8 flex items-center justify-between rounded-2xl border bg-white p-4 text-sm text-muted-foreground shadow-sm dark:bg-neutral-900">
                        <span>
                            Mostrando {products.from}–{products.to} de {products.total}
                        </span>
                        <div className="flex gap-1">
                            {products.links.map((link, i) => (
                                <button
                                    key={i}
                                    disabled={!link.url}
                                    onClick={() => link.url && router.get(link.url)}
                                    className={`min-w-[32px] rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                                        link.active
                                            ? 'bg-green-600 text-white shadow-sm'
                                            : 'border hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-transparent dark:border-gray-800 dark:hover:bg-neutral-800'
                                    }`}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {dialogOpen && (
                <ProductFormDialog
                    open={dialogOpen}
                    product={selectedProduct}
                    onOpenChange={setDialogOpen}
                />
            )}
        </>
    );
}

ProductsIndex.layout = { breadcrumbs: [{ title: 'Productos', href: '/products' }] };
