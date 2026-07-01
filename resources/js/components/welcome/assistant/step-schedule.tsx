import type { BotForm, Slot, UpdateForm } from './types';
import { ChoiceButton, ChoiceGrid, NextButton } from './ui';

function formatShortDate(date: string) {
    return new Date(`${date}T00:00:00`).toLocaleDateString('es-PE', {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
    });
}

export function StepSchedule({
    availableSlots,
    dateOptions,
    form,
    totalAmount,
    update,
    onNext,
}: {
    availableSlots: Slot[];
    dateOptions: string[];
    form: BotForm;
    totalAmount: number;
    update: UpdateForm;
    onNext: () => void;
}) {
    const canContinue = availableSlots.some(
        (slot) => slot.start_time === form.start_time,
    );

    return (
        <>
            <div>
                <p className="mb-2 text-[10px] font-black tracking-wider text-slate-400 uppercase">
                    Fecha
                </p>
                <ChoiceGrid>
                    {dateOptions.map((date) => (
                        <ChoiceButton
                            key={date}
                            active={form.date === date}
                            onClick={() => {
                                update('date', date);
                                update('start_time', '');
                            }}
                        >
                            {formatShortDate(date)}
                        </ChoiceButton>
                    ))}
                </ChoiceGrid>
            </div>

            <div>
                <p className="mb-2 text-[10px] font-black tracking-wider text-slate-400 uppercase">
                    Hora de inicio
                </p>
                {availableSlots.length === 0 ? (
                    <p className="rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-700">
                        Sin horas libres para este dia. Elige otra fecha.
                    </p>
                ) : (
                    <div className="grid grid-cols-3 gap-2">
                        {availableSlots.slice(0, 12).map((slot) => (
                            <ChoiceButton
                                key={slot.start_time}
                                size="sm"
                                active={form.start_time === slot.start_time}
                                onClick={() => update('start_time', slot.start_time)}
                            >
                                {slot.start_time}
                            </ChoiceButton>
                        ))}
                    </div>
                )}
            </div>

            <div>
                <p className="mb-2 text-[10px] font-black tracking-wider text-slate-400 uppercase">
                    Duracion
                </p>
                <select
                    value={form.duration_hours}
                    onChange={(e) => {
                        update('duration_hours', e.target.value);
                        update('start_time', '');
                    }}
                    className="chat-input"
                >
                    {[1, 2, 3, 4, 5, 6].map((h) => (
                        <option key={h} value={h}>
                            {h} hora{h > 1 ? 's' : ''}
                        </option>
                    ))}
                </select>
            </div>

            {form.start_time && (
                <div className="rounded-xl bg-emerald-50 px-3 py-2 text-xs">
                    <span className="font-black text-emerald-800">
                        {form.date} · {form.start_time}
                    </span>
                    <span className="ml-2 text-emerald-600">
                        Total estimado: S/ {totalAmount.toFixed(2)}
                    </span>
                </div>
            )}

            <NextButton disabled={!canContinue} onClick={onNext} />
        </>
    );
}
