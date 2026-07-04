import { Link, usePage } from '@inertiajs/react';
import {
    AlertCircle,
    Bell,
    CalendarCheck,
    CalendarClock,
    CheckCircle2,
    Crown,
    Info,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Breadcrumbs } from '@/components/breadcrumbs';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SidebarTrigger } from '@/components/ui/sidebar';
import type {
    AppNotification,
    AppNotifications,
    Auth,
    BreadcrumbItem as BreadcrumbItemType,
    TenantShared,
} from '@/types';

const PLAN_LABELS: Record<string, string> = {
    basic: 'Basic',
    premium: 'Premium',
    contact: 'Contáctenos',
    pro: 'Pro',
    enterprise: 'Enterprise',
};

export function AppSidebarHeader({
    breadcrumbs = [],
}: {
    breadcrumbs?: BreadcrumbItemType[];
}) {
    const { auth, notifications, tenant } = usePage<{
        auth: Auth;
        notifications: AppNotifications;
        tenant: TenantShared;
    }>().props;
    const role = auth.roles[0] ?? '';

    return (
        <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-white/10 bg-slate-950 px-4 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
            <div className="flex min-w-0 items-center gap-3">
                <SidebarTrigger className="size-8 border border-white/10 bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white" />
                <Breadcrumbs breadcrumbs={breadcrumbs} />
            </div>

            <div className="flex shrink-0 items-center gap-2">
                <PlanBadge role={role} tenant={tenant} />
                <HeaderClock />
                <NotificationCenter notifications={notifications} />
            </div>
        </header>
    );
}

function PlanBadge({ role, tenant }: { role: string; tenant: TenantShared }) {
    if (!tenant) {
        return null;
    }

    const roleLabel =
        role === 'admin'
            ? 'Administrador'
            : role === 'operator'
              ? 'Operador'
              : 'Visualizador';

    return (
        <div className="hidden items-center gap-2 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-sm font-semibold text-emerald-300 shadow-sm md:flex">
            <Crown className="size-4" />
            <span>{roleLabel}</span>
            <span className="text-emerald-500/70">·</span>
            <span>Plan {PLAN_LABELS[tenant.plan] ?? tenant.plan}</span>
        </div>
    );
}

function HeaderClock() {
    // `now` starts as null so the first client render (used for SSR hydration)
    // matches the server's render exactly. The real clock is filled in after
    // mount, since `new Date()` (and even ICU AM/PM spacing) differs between
    // the Node SSR process and the browser and would otherwise throw a
    // hydration mismatch.
    const [now, setNow] = useState<Date | null>(null);

    useEffect(() => {
        setNow(new Date());

        const interval = window.setInterval(() => {
            setNow(new Date());
        }, 30000);

        return () => window.clearInterval(interval);
    }, []);

    const date = now
        ? new Intl.DateTimeFormat('es-PE', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
          }).format(now)
        : '';
    const time = now
        ? new Intl.DateTimeFormat('es-PE', {
              hour: 'numeric',
              minute: '2-digit',
              hour12: true,
          })
              .format(now)
              .toLowerCase()
        : '';

    return (
        <div className="hidden items-center gap-2 rounded-md border border-white/10 bg-slate-900/80 px-3 py-1.5 text-sm text-slate-200 shadow-sm sm:flex">
            <CalendarClock className="size-4 text-emerald-300" />
            <span className="font-medium">{date}</span>
            <span className="text-slate-500">·</span>
            <span className="font-mono text-xs text-slate-300">{time}</span>
        </div>
    );
}

function NotificationCenter({
    notifications,
}: {
    notifications?: AppNotifications;
}) {
    const items = notifications?.items ?? [];
    const unreadCount = notifications?.unread_count ?? 0;
    const hasUnread = unreadCount > 0;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button
                    className="relative flex size-9 items-center justify-center rounded-md border border-white/10 bg-slate-900/80 text-slate-300 shadow-sm transition-colors hover:bg-slate-800 hover:text-white"
                    type="button"
                    aria-label="Abrir notificaciones"
                >
                    <Bell className="size-4" />
                    {hasUnread && (
                        <span className="absolute -top-1 -right-1 flex min-w-4 items-center justify-center rounded-full bg-emerald-400 px-1 text-[10px] leading-4 font-bold text-slate-950 ring-2 ring-slate-950">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    )}
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
                align="end"
                className="w-86 border-white/10 bg-slate-950 p-0 text-slate-100 shadow-2xl"
            >
                <div className="flex items-center justify-between gap-3 px-4 py-3">
                    <div>
                        <DropdownMenuLabel className="p-0 text-sm font-semibold text-white">
                            Notificaciones
                        </DropdownMenuLabel>
                        <p className="text-xs text-slate-400">
                            Actividad importante de la operación
                        </p>
                    </div>
                    <span className="rounded-full bg-emerald-400/10 px-2 py-1 text-xs font-medium text-emerald-300">
                        {unreadCount} nuevas
                    </span>
                </div>
                <DropdownMenuSeparator className="bg-white/10" />

                <div className="max-h-96 overflow-y-auto p-2">
                    {items.length === 0 ? (
                        <div className="flex flex-col items-center justify-center px-6 py-8 text-center">
                            <div className="mb-3 flex size-10 items-center justify-center rounded-full bg-slate-900 text-slate-400">
                                <Bell className="size-5" />
                            </div>
                            <p className="text-sm font-medium text-white">
                                Sin notificaciones
                            </p>
                            <p className="mt-1 text-xs text-slate-400">
                                Aquí aparecerán reservas, alertas de caja, stock
                                y mensajes del sistema.
                            </p>
                        </div>
                    ) : (
                        items.map((notification) => (
                            <NotificationItem
                                key={notification.id}
                                notification={notification}
                            />
                        ))
                    )}
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

function NotificationItem({ notification }: { notification: AppNotification }) {
    const Icon = notificationIcon(notification.type);
    const content = (
        <>
            <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-slate-900 text-emerald-300">
                <Icon className="size-4" />
            </div>
            <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                    <p className="truncate text-sm font-semibold text-white">
                        {notification.title}
                    </p>
                    {!notification.read && (
                        <span className="mt-1.5 size-2 shrink-0 rounded-full bg-emerald-400" />
                    )}
                </div>
                <p className="mt-0.5 line-clamp-2 text-xs text-slate-400">
                    {notification.body}
                </p>
            </div>
        </>
    );

    if (notification.href) {
        return (
            <DropdownMenuItem asChild>
                <Link
                    href={notification.href}
                    className="flex cursor-pointer items-start gap-3 rounded-md px-3 py-3 outline-hidden transition-colors hover:bg-white/5"
                >
                    {content}
                </Link>
            </DropdownMenuItem>
        );
    }

    return (
        <DropdownMenuItem className="flex cursor-default items-start gap-3 rounded-md px-3 py-3 focus:bg-white/5">
            {content}
        </DropdownMenuItem>
    );
}

function notificationIcon(type: AppNotification['type']) {
    if (type === 'success') {
        return CheckCircle2;
    }

    if (type === 'error') {
        return AlertCircle;
    }

    if (type === 'reservation') {
        return CalendarCheck;
    }

    return Info;
}
