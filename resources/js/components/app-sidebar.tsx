import { Link, usePage } from '@inertiajs/react';
import {
    BarChart3,
    BookOpen,
    Building2,
    CalendarDays,
    CreditCard,
    DollarSign,
    FolderGit2,
    LayoutDashboard,
    LayoutGrid,
    Package,
    UserCheck,
    UserCog,
    Users,
    Wallet,
    Workflow,
} from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { dashboard as adminDashboard } from '@/routes/admin';
import { index as adminPlansIndex } from '@/routes/admin/plans';
import { index as adminTenantsIndex } from '@/routes/admin/tenants';
import { index as attendanceIndex } from '@/routes/attendance';
import { index as clientsIndex } from '@/routes/clients';
import { index as fieldsIndex } from '@/routes/fields';
import { index as productsIndex } from '@/routes/products';
import { index as reportsIndex } from '@/routes/reports';
import { index as reservationsIndex } from '@/routes/reservations';
import { index as staffIndex } from '@/routes/staff/index';
import { dashboard } from '@/routes/tenant';
import { index as transactionsIndex } from '@/routes/transactions';
import type { Auth, NavItem } from '@/types';

function tenantNavByRole(role: string): NavItem[] {
    const home: NavItem = {
        title: 'Inicio',
        href: dashboard(),
        icon: LayoutDashboard,
    };

    if (role === 'admin') {
        return [
            home,
            { title: 'Personal', href: staffIndex().url, icon: UserCog },
            { title: 'Caja', href: '/caja', icon: Wallet },
            { title: 'Reservaciones', href: reservationsIndex().url, icon: CalendarDays },
            { title: 'Campos', href: fieldsIndex().url, icon: LayoutGrid },
            { title: 'Clientes', href: clientsIndex().url, icon: Users },
            { title: 'Productos', href: productsIndex().url, icon: Package },
            { title: 'Finanzas', href: transactionsIndex().url, icon: DollarSign },
            { title: 'Asistencia', href: attendanceIndex().url, icon: UserCheck },
            { title: 'Reportes', href: reportsIndex().url, icon: BarChart3 },
            // { title: 'n8n', href: '/reports/n8n', icon: Workflow },
        ];
    }

    if (role === 'operator') {
        return [
            home,
            { title: 'Campos', href: fieldsIndex().url, icon: LayoutGrid },
            { title: 'Reservaciones', href: reservationsIndex().url, icon: CalendarDays },
            { title: 'Asistencia', href: attendanceIndex().url, icon: UserCheck },
        ];
    }

    // viewer — solo dashboard
    return [home];
}

export function AppSidebar() {
    const { auth } = usePage<{ auth: Auth }>().props;
    const isSuperAdmin = auth.user.tenant_id === null;
    const role = auth.roles[0] ?? '';

    const homeHref = isSuperAdmin ? adminDashboard() : dashboard();

    const mainNavItems: NavItem[] = isSuperAdmin
        ? [
              {
                  title: 'Inicio',
                  href: adminDashboard(),
                  icon: LayoutDashboard,
              },
              { title: 'Empresas', href: adminTenantsIndex(), icon: Building2 },
              { title: 'Planes', href: adminPlansIndex(), icon: CreditCard },
          ]
        : tenantNavByRole(role);

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={homeHref} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
