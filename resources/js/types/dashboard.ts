import type { LucideIcon } from 'lucide-react';
import type { Auth, TenantShared } from './auth';

export type DashboardTrend = {
    direction: 'up' | 'down' | 'flat';
    percentage: number;
    label: string;
    tone: 'positive' | 'negative' | 'neutral';
};

export type DashboardStats = {
    user_count: number;
    client_count: number;
    field_count: number;
    reservations_today: number;
    clients_today: number;
    monthly_revenue: number | null;
    monthly_expense: number | null;
    field_occupancy: {
        occupied: number;
        total: number;
        percentage: number;
    };
    trends: {
        monthly_revenue: DashboardTrend;
        monthly_expense: DashboardTrend;
        reservations_today: DashboardTrend;
        client_count: DashboardTrend;
        field_count: DashboardTrend;
        clients_today: DashboardTrend;
    };
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
        lineChartData: Array<{
            label: string;
            income: number;
            expense: number;
        }>;
        upcomingReservations: Array<{
            field: string;
            time: string;
            date: string;
            status?: string;
        }>;
        topProducts: Array<{
            name: string;
            units: number;
            amount: number;
            color: string;
        }>;
        recentActivity: Array<{ label: string; time: string; color: string }>;
        categoryDistribution: Array<{
            label: string;
            value: number;
            color: string;
            amount?: number;
        }>;
        reservationsBySport: Array<{
            label: string;
            value: number;
        }>;
        fieldUsage: Array<{
            name: string;
            reservations: number;
            percentage: number;
        }>;
    };
};

export type DashboardKpiCardProps = {
    label: string;
    value: string | number;
    detail: string;
    trend?: DashboardTrend;
    icon: LucideIcon;
    accent: string;
    progress?: number;
};
