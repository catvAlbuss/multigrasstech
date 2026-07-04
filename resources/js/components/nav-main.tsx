import { Link } from '@inertiajs/react';
import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { useCurrentUrl } from '@/hooks/use-current-url';
import type { NavItem } from '@/types';

export function NavMain({
    items = [],
    label = 'Navegación',
}: {
    items: NavItem[];
    label?: string;
}) {
    const { isCurrentUrl } = useCurrentUrl();

    return (
        <SidebarGroup className="px-3 py-0">
            <SidebarGroupLabel className="px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
                {label}
            </SidebarGroupLabel>
            <SidebarMenu className="gap-1.5">
                {items.map((item) => {
                    const active = isCurrentUrl(item.href);

                    return item.disabled ? (
                        <SidebarMenuItem key={item.title}>
                            <SidebarMenuButton
                                className="h-11 cursor-not-allowed rounded-lg px-3 text-slate-500 opacity-60"
                                tooltip={{ children: 'Próximamente' }}
                            >
                                {item.icon && <item.icon className="size-5" />}
                                <span>{item.title}</span>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    ) : (
                        <SidebarMenuItem key={item.title}>
                            <SidebarMenuButton
                                asChild
                                isActive={active}
                                className="h-11 rounded-lg px-3 font-semibold text-slate-200 transition hover:bg-emerald-500/10 hover:text-emerald-300 data-[active=true]:border data-[active=true]:border-emerald-500/50 data-[active=true]:bg-emerald-500/15 data-[active=true]:text-emerald-300 data-[active=true]:shadow-[inset_0_0_0_1px_rgba(34,197,94,0.12)]"
                                tooltip={{ children: item.title }}
                            >
                                <Link href={item.href} prefetch>
                                    {item.icon && (
                                        <item.icon className="size-5" />
                                    )}
                                    <span>{item.title}</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    );
                })}
            </SidebarMenu>
        </SidebarGroup>
    );
}
