import { Link, usePage } from '@inertiajs/react';
import {
    BarChart3,
    Building2,
    CalendarDays,
    CreditCard,
    DollarSign,
    LayoutDashboard,
    LayoutGrid,
    Package,
    Sparkles,
    UserCheck,
    UserCog,
    Users,
    Wallet,
} from 'lucide-react';
import AppLogo from '@/components/app-logo';
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
            {
                title: 'Reservaciones',
                href: reservationsIndex().url,
                icon: CalendarDays,
            },
            { title: 'Campos', href: fieldsIndex().url, icon: LayoutGrid },
            { title: 'Clientes', href: clientsIndex().url, icon: Users },
            { title: 'Productos', href: productsIndex().url, icon: Package },
            { title: 'Finanzas', href: transactionsIndex().url, icon: DollarSign },
            { title: 'Asistencia', href: attendanceIndex().url, icon: UserCheck },
            { title: 'Reportes', href: reportsIndex().url, icon: BarChart3 },
        ];
    }

    if (role === 'operator') {
        return [
            home,
            { title: 'Campos', href: fieldsIndex().url, icon: LayoutGrid },
            {
                title: 'Reservaciones',
                href: reservationsIndex().url,
                icon: CalendarDays,
            },
            { title: 'Asistencia', href: attendanceIndex().url, icon: UserCheck },
        ];
    }

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
        <Sidebar
            collapsible="icon"
            variant="inset"
            className="border-r border-white/10 bg-slate-950/95 p-0 backdrop-blur-xl [&_[data-sidebar=sidebar]]:border-r [&_[data-sidebar=sidebar]]:border-white/10 [&_[data-sidebar=sidebar]]:bg-slate-950/95"
        >
            <SidebarHeader className="px-4 pt-5 pb-4">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            size="lg"
                            asChild
                            className="h-14 rounded-xl px-2 text-slate-100 hover:bg-emerald-500/10 hover:text-white">
                            <Link href={homeHref} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent className="gap-4 px-0">
                <NavMain items={mainNavItems} />

                {!isSuperAdmin && (
                    <div className="mx-4 mt-auto overflow-hidden rounded-lg border border-emerald-500/20 bg-[linear-gradient(180deg,rgba(16,185,129,0.12),rgba(15,23,42,0.72))] p-3 text-slate-200 shadow-[0_18px_48px_rgba(0,0,0,0.28)] group-data-[collapsible=icon]:hidden">
                        <div className="mb-2 flex size-9 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-300">
                            <Sparkles className="size-4" />
                        </div>
                        <p className="text-sm font-black text-emerald-300">
                            Impulsa tu rendimiento
                        </p>
                        <p className="mt-1 text-xs leading-5 text-slate-400">
                            Gestiona tu complejo con una operación ordenada.
                        </p>
                    </div>
                )}
            </SidebarContent>

            <SidebarFooter className="border-t border-white/10 p-3">
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
