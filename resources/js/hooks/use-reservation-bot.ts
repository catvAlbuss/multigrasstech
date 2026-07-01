import { useMemo, useState } from 'react';
import { getFeaturedField, getFieldMeta } from '@/lib/welcome';
import type { PublicField } from '@/types/tenant';
import type { ReservationBotState } from '@/types/welcome';

export function useReservationBot(fields: PublicField[]) {
    const recommendedField = useMemo(() => getFeaturedField(fields), [fields]);
    const [state, setState] = useState<ReservationBotState>({
        open: false,
        step: 'field',
        selectedFieldId: recommendedField?.id ?? null,
        selectedDay: 'Hoy',
        selectedTime: 'Noche',
    });

    const selectedField = useMemo(
        () =>
            fields.find((field) => field.id === state.selectedFieldId) ??
            recommendedField,
        [fields, recommendedField, state.selectedFieldId],
    );

    const recommendation = useMemo(() => {
        if (!selectedField) {
            return {
                field: null,
                summary: 'Elige un campo para preparar tu reserva.',
            };
        }

        const meta = getFieldMeta(selectedField);

        return {
            field: selectedField,
            summary: `${selectedField.name} · ${meta.label} · ${meta.price}`,
        };
    }, [selectedField]);

    return {
        recommendedField,
        recommendation,
        selectedField,
        state,
        setState,
    };
}
