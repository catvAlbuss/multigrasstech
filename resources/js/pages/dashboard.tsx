import { Head, router, usePage } from '@inertiajs/react';
import { useEffect } from 'react';
import type { ReactNode } from 'react';
import {
    AdminView,
    OperatorView,
    ViewerView,
} from '@/components/dashboard/dashboard-views';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes/tenant';
import type { DashboardPageProps as PageProps } from '@/types/dashboard';

export default function Dashboard({ stats, real_data }: PageProps) {
    const { auth, tenant } = usePage<PageProps>().props;
    const role = auth.roles[0] ?? '';

    useEffect(() => {
        const interval = setInterval(() => {
            router.reload({
                only: ['stats', 'real_data'],
            });
        }, 30000);

        return () => clearInterval(interval);
    }, []);

    if (!tenant) {
        return null;
    }

    const props = { auth, tenant, stats, role, real_data };

    return (
        <>
            <Head title="Dashboard" />
            {role === 'operator' ? (
                <OperatorView {...props} />
            ) : role === 'viewer' ? (
                <ViewerView {...props} />
            ) : (
                <AdminView {...props} />
            )}
        </>
    );
}

Dashboard.layout = (page: ReactNode) => (
    <AppLayout breadcrumbs={[{ title: 'Dashboard', href: dashboard() }]}>
        {page}
    </AppLayout>
);
