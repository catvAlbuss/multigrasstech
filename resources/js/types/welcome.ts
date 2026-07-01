import type { Auth, TenantShared } from '@/types';
import type { CalendarDay, PublicField, TenantWelcomePageProps } from './tenant';

export type WelcomePageProps = TenantWelcomePageProps & {
    auth: Auth;
    tenant: TenantShared;
};

export type CalendarCell = {
    day: number | null;
    date: string | null;
    status: CalendarDay['status'] | null;
};

export type FieldMeta = {
    label: string;
    price: string;
};

export type ReservationBotStep = 'field' | 'day' | 'time';

export type ReservationBotState = {
    open: boolean;
    step: ReservationBotStep;
    selectedFieldId: number | null;
    selectedDay: string;
    selectedTime: string;
};

export type ReservationBotRecommendation = {
    field: PublicField | null;
    summary: string;
};
