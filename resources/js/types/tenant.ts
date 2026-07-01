import type { Paginated } from './pagination';

export type TenantFieldOption = {
    id: number;
    name: string;
    hourly_rate?: string;
    shared_group_id?: string | null;
};

export type TenantClientOption = {
    id: number;
    name: string;
    phone?: string | null;
};

export type TenantReservationOption = {
    id: number;
    code: string;
    client_id?: number | null;
    field_id?: number | null;
    start_time?: string;
    end_time?: string;
};

export type TenantDatedReservationOption = Pick<
    TenantReservationOption,
    'id' | 'code'
> & { date: string };

export type TenantAttendanceRecord = {
    id: number;
    date: string;
    check_in: string;
    check_out: string | null;
    notes: string | null;
    client: TenantClientOption | null;
    field: TenantFieldOption | null;
    reservation: Pick<TenantReservationOption, 'id' | 'code'> | null;
};

export type TenantClient = {
    id: number;
    name: string;
    email: string | null;
    phone: string | null;
    document_type: string | null;
    document_number: string | null;
    lookup_metadata: ClientLookupMetadata | null;
    is_active: boolean;
    image_url?: string | null;
};

export type ClientLookupMetadata = {
    source?: string | null;
    provider?: string | null;
    consulted_at?: string | null;
    status?: string | null;
    condition?: string | null;
    address?: string | null;
    ubigeo?: string | null;
};

export type ClientFormData = {
    name: string;
    email: string;
    phone: string;
    document_type: string;
    document_number: string;
    lookup_metadata: ClientLookupMetadata | null;
    notes: string;
    is_active: boolean;
    image?: File | null;
    remove_image?: boolean;
    _method?: 'put';
};

export type ClientLookupResponse = {
    source: 'database' | 'external';
    exists: boolean;
    client:
        | TenantClientEdit
        | (Pick<TenantClient, 'name' | 'document_type' | 'document_number'> & {
              metadata: ClientLookupMetadata;
          });
};

export type TenantClientEdit = TenantClient & { notes: string | null };

export type TenantClientListItem = TenantClient & {
    notes: string | null;
    reservations_count: number;
    created_at: string;
};

export type TenantField = {
    id: number;
    name: string;
    surface_type: string;
    sport_type: string | null;
    capacity: number;
    hourly_rate: string;
    status: string;
    is_featured: boolean;
    description: string | null;
    image_url?: string | null;
    shared_group_id?: string | null;
    shared_fields?: TenantField[];
};

export type ProductVariant = {
    id: number;
    product_id: number;
    label: string;
    sku: string | null;
    unit: string;
    price: string;
    stock: number;
    is_active: boolean;
    sort_order: number;
    image_url?: string | null;
};

export type TenantProduct = {
    id: number;
    name: string;
    sku: string | null;
    category: string;
    unit: string | null;
    stock: number | null;
    price: string | null;
    is_active: boolean;
    has_variants: boolean;
    description: string | null;
    igv_type: 'gravado' | 'exonerado' | 'inafecto';
    image_url?: string | null;
    variants?: ProductVariant[];
};

export type TenantReservation = {
    id: number;
    code: string;
    field_id?: number;
    client_id?: number | null;
    date: string;
    start_time: string;
    end_time: string;
    status: string;
    amount: string;
    payment_method?: 'yape' | 'plin' | null;
    advance_amount?: string | null;
    payment_operation_number?: string | null;
    payment_expires_at?: string | null;
    payment_proof_url?: string | null;
    notes?: string | null;
    field?: TenantFieldOption | null;
    client?: TenantClientOption | null;
};

export type TenantTransaction = {
    id: number;
    type: 'income' | 'expense';
    category: string;
    description: string;
    amount: string;
    date: string;
    reservation_id?: number | null;
    reservation?: Pick<TenantReservationOption, 'id' | 'code'> | null;
    notes?: string | null;
};

export type AttendanceCreatePageProps = {
    fields: TenantFieldOption[];
    clients: TenantClientOption[];
    reservations: TenantReservationOption[];
};

export type AttendanceIndexPageProps = {
    records: Paginated<TenantAttendanceRecord>;
    fields: TenantFieldOption[];
    filters: { search: string; date: string; field_id: string };
};

export type ClientsIndexPageProps = {
    clients: Paginated<TenantClientListItem>;
    filters: { search: string };
};

export type FieldsIndexPageProps = {
    fields: Paginated<TenantField>;
    filters: { search: string };
};

export type ProductsIndexPageProps = {
    products: Paginated<TenantProduct>;
    filters: { search: string; category: string };
};

export type ReservationFormPageProps = {
    fields: TenantFieldOption[];
    clients: TenantClientOption[];
};

export type ReservationEditPageProps = ReservationFormPageProps & {
    reservation: TenantReservation;
};

export type ReservationsIndexPageProps = {
    reservations: Paginated<TenantReservation>;
    filters: { search: string; status: string; date: string };
};

export type TransactionFormPageProps = {
    reservations: TenantDatedReservationOption[];
};

export type TransactionEditPageProps = TransactionFormPageProps & {
    transaction: TenantTransaction;
};

export type TransactionsIndexPageProps = {
    transactions: Paginated<TenantTransaction>;
    totals: { income: number; expense: number; balance: number };
    filters: { search: string; type: string; category: string; month: string };
};

export type ReportTopItem = { name: string; total_qty?: number; total_revenue?: number; total_reservations?: number; total_spent?: number };
export type ReportCategoryDist = { label: string; amount: number; pct: number };
export type ReportWeek = { label: string; income?: number; expense?: number; total?: number };
export type ReportHourDay = { name: string; reservas: number };

export type ReportStatusDist = { label: string; count: number; pct: number; color: string };

export type ExecutiveData = {
    totalIncome: number; totalExpenses: number; totalBalance: number;
    totalSales: number; totalResv: number; totalOtherIncome: number;
    uniqueClients: number;
    weeks: ReportWeek[];
    topProducts: ReportTopItem[]; topFields: ReportTopItem[]; topClients: ReportTopItem[];
    hoursData: ReportHourDay[]; daysData: ReportHourDay[];
    catDist: ReportCategoryDist[];
};

export type SalesData = {
    sales: Array<{ id: number; sale_number: string; document_type: string; customer_name: string; customer_doc_type: string; customer_doc_number: string; subtotal: number; igv_amount: number; total: number; sold_at: string }>;
    totalSales: number; totalIgv: number; totalSubtotal: number;
    boletasCount: number; facturasCount: number;
    topProducts: ReportTopItem[];
    dailySales: { date: string; total: number }[];
    docType: string;
};

export type ReservationsData = {
    reservations: Array<{ code: string; date: string; start_time: string; end_time: string; status: string; amount: number; field_name: string | null; client_name: string | null }>;
    totalRevenue: number; totalCount: number; completedCount: number; confirmedCount: number;
    pendingCount: number; cancelledCount: number; cancellationRate: number;
    byStatus: ReportStatusDist[]; topFields: ReportTopItem[]; topClients: ReportTopItem[];
};

export type ExpensesData = {
    expenses: Array<{ id: number; category: string; description: string; amount: number; date: string; notes: string | null }>;
    totalAmount: number; totalCount: number; avgAmount: number;
    byCategory: Array<{ category: string; count: number; total: number; pct: number }>;
    weeks: ReportWeek[];
};

export type ReportsPageProps = {
    reportType: 'executive' | 'sales' | 'reservations' | 'expenses';
    month: string;
    week: string | null;
    docType: string;
    period: { start: string; end: string };
    reportData: ExecutiveData | SalesData | ReservationsData | ExpensesData;
};

export type TenantProfileData = {
    tagline: string | null;
    description: string | null;
    phone: string | null;
    address: string | null;
    email: string | null;
    show_calendar: boolean;
    booking_start_time?: string;
    booking_end_time?: string;
    hero_images: string[];
    gallery_images: string[];
    payment_qr_url?: string | null;
};

export type PublicField = {
    id: number;
    name: string;
    description: string | null;
    surface_type: string;
    sport_type: string | null;
    hourly_rate: string;
    is_featured: boolean;
    capacity: number;
    image_url: string | null;
    shared_group_id?: string | null;
};

export type CalendarDayStatus = 'available' | 'pending' | 'occupied';

export type CalendarDay = {
    date: string;
    status: CalendarDayStatus;
};

export type TenantCalendarData = {
    month: string;
    days: CalendarDay[];
};

export type TenantWelcomePageProps = {
    profile: TenantProfileData | null;
    fields: PublicField[];
    calendar: TenantCalendarData;
};

export type * from './caja';
