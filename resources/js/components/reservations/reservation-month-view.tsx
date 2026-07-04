import { endOfMonth, format, parseISO, startOfMonth } from 'date-fns';
import { useEffect, useState } from 'react';
import type { DayButtonProps } from 'react-day-picker';
import { Calendar } from '@/components/ui/calendar';
import type { CalendarSummaryDay } from '@/types/tenant';

export function ReservationMonthView({
    selectedDate,
    onSelectDate,
}: {
    selectedDate: string;
    onSelectDate: (date: string) => void;
}) {
    const [visibleMonth, setVisibleMonth] = useState(() => startOfMonth(parseISO(selectedDate)));
    const [summary, setSummary] = useState<Record<string, CalendarSummaryDay>>({});
    const monthKey = format(visibleMonth, 'yyyy-MM');

    useEffect(() => {
        const from = format(startOfMonth(visibleMonth), 'yyyy-MM-dd');
        const to = format(endOfMonth(visibleMonth), 'yyyy-MM-dd');
        const url = new URL('/reservations/calendar-summary', window.location.origin);
        url.searchParams.set('from', from);
        url.searchParams.set('to', to);

        fetch(url)
            .then((res) => res.json())
            .then((rows: CalendarSummaryDay[]) => {
                const map: Record<string, CalendarSummaryDay> = {};
                rows.forEach((row) => {
                    map[row.date] = row;
                });
                setSummary(map);
            })
            .catch(() => setSummary({}));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [monthKey]);

    function DayButtonWithBadge(props: DayButtonProps) {
        const { day, modifiers, className, ...buttonProps } = props;
        void modifiers;
        const dateStr = format(day.date, 'yyyy-MM-dd');
        const info = summary[dateStr];

        return (
            <button className={`relative ${className ?? ''}`} {...buttonProps}>
                {buttonProps.children}
                {info && info.total > 0 && (
                    <span className="absolute bottom-1 left-1/2 size-1.5 -translate-x-1/2 rounded-full bg-emerald-400" />
                )}
            </button>
        );
    }

    return (
        <Calendar
            mode="single"
            selected={parseISO(selectedDate)}
            month={visibleMonth}
            onMonthChange={setVisibleMonth}
            onSelect={(date) => date && onSelectDate(format(date, 'yyyy-MM-dd'))}
            components={{ DayButton: DayButtonWithBadge }}
            className="mx-auto max-w-full text-slate-100"
        />
    );
}
