import { BadgeCheck, Database, LoaderCircle, Search, UserPlus, Users } from 'lucide-react';
import { useState } from 'react';
import { SearchableClientSelect } from '@/components/clients/searchable-client-select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type {
    ClientLookupResponse,
    ClientPickerValue,
    TenantClientOption,
} from '@/types/tenant';

type Tab = 'existing' | 'new';

interface ClientPickerProps {
    clients: TenantClientOption[];
    /** Derived from the comprobante: boleta → dni, factura → ruc. Not user-selectable — a boleta can't carry a RUC lookup and vice versa. */
    documentType: 'dni' | 'ruc';
    value: ClientPickerValue | null;
    onChange: (value: ClientPickerValue | null) => void;
}

const DOCUMENT_LENGTH: Record<'dni' | 'ruc', number> = { dni: 8, ruc: 11 };

export function ClientPicker({ clients, documentType, value, onChange }: ClientPickerProps) {
    const [tab, setTab] = useState<Tab>(value?.mode === 'existing' ? 'existing' : 'new');
    const [documentNumber, setDocumentNumber] = useState(
        value?.mode === 'new' ? (value.documentNumber ?? '') : '',
    );
    const [name, setName] = useState(value?.mode === 'new' ? value.name : '');
    const [phone, setPhone] = useState(value?.mode === 'new' ? value.phone : '');
    const [email, setEmail] = useState(value?.mode === 'new' ? (value.email ?? '') : '');
    const [looking, setLooking] = useState(false);
    const [lookupMessage, setLookupMessage] = useState<{
        type: 'found-db' | 'found-external' | 'error';
        text: string;
    } | null>(null);

    function selectExisting(client: TenantClientOption | null) {
        if (!client) {
            onChange(null);

            return;
        }

        onChange({ mode: 'existing', clientId: client.id, name: client.name, phone: client.phone });
    }

    function updateNew(patch: Partial<{ name: string; phone: string; email: string }>) {
        const nextName = patch.name ?? name;
        const nextPhone = patch.phone ?? phone;
        const nextEmail = patch.email ?? email;

        onChange({
            mode: 'new',
            name: nextName,
            phone: nextPhone,
            email: nextEmail || undefined,
            documentType,
            documentNumber: documentNumber || undefined,
        });
    }

    async function lookupDocument() {
        const digits = documentNumber.replace(/\D/g, '');

        if (digits.length !== DOCUMENT_LENGTH[documentType]) {
            setLookupMessage({
                type: 'error',
                text: `Ingresa un ${documentType === 'dni' ? 'DNI de 8' : 'RUC de 11'} dígitos.`,
            });

            return;
        }

        setLooking(true);
        setLookupMessage(null);

        try {
            const query = new URLSearchParams({ document_type: documentType, document_number: digits });
            const response = await fetch(`/clients/document-lookup?${query}`, {
                headers: { Accept: 'application/json' },
            });
            const payload = (await response.json()) as ClientLookupResponse & { message?: string };

            if (!response.ok) {
                throw new Error(payload.message ?? 'No fue posible consultar el documento.');
            }

            if (payload.exists && 'id' in payload.client) {
                const existing = payload.client;
                setTab('existing');
                onChange({
                    mode: 'existing',
                    clientId: existing.id,
                    name: existing.name,
                    phone: existing.phone,
                });
                setLookupMessage({
                    type: 'found-db',
                    text: `Cliente encontrado en tu base de datos: ${existing.name}.`,
                });

                return;
            }

            if ('metadata' in payload.client) {
                const found = payload.client;
                setName(found.name);
                updateNew({ name: found.name });
                setLookupMessage({
                    type: 'found-external',
                    text: `Validado en RENIEC/SUNAT: ${found.name}. Completa el teléfono para registrarlo.`,
                });

                return;
            }
        } catch (error) {
            setLookupMessage({
                type: 'error',
                text: error instanceof Error ? error.message : 'No fue posible consultar el documento.',
            });
        } finally {
            setLooking(false);
        }
    }

    return (
        <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
                <button
                    type="button"
                    onClick={() => setTab('existing')}
                    className={`flex h-9 items-center justify-center gap-1.5 rounded-md border text-xs font-bold transition ${
                        tab === 'existing'
                            ? 'border-green-500 bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400'
                            : 'border-gray-200 text-gray-600 hover:border-gray-300 dark:border-gray-700 dark:text-gray-300'
                    }`}
                >
                    <Users className="size-3.5" />
                    Elegir existente
                </button>
                <button
                    type="button"
                    onClick={() => {
                        setTab('new');
                        onChange(name ? { mode: 'new', name, phone, email: email || undefined, documentType, documentNumber: documentNumber || undefined } : null);
                    }}
                    className={`flex h-9 items-center justify-center gap-1.5 rounded-md border text-xs font-bold transition ${
                        tab === 'new'
                            ? 'border-green-500 bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400'
                            : 'border-gray-200 text-gray-600 hover:border-gray-300 dark:border-gray-700 dark:text-gray-300'
                    }`}
                >
                    <UserPlus className="size-3.5" />
                    Cliente nuevo
                </button>
            </div>

            {tab === 'existing' ? (
                <SearchableClientSelect
                    clients={clients}
                    selectedId={value?.mode === 'existing' ? String(value.clientId) : ''}
                    onSelect={selectExisting}
                />
            ) : (
                <div className="space-y-3">
                    <div className="rounded-lg border border-green-100 bg-green-50/60 p-3 dark:border-green-900 dark:bg-green-950/30">
                        <Label className="mb-1.5 block text-xs font-semibold text-green-800 dark:text-green-300">
                            Buscar por {documentType === 'dni' ? 'DNI' : 'RUC'}
                        </Label>
                        <div className="flex gap-2">
                            <Input
                                value={documentNumber}
                                onChange={(e) => setDocumentNumber(e.target.value.replace(/\D/g, ''))}
                                placeholder={documentType === 'dni' ? '8 dígitos' : '11 dígitos'}
                                maxLength={DOCUMENT_LENGTH[documentType]}
                                className="bg-background"
                            />
                            <button
                                type="button"
                                onClick={lookupDocument}
                                disabled={looking}
                                className="flex shrink-0 items-center gap-1.5 rounded-md border border-green-300 bg-white px-3 text-xs font-bold text-green-700 hover:bg-green-50 disabled:opacity-50 dark:border-green-800 dark:bg-transparent dark:text-green-400"
                            >
                                {looking ? (
                                    <LoaderCircle className="size-3.5 animate-spin" />
                                ) : (
                                    <Search className="size-3.5" />
                                )}
                                Buscar
                            </button>
                        </div>
                        {lookupMessage && (
                            <div className="mt-2 flex items-start gap-1.5 text-xs text-muted-foreground">
                                {lookupMessage.type === 'found-db' && (
                                    <Database className="mt-0.5 size-3.5 shrink-0 text-blue-600" />
                                )}
                                {lookupMessage.type === 'found-external' && (
                                    <BadgeCheck className="mt-0.5 size-3.5 shrink-0 text-green-600" />
                                )}
                                {lookupMessage.text}
                            </div>
                        )}
                    </div>

                    <div className="grid gap-2 sm:grid-cols-2">
                        <Input
                            value={name}
                            onChange={(e) => {
                                setName(e.target.value);
                                updateNew({ name: e.target.value });
                            }}
                            placeholder="Nombre"
                        />
                        <Input
                            value={phone}
                            onChange={(e) => {
                                setPhone(e.target.value);
                                updateNew({ phone: e.target.value });
                            }}
                            placeholder="Teléfono"
                        />
                        <Input
                            value={email}
                            onChange={(e) => {
                                setEmail(e.target.value);
                                updateNew({ email: e.target.value });
                            }}
                            placeholder="Email (opcional)"
                            type="email"
                            className="sm:col-span-2"
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
