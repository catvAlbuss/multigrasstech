import type { Auth, TenantShared } from '@/types/auth';
import type { AppNotifications } from '@/types/navigation';

declare module 'react' {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    interface InputHTMLAttributes<T> {
        passwordrules?: string;
    }
}

declare module '@inertiajs/core' {
    export interface InertiaConfig {
        sharedPageProps: {
            name: string;
            auth: Auth;
            tenant: TenantShared;
            sidebarOpen: boolean;
            notifications: AppNotifications;
            [key: string]: unknown;
        };
    }
}
