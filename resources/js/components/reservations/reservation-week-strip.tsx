import { eachDayOfInterval, endOfWeek, format, isSameDay, isToday, parseISO, startOfWeek } from 'date-fns';
import { es } from 'date-fns/locale';
import { useEffect, useState } from 'react';
import type { CalendarSummaryDay } from '@/types/tenant';

function money(value: number) {
    return `S/ ${value.toLocaleString('es-PE', { maximumFractionDigits: 0 })}`;
}

export function ReservationWeekStrip({
    selectedDate,
    onSelectDate,
}: {
    selectedDate: string;
    onSelectDate: (date: string) => void;
}) {
    const anchor = parseISO(selectedDate);
    const weekStart = startOfWeek(anchor, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(anchor, { weekStartsOn: 1 });
    const weekStartStr = format(weekStart, 'yyyy-MM-dd');
    const weekEndStr = format(weekEnd, 'yyyy-MM-dd');
    const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

    const [summary, setSummary] = useState<Record<string, CalendarSummaryDay>>({});

    useEffect(() => {
        const url = new URL('/reservations/calendar-summary', window.location.origin);
        url.searchParams.set('from', weekStartStr);
        url.searchParams.set('to', weekEndStr);

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
    }, [weekStartStr, weekEndStr]);

    return (
        <div className="mb-3 grid grid-cols-7 gap-1.5">
            {days.map((day) => {
                const dateStr = format(day, 'yyyy-MM-dd');
                const info = summary[dateStr];
                const selected = isSameDay(day, anchor);

                return (
                    <button
                        key={dateStr}
                        type="button"
                        onClick={() => onSelectDate(dateStr)}
                        className={`flex flex-col items-center gap-1 rounded-md border px-1 py-2 text-center transition ${
                            selected
                                ? 'border-emerald-400 bg-emerald-500/15 text-emerald-100'
                                : 'border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/10'
                        }`}
                    >
                        <span className="text-[10px] font-black uppercase text-slate-500">
                            {format(day, 'EEE', { locale: es })}
                        </span>
                        <span
                            className={`text-base font-black sm:text-lg ${isToday(day) ? 'text-emerald-300' : ''}`}
                        >
                            {format(day, 'd')}
                        </span>
                        {info && info.total > 0 ? (
                            <>
                                <span className="rounded-full bg-emerald-500/20 px-1.5 text-[10px] font-black text-emerald-300">
                                    {info.total}
                                </span>
                                <span className="hidden text-[10px] text-slate-500 sm:block">
                                    {money(info.amount)}
                                </span>
                            </>
                        ) : (
                            <span className="text-[10px] text-slate-600">-</span>
                        )}
                    </button>
                );
            })}
        </div>
    );
}
