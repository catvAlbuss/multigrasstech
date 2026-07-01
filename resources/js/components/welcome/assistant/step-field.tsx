import { cn } from '@/lib/utils';
import { getFieldMeta, SPORT_LABELS, SURFACE_LABELS } from '@/lib/welcome';
import type { PublicField } from '@/types/tenant';
import type { BotForm, UpdateForm } from './types';
import { NextButton } from './ui';

export function StepField({
    filteredFields,
    form,
    update,
    onNext,
}: {
    filteredFields: PublicField[];
    form: BotForm;
    update: UpdateForm;
    onNext: () => void;
}) {
    const sportLabel = SPORT_LABELS[form.sport_type] ?? form.sport_type;

    return (
        <>
            <p className="text-xs text-slate-500">
                {filteredFields.length > 0
                    ? `Estas canchas estan configuradas para ${sportLabel}.`
                    : `No hay canchas configuradas para ${sportLabel}.`}
            </p>

            {filteredFields.length > 0 && (
                <div className="space-y-2">
                    {filteredFields.map((field) => {
                        const meta = getFieldMeta(field);
                        const isSelected = form.field_id === String(field.id);
                        const surfaceLabel =
                            SURFACE_LABELS[field.surface_type] ??
                            field.surface_type;

                        return (
                            <button
                                key={field.id}
                                type="button"
                                onClick={() =>
                                    update('field_id', String(field.id))
                                }
                                className={cn(
                                    'flex w-full items-center gap-3 rounded-xl border p-3 text-left transition',
                                    isSelected
                                        ? 'border-emerald-400 bg-emerald-50 shadow-sm'
                                        : 'border-slate-200 bg-white hover:border-emerald-300',
                                )}
                            >
                                {field.image_url ? (
                                    <img
                                        src={field.image_url}
                                        alt={field.name}
                                        className="size-11 shrink-0 rounded-lg object-cover"
                                    />
                                ) : (
                                    <div className="grid size-11 shrink-0 place-items-center rounded-lg bg-emerald-100">
                                        <span className="text-[9px] font-black text-emerald-700 uppercase">
                                            {surfaceLabel.slice(0, 5)}
                                        </span>
                                    </div>
                                )}

                                <div className="min-w-0 flex-1">
                                    <p className="text-xs font-black text-slate-900">
                                        {field.name}
                                    </p>
                                    <p className="mt-0.5 text-[10px] text-slate-500">
                                        {meta.price} - {meta.label}
                                        {field.shared_group_id
                                            ? ' - Compartido'
                                            : ''}
                                    </p>
                                </div>

                                {isSelected && (
                                    <span className="grid size-5 shrink-0 place-items-center rounded-full bg-emerald-500 text-[10px] font-black text-white">
                                        OK
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            )}

            <NextButton disabled={!form.field_id} onClick={onNext} />
        </>
    );
}
