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
import { useCajaCart } from '@/hooks/use-caja-cart';
import { useCajaProducts } from '@/hooks/use-caja-products';
import type { CajaIndexPageProps as Props, SaleData } from '@/types/caja';

export default function CajaIndex({
    products,
    sales_today,
    expenses_today,
    staff,
    totals_today,
}: Props) {
    const { flash } = usePage<{ flash: { success?: string; error?: string } }>().props;

    const {
        cart,
        cartUnits,
        igvApplied,
        setIgvApplied,
        addToCart,
        addVariantToCart,
        updateQty,
        removeFromCart,
        getCartQty,
        resetCart,
    } = useCajaCart();

    const {
        categories,
        categoryFilter,
        filteredProducts,
        searchQuery,
        setCategoryFilter,
        setSearchQuery,
        variantsCount,
    } = useCajaProducts(products);

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
        resetCart();
        setSale(saleData);
        setReceiptOpen(true);
        router.reload({ only: ['products', 'sales_today', 'totals_today'] });
    }

    function handleReceiptClose() {
        setReceiptOpen(false);
        setSale(null);
    }

    const dateStr = new Date().toLocaleDateString('es-PE', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });

    return (
        <>
            <Head title="Caja" />

            <div className="flex min-h-[calc(100svh-4rem)] overflow-hidden px-3 py-3 text-sm text-slate-100 sm:px-4 lg:px-5">
                <div className="mx-auto flex min-h-0 w-full max-w-[1800px] flex-1 flex-col gap-3">
                    <CajaHeader
                        date={dateStr}
                        productsCount={products.length}
                        variantsCount={variantsCount}
                        cartUnits={cartUnits}
                        resultsCount={filteredProducts.length}
                        totalsToday={totals_today}
                        movementsCount={sales_today.length + expenses_today.length}
                    />

                    <div className="grid min-h-0 flex-1 grid-cols-1 grid-rows-[minmax(0,1fr)_auto] gap-3 lg:grid-cols-[minmax(0,1fr)_380px] lg:grid-rows-1 xl:grid-cols-[minmax(0,1fr)_410px]">
                        <main className="flex min-h-0 min-w-0 flex-col gap-3">
                            <ProductFilters
                                categories={categories}
                                categoryFilter={categoryFilter}
                                searchQuery={searchQuery}
                                onCategoryChange={setCategoryFilter}
                                onSearchChange={setSearchQuery}
                            />

                            <div className="min-h-0 flex-1 overflow-y-auto pr-1">
                                {filteredProducts.length === 0 ? (
                                    <div className="flex min-h-full flex-col items-center justify-center rounded-lg border border-dashed border-white/10 bg-white/[0.03] px-4 text-center text-slate-500">
                                        <Package className="mb-3 size-10 opacity-30" />
                                        <p className="text-sm font-semibold">
                                            No se encontraron productos.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 gap-3 pb-2 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                                        {filteredProducts.map((product) => (
                                            <ProductCard
                                                key={product.id}
                                                product={product}
                                                getCartQty={getCartQty}
                                                onAddSimple={addToCart}
                                                onAddVariant={addVariantToCart}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        </main>

                        <aside className="min-h-0 min-w-0 lg:h-full">
                            <CheckoutPanel
                                cart={cart}
                                igvApplied={igvApplied}
                                onIgvChange={setIgvApplied}
                                onUpdateQty={updateQty}
                                onRemove={removeFromCart}
                                onCheckout={() => setCheckoutOpen(true)}
                                onSalida={() => setSalidaOpen(true)}
                            />
                        </aside>
                    </div>
                </div>
            </div>

            {checkoutOpen && (
                <CheckoutDialog
                    open={checkoutOpen}
                    cart={cart}
                    igvApplied={igvApplied}
                    staff={staff}
                    onOpenChange={setCheckoutOpen}
                    onSuccess={handleCheckoutSuccess}
                />
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
