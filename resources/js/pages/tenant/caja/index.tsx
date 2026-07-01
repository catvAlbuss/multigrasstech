import { Head, router, usePage } from '@inertiajs/react';
import { Package } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { CajaHeader } from '@/components/caja/caja-header';
import { CajaSalidaDialog } from '@/components/caja/caja-salida-dialog';
import { CheckoutDialog } from '@/components/caja/checkout-dialog';
import { CheckoutPanel } from '@/components/caja/checkout-panel';
import { ProductCard } from '@/components/caja/product-card';
import { ProductFilters } from '@/components/caja/product-filters';
import { SaleReceiptDialog } from '@/components/caja/sale-receipt-dialog';
import { TodayMovements } from '@/components/caja/today-movements';
import { useCajaCart } from '@/hooks/use-caja-cart';
import { useCajaProducts } from '@/hooks/use-caja-products';
import type { CajaIndexPageProps as Props, SaleData } from '@/types/caja';

export default function CajaIndex({ products, sales_today, expenses_today, totals_today }: Props) {
    const { flash } = usePage<{ flash: { success?: string; error?: string } }>().props;

    const { cart, cartUnits, igvApplied, setIgvApplied, addToCart, addVariantToCart, updateQty, removeFromCart, getCartQty, resetCart } = useCajaCart();

    const { categories, categoryFilter, filteredProducts, searchQuery, setCategoryFilter, setSearchQuery, variantsCount } = useCajaProducts(products);

    const [checkoutOpen, setCheckoutOpen] = useState(false);
    const [salidaOpen, setSalidaOpen] = useState(false);
    const [sale, setSale] = useState<SaleData | null>(null);
    const [receiptOpen, setReceiptOpen] = useState(false);

    useEffect(() => {
 if (flash?.success) {
toast.success(flash.success);
}

 if (flash?.error) {
toast.error(flash.error);
} 
}, [flash]);

    function handleCheckoutSuccess(saleData: SaleData) {
 resetCart(); setSale(saleData); setReceiptOpen(true); router.reload({ only: ['products', 'sales_today', 'totals_today'] }); 
}

    function handleReceiptClose() {
 setReceiptOpen(false); setSale(null); 
}

    const dateStr = new Date().toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', });

    return (
        <>
            <Head title="Caja" />

            <div className="h-full overflow-hidden bg-slate-50/70 px-3 py-3 text-sm sm:px-4 dark:bg-neutral-950">
                <div className="mx-auto flex h-full min-h-0 w-full max-w-[1800px] flex-col gap-3">
                    <div className="grid min-h-0 flex-1 grid-cols-1 grid-rows-[minmax(0,1fr)_auto] gap-3 lg:grid-cols-[minmax(0,1fr)_360px] lg:grid-rows-1 xl:grid-cols-[minmax(0,1fr)_390px]">
                        <main className="flex min-h-0 min-w-0 flex-col gap-3">
                            <ProductFilters categories={categories} categoryFilter={categoryFilter} searchQuery={searchQuery} onCategoryChange={setCategoryFilter} onSearchChange={setSearchQuery} />

                            <div className="min-h-0 flex-1 overflow-y-auto pr-1">
                                {filteredProducts.length === 0 ? (
                                    <div className="flex min-h-full flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white px-4 text-center text-slate-500 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400">
                                        <Package className="mb-3 size-10 opacity-30" />
                                        <p className="text-sm font-semibold">
                                            No se encontraron productos.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 gap-2 pb-2 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                                        {filteredProducts.map((product) => (
                                            <ProductCard key={product.id} product={product} getCartQty={getCartQty} onAddSimple={addToCart} onAddVariant={addVariantToCart} />
                                        ))}
                                    </div>
                                )}
                            </div>
                        </main>

                        <aside className="min-h-0 min-w-0 lg:h-full">
                            <CheckoutPanel cart={cart} igvApplied={igvApplied} onIgvChange={setIgvApplied} onUpdateQty={updateQty} onRemove={removeFromCart} onCheckout={() => setCheckoutOpen(true)} onSalida={() => setSalidaOpen(true)} />
                        </aside>
                    </div>
                </div>
            </div>

            {checkoutOpen && (
                <CheckoutDialog open={checkoutOpen} cart={cart} igvApplied={igvApplied} onOpenChange={setCheckoutOpen} onSuccess={handleCheckoutSuccess} />
            )}

            {salidaOpen && (
                <CajaSalidaDialog open={salidaOpen} onOpenChange={setSalidaOpen} />
            )}

            {receiptOpen && sale && (
                <SaleReceiptDialog open={receiptOpen} sale={sale} onOpenChange={handleReceiptClose} />
            )}
        </>
    );
}

CajaIndex.layout = { breadcrumbs: [{ title: 'Caja', href: '/caja' }] };
