import { Activity } from 'lucide-react';
import type { DashboardViewProps } from '@/types/dashboard';

export function DashboardHeader({
    auth,
    tenant,
}: Pick<DashboardViewProps, 'auth' | 'tenant' | 'role'>) {
    return (
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex items-center gap-4">
                <div className="hidden size-11 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-400/30 sm:flex">
                    <Activity className="size-6" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white">
                        Dashboard
                    </h1>
                    <p className="mt-1 text-sm text-slate-400">
                        Resumen general de {tenant.name}. Hola, {auth.user.name}
                        .
                    </p>
                </div>
            </div>
        </div>
    );
}
