import type { InertiaLinkProps } from '@inertiajs/react';
import type { LucideIcon } from 'lucide-react';

export type BreadcrumbItem = {
    title: string;
    href: NonNullable<InertiaLinkProps['href']>;
};

export type NavItem = {
    title: string;
    href: NonNullable<InertiaLinkProps['href']>;
    icon?: LucideIcon | null;
    isActive?: boolean;
    disabled?: boolean;
};

export type AppNotification = {
    id: string;
    type: 'success' | 'error' | 'reservation' | 'system';
    title: string;
    body: string;
    href: string | null;
    read: boolean;
    created_at: string;
};

export type AppNotifications = {
    items: AppNotification[];
    unread_count: number;
};
