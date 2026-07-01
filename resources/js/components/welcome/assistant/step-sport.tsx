import { SPORT_LABELS } from '@/lib/welcome';
import type { BotForm, UpdateForm } from './types';
import { ChoiceButton, ChoiceGrid, NextButton } from './ui';

export function StepSport({
    form,
    sports,
    update,
    onNext,
}: {
    form: BotForm;
    sports: string[];
    update: UpdateForm;
    onNext: () => void;
}) {
    return (
        <>
            <p className="text-xs text-slate-500">Selecciona el deporte que vas a practicar.</p>
            <ChoiceGrid>
                {(sports.length ? sports : ['futbol']).map((sport) => (
                    <ChoiceButton
                        key={sport}
                        active={form.sport_type === sport}
                        onClick={() => {
                            update('sport_type', sport);
                            update('field_id', '');
                        }}
                    >
                        {SPORT_LABELS[sport] ?? sport}
                    </ChoiceButton>
                ))}
            </ChoiceGrid>
            <NextButton disabled={!form.sport_type} onClick={onNext} />
        </>
    );
}
