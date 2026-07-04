import { AppContent } from '@/components/app-content';
import { AppShell } from '@/components/app-shell';
import { AppSidebar } from '@/components/app-sidebar';
import { AppSidebarHeader } from '@/components/app-sidebar-header';
import type { AppLayoutProps } from '@/types';

export default function AppSidebarLayout({
    children,
    breadcrumbs = [],
}: AppLayoutProps) {
    return (
        <AppShell
            variant="sidebar"
            className="bg-slate-950 text-slate-100 [--sidebar:222_47%_4%] [--sidebar-accent:145_65%_16%] [--sidebar-accent-foreground:150_90%_92%] [--sidebar-border:148_34%_18%] [--sidebar-foreground:210_20%_92%] [--sidebar-primary:145_78%_42%] [--sidebar-primary-foreground:0_0%_100%]"
        >
            <AppSidebar />
            <AppContent
                variant="sidebar"
                className="relative overflow-x-hidden bg-slate-950 text-slate-100 before:pointer-events-none before:fixed before:inset-0 before:z-0 before:bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.16),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.12),transparent_30%)]"
            >
                <AppSidebarHeader breadcrumbs={breadcrumbs} />
                <div className="relative z-10 flex min-h-0 flex-1 flex-col">
                    {children}
                </div>
            </AppContent>
        </AppShell>
    );
}
