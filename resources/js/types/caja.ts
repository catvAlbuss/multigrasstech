import type { ProductVariant, TenantReservation } from './tenant';

export type CajaProduct = {
    id: number;
    name: string;
    sku: string | null;
    category: string;
    unit: string | null;
    price: string | null;
    stock: number | null;
    igv_type: 'gravado' | 'exonerado' | 'inafecto';
    has_variants: boolean;
    image_url?: string | null;
    variants?: ProductVariant[];
};

export type CartItem = {
    product_id: number;
    product_variant_id?: number | null;
    name: string;
    sku: string | null;
    unit: string;
    unit_price: number;
    igv_type: 'gravado' | 'exonerado' | 'inafecto';
    quantity: number;
    stock: number;
};

export type SaleItemData = {
    id: number;
    product_name: string;
    product_sku: string | null;
    unit: string;
    quantity: number;
    unit_price: number;
    unit_price_base: number;
    igv_type: string;
    igv_amount: number;
    subtotal: number;
    total: number;
};

export type SaleData = {
    id: number;
    sale_number: string;
    document_type: 'boleta' | 'factura';
    customer_doc_type: string;
    customer_doc_number: string | null;
    customer_name: string;
    customer_address: string | null;
    customer_email: string | null;
    igv_applied: boolean;
    subtotal: number;
    igv_amount: number;
    total: number;
    payment_amount: number;
    change_amount: number;
    notes: string | null;
    sold_at: string;
    items: SaleItemData[];
};

export type CheckoutFormData = {
    document_type: 'boleta' | 'factura';
    customer_doc_type: 'dni' | 'ruc' | 'pasaporte' | 'sin_documento';
    customer_doc_number: string;
    customer_name: string;
    customer_address: string;
    customer_email: string;
    igv_applied: boolean;
    payment_amount: string;
    notes: string;
};

export type CajaExpenseTransaction = {
    id: number;
    type: 'expense';
    category: string;
    description: string;
    amount: string;
    date: string;
    notes?: string | null;
};

export type CajaSaleToday = {
    id: number;
    sale_number: string;
    document_type: string;
    customer_name: string;
    total: string;
    sold_at: string;
};

export type CajaIndexPageProps = {
    products: CajaProduct[];
    sales_today: CajaSaleToday[];
    expenses_today: CajaExpenseTransaction[];
    pending_reservation?: TenantReservation | null;
    pending_reservation_intent?: 'advance' | 'full' | null;
    totals_today: {
        income: number;
        expense: number;
        balance: number;
        sales_count: number;
    };
};
