import type { BotForm, UpdateForm } from './types';
import { NextButton } from './ui';

export function StepClient({
    form,
    lookupStatus,
    lookupLoading,
    update,
    onLookup,
    onNext,
}: {
    form: BotForm;
    lookupStatus: 'idle' | 'found' | 'missing';
    lookupLoading: boolean;
    update: UpdateForm;
    onLookup: () => void;
    onNext: () => void;
}) {
    const showManualFields = lookupStatus === 'found' || lookupStatus === 'missing';
    const canContinue = Boolean(
        form.document_number &&
            form.client_name &&
            form.client_phone &&
            showManualFields,
    );

    return (
        <>
            <div className="flex gap-2">
                <input
                    inputMode="numeric"
                    maxLength={8}
                    value={form.document_number}
                    onChange={(e) => {
                        update('document_type', 'dni');
                        update(
                            'document_number',
                            e.target.value.replace(/\D/g, '').slice(0, 8),
                        );
                    }}
                    className="chat-input"
                    placeholder="DNI de 8 digitos"
                    required
                />
                <button
                    type="button"
                    onClick={onLookup}
                    disabled={lookupLoading || form.document_number.length !== 8}
                    className="shrink-0 rounded-xl bg-emerald-600 px-3 text-xs font-black text-white disabled:bg-slate-300"
                >
                    {lookupLoading ? '...' : 'Buscar'}
                </button>
            </div>

            {showManualFields && (
                <>
                    <input
                        value={form.client_name}
                        onChange={(e) => update('client_name', e.target.value)}
                        className="chat-input"
                        placeholder="Nombres completos"
                        required
                    />
                    <div className="grid grid-cols-2 gap-2">
                        <input
                            value={form.client_phone}
                            onChange={(e) =>
                                update('client_phone', e.target.value)
                            }
                            className="chat-input"
                            placeholder="Celular"
                            required
                        />
                        <input
                            type="email"
                            value={form.client_email}
                            onChange={(e) =>
                                update('client_email', e.target.value)
                            }
                            className="chat-input"
                            placeholder="Correo (opcional)"
                        />
                    </div>
                </>
            )}

            {showManualFields && (
                <NextButton
                    disabled={!canContinue}
                    label="Continuar"
                    onClick={onNext}
                />
            )}
        </>
    );
}
