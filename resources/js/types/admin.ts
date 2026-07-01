import type { BillingPeriod } from '@/lib/plan-expiration';
import type { Paginated } from './pagination';

export type AdminPlan = {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    price: string | null;
    billing_period: BillingPeriod;
    is_active: boolean;
};

export type AdminPlanEdit = AdminPlan & { sort_order: number };

export type AdminPlanListItem = AdminPlan & { tenants_count: number };

export type AdminPlanOption = Pick<
    AdminPlan,
    'id' | 'name' | 'slug' | 'price' | 'billing_period'
>;

export type AdminTenant = {
    id: number;
    name: string;
    slug: string;
    email: string | null;
    phone: string | null;
    plan: string;
    plan_expires_at: string | null;
    is_active: boolean;
};

export type AdminTenantEdit = AdminTenant & { plan_id: number | null };

export type AdminTenantListItem = AdminTenant & {
    payment_plan: Pick<AdminPlan, 'name' | 'slug'> | null;
    created_at: string;
};

export type AdminDashboardTenant = Pick<
    AdminTenant,
    'id' | 'name' | 'slug' | 'plan' | 'is_active'
>;

export type AdminDashboardStats = {
    total_tenants: number;
    active_tenants: number;
    inactive_tenants: number;
    total_users: number;
    by_plan: Record<string, number>;
    recent_tenants: (AdminDashboardTenant & { created_at: string })[];
    top_tenants: (AdminDashboardTenant & { users_count: number })[];
};

export type AdminTenantsPageProps = {
    tenants: Paginated<AdminTenantListItem>;
    filters: { search: string };
    plans: Pick<AdminPlan, 'id' | 'name' | 'slug'>[];
};

export type AdminTenantEditPageProps = {
    tenant: AdminTenantEdit;
    plans: AdminPlanOption[];
};
