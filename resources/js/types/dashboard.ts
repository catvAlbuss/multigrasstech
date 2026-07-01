import type { LucideIcon } from 'lucide-react';
import type { Auth, TenantShared } from './auth';

export type DashboardStats = {
    user_count: number;
    field_count: number;
    reservations_today: number;
    clients_today: number;
    monthly_revenue: number | null;
};

export type DashboardViewProps = {
    auth: Auth;
    tenant: NonNullable<TenantShared>;
    stats: DashboardStats;
    role: string;
};

export type DashboardPageProps = {
    auth: Auth;
    tenant: TenantShared;
    stats: DashboardStats;
    real_data?: {
        lineChartData: Array<{ label: string; income: number; expense: number }>;
        upcomingReservations: Array<{ field: string; time: string; date: string }>;
        topProducts: Array<{ name: string; units: number; color: string }>;
        recentActivity: Array<{ label: string; time: string; color: string }>;
        categoryDistribution: Array<{ label: string; value: number; color: string }>;
    };
};

export type DashboardKpiCardProps = {
    label: string;
    value: string | number;
    detail: string;
    trend: 'up' | 'down';
    icon: LucideIcon;
    accent: string;
};
