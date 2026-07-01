import type { CalendarDay, PublicField } from '@/types/tenant';
import type { CalendarCell, FieldMeta } from '@/types/welcome';

export const DEFAULT_HERO =
    'https://images.unsplash.com/photo-1556056504-5c7696c4c28d?auto=format&fit=crop&w=1800&q=85';

export const MONTHS_ES = [
    'Enero',
    'Febrero',
    'Marzo',
    'Abril',
    'Mayo',
    'Junio',
    'Julio',
    'Agosto',
    'Septiembre',
    'Octubre',
    'Noviembre',
    'Diciembre',
];

export const WEEKDAYS = ['LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB', 'DOM'];

export const SPORT_LABELS: Record<string, string> = {
    futbol: 'Futbol',
    voley: 'Voleibol',
    basketball: 'Basquetbol',
    padel: 'Padel',
    tennis: 'Tenis',
    natacion: 'Natacion',
    multisport: 'Multideporte',
};

export const SURFACE_LABELS: Record<string, string> = {
    artificial: 'Grass Artificial',
    grass: 'Grass Natural',
    concrete: 'Concreto',
    clay: 'Arcilla',
};

export const QUICK_DAYS = ['Hoy', 'Manana', 'Fin de semana'];
export const QUICK_TIMES = ['Manana', 'Tarde', 'Noche'];

export function buildCalendarGrid(
    monthStr: string,
    days: CalendarDay[],
): CalendarCell[] {
    const [year, month] = monthStr.split('-').map(Number);
    const firstDow = (new Date(year, month - 1, 1).getDay() + 6) % 7;
    const lastDay = new Date(year, month, 0).getDate();

    const statusMap: Record<string, CalendarDay['status']> = {};
    days.forEach((day) => {
        statusMap[day.date] = day.status;
    });

    const cells: CalendarCell[] = Array.from({ length: firstDow }, () => ({
        day: null,
        date: null,
        status: null,
    }));

    for (let day = 1; day <= lastDay; day++) {
        const date = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        cells.push({
            day,
            date,
            status: statusMap[date] ?? 'available',
        });
    }

    while (cells.length % 7 !== 0) {
        cells.push({ day: null, date: null, status: null });
    }

    return cells;
}

export function monthLabel(monthStr: string): string {
    const [year, month] = monthStr.split('-').map(Number);

    return `${MONTHS_ES[month - 1]} ${year}`;
}

export function shiftMonth(monthStr: string, delta: number): string {
    const [year, month] = monthStr.split('-').map(Number);
    const date = new Date(year, month - 1 + delta, 1);

    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function getCurrentMonth(): string {
    const today = new Date();

    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
}

export function isToday(date: string | null): boolean {
    if (!date) {
        return false;
    }

    const today = new Date();
    const todayIso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    return date === todayIso;
}

export function getFieldMeta(field: PublicField): FieldMeta {
    const sportLabel = field.sport_type
        ? (SPORT_LABELS[field.sport_type] ?? field.sport_type)
        : null;
    const surfaceLabel =
        SURFACE_LABELS[field.surface_type] ?? field.surface_type;

    return {
        label: sportLabel ?? surfaceLabel,
        price: `S/ ${Number(field.hourly_rate).toFixed(0)}/hr`,
    };
}

export function getFeaturedField(fields: PublicField[]): PublicField | null {
    return (
        fields.find((field) => field.is_featured) ??
        fields[0] ??
        null
    );
}
