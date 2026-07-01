import { useMemo, useState } from 'react';
import {
    buildCalendarGrid,
    getCurrentMonth,
    shiftMonth,
} from '@/lib/welcome';
import type { CalendarDay, TenantCalendarData } from '@/types/tenant';

export type DayDetailSlot = {
    start_time: string;
    end_time: string;
    status: 'pending' | 'confirmed';
};

export type DayDetailField = {
    field_name: string;
    slots: DayDetailSlot[];
};

export type DayDetail = {
    date: string;
    reservations: DayDetailField[];
};

export function useWelcomeCalendar(calendar: TenantCalendarData) {
    const [month, setMonth] = useState(calendar.month);
    const [days, setDays] = useState(calendar.days);
    const [loading, setLoading] = useState(false);
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [dayDetail, setDayDetail] = useState<DayDetail | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);

    const grid = useMemo(() => buildCalendarGrid(month, days), [month, days]);

    async function loadMonth(targetMonth: string) {
        setLoading(true);

        try {
            const response = await fetch(`/calendar?month=${targetMonth}`);
            const data = (await response.json()) as {
                month: string;
                days: CalendarDay[];
            };
            setMonth(data.month);
            setDays(data.days);
        } finally {
            setLoading(false);
        }
    }

    async function selectDay(
        date: string | null,
        status: CalendarDay['status'] | null,
    ) {
        if (!date || status === 'available') {
            setSelectedDate(null);
            setDayDetail(null);

            return;
        }

        if (selectedDate === date) {
            setSelectedDate(null);
            setDayDetail(null);

            return;
        }

        setSelectedDate(date);
        setDayDetail(null);
        setDetailLoading(true);

        try {
            const response = await fetch(`/calendar/day?date=${date}`);
            const data = (await response.json()) as DayDetail;
            setDayDetail(data);
        } finally {
            setDetailLoading(false);
        }
    }

    async function navigate(delta: number) {
        setSelectedDate(null);
        setDayDetail(null);
        await loadMonth(shiftMonth(month, delta));
    }

    async function goToday() {
        const todayMonth = getCurrentMonth();
        setSelectedDate(null);
        setDayDetail(null);

        if (month === todayMonth) {
return;
}

        await loadMonth(todayMonth);
    }

    return {
        days,
        dayDetail,
        detailLoading,
        grid,
        loading,
        month,
        selectedDate,
        goToday,
        navigate,
        selectDay,
        setDays,
        setMonth,
    };
}
