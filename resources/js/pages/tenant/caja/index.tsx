import { Head, router, usePage } from '@inertiajs/react';
import { CalendarDays, Clock3, Package } from 'lucide-react';
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
    pending_reservation,
    pending_reservation_intent,
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
    const pendingReservationTotal = Number(pending_reservation?.amount ?? 0);
    const pendingReservationPaid = Number(pending_reservation?.advance_amount ?? 0);
    const pendingReservationBalance = Math.max(
        0,
        pendingReservationTotal - pendingReservationPaid,
    );

    function registerReservationPayment(type: 'advance' | 'full') {
        if (!pending_reservation) {
            return;
        }

        const amount =
            type === 'full'
                ? pendingReservationBalance
                : Math.max(1, pendingReservationTotal * 0.5);

        router.post(
            '/caja/reservation-payment',
            {
                reservation_id: pending_reservation.id,
                payment_type: type,
                amount,
            },
            { preserveScroll: true },
        );
    }

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

                    {pending_reservation && (
                        <section className="rounded-lg border border-emerald-400/30 bg-emerald-500/10 p-3 shadow-[0_18px_44px_rgba(0,0,0,0.2)] backdrop-blur">
                            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                                <div className="min-w-0">
                                    <p className="text-xs font-black uppercase tracking-wide text-emerald-300">
                                        Reserva lista para cobrar
                                    </p>
                                    <h2 className="mt-1 truncate text-lg font-black text-slate-50">
                                        {pending_reservation.field?.name ?? 'Cancha'} ·{' '}
                                        {pending_reservation.client?.name ?? 'Sin cliente'}
                                    </h2>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
                                    <span className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-slate-950/45 px-3 py-2 text-slate-300">
                                        <CalendarDays className="size-4 text-emerald-300" />
                                        {pending_reservation.date}
                                    </span>
                                    <span className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-slate-950/45 px-3 py-2 text-slate-300">
                                        <Clock3 className="size-4 text-emerald-300" />
                                        {pending_reservation.start_time.slice(0, 5)} -{' '}
                                        {pending_reservation.end_time.slice(0, 5)}
                                    </span>
                                    <span className="rounded-md border border-white/10 bg-slate-950/45 px-3 py-2 font-black text-emerald-300">
                                        S/{' '}
                                        {Number(pending_reservation.amount).toLocaleString(
                                            'es-PE',
                                            { minimumFractionDigits: 2 },
                                        )}
                                    </span>
                                    <span className="rounded-md border border-white/10 bg-slate-950/45 px-3 py-2 font-semibold text-slate-300">
                                        {pending_reservation.status}
                                    </span>
                                </div>
                                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:w-[360px]">
                                    <button
                                        type="button"
                                        onClick={() => registerReservationPayment('advance')}
                                        disabled={pendingReservationBalance <= 0}
                                        className={`h-10 rounded-md border px-3 text-sm font-black transition disabled:cursor-not-allowed disabled:opacity-50 ${
                                            pending_reservation_intent === 'advance'
                                                ? 'border-emerald-400 bg-emerald-500/20 text-emerald-100 ring-2 ring-emerald-400/40'
                                                : 'border-emerald-400/30 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/15'
                                        }`}
                                    >
                                        Cobrar adelanto
                                        {pending_reservation_intent === 'advance' && (
                                            <span className="ml-1.5 text-[10px] font-black uppercase text-emerald-300">
                                                Sugerido
                                            </span>
                                        )}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => registerReservationPayment('full')}
                                        disabled={pendingReservationBalance <= 0}
                                        className={`h-10 rounded-md px-3 text-sm font-black text-white transition disabled:cursor-not-allowed disabled:bg-slate-700 ${
                                            pending_reservation_intent === 'full'
                                                ? 'bg-emerald-500 ring-2 ring-emerald-300/60'
                                                : 'bg-emerald-500 hover:bg-emerald-400'
                                        }`}
                                    >
                                        Cobrar completo
                                        {pending_reservation_intent === 'full' && (
                                            <span className="ml-1.5 text-[10px] font-black uppercase text-emerald-100">
                                                Sugerido
                                            </span>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </section>
                    )}

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
