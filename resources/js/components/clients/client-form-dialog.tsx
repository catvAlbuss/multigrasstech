import { useForm } from '@inertiajs/react';
import {
    BadgeCheck,
    Database,
    Image as ImageIcon,
    LoaderCircle,
    Search,
    UserRoundPlus,
    X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import Swal from 'sweetalert2';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type {
    ClientFormData,
    ClientLookupResponse,
    TenantClientEdit,
} from '@/types/tenant';

const EMPTY_FORM: ClientFormData = {
    name: '',
    email: '',
    phone: '',
    document_type: 'dni',
    document_number: '',
    lookup_metadata: null,
    notes: '',
    is_active: true,
    image: null,
    remove_image: false,
};

function emptyForm(): ClientFormData {
    return { ...EMPTY_FORM };
}

function valuesFromClient(client: TenantClientEdit): ClientFormData {
    return {
        name: client.name,
        email: client.email ?? '',
        phone: client.phone ?? '',
        document_type: client.document_type ?? 'dni',
        document_number: client.document_number ?? '',
        lookup_metadata: client.lookup_metadata,
        notes: client.notes ?? '',
        is_active: client.is_active,
        image: null,
        remove_image: false,
    };
}

export function ClientFormDialog({
    open,
    client,
    onOpenChange,
}: {
    open: boolean;
    client: TenantClientEdit | null;
    onOpenChange: (open: boolean) => void;
}) {
    const form = useForm<ClientFormData>(
        client ? valuesFromClient(client) : emptyForm(),
    );
    const [resolvedClientId, setResolvedClientId] = useState<number | null>(
        client?.id ?? null,
    );
    const [lookingUp, setLookingUp] = useState(false);
    const [lookupMessage, setLookupMessage] = useState<string | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(
        client?.image_url ?? null,
    );
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!open) {
            return;
        }

        form.clearErrors();
        form.setData(client ? valuesFromClient(client) : emptyForm());
        setResolvedClientId(client?.id ?? null);
        setLookupMessage(null);
        setImagePreview(client?.image_url ?? null);

        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }, [open, client?.id]);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];

        if (file) {
            form.setData('image', file);
            form.setData('remove_image', false);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const removeImage = () => {
        form.setData('image', null);
        form.setData('remove_image', true);
        setImagePreview(null);

        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    async function lookupDocument() {
        const expectedLength = form.data.document_type === 'dni' ? 8 : 11;
        const documentNumber = form.data.document_number.replace(/\D/g, '');

        if (
            !['dni', 'ruc'].includes(form.data.document_type) ||
            documentNumber.length !== expectedLength
        ) {
            setLookupMessage(
                `Ingresa un ${form.data.document_type === 'dni' ? 'DNI de 8' : 'RUC de 11'} dígitos.`,
            );

            return;
        }

        setLookingUp(true);
        setLookupMessage(null);

        try {
            const query = new URLSearchParams({
                document_type: form.data.document_type,
                document_number: documentNumber,
            });
            const response = await fetch(`/clients/document-lookup?${query}`, {
                headers: { Accept: 'application/json' },
            });
            const payload = (await response.json()) as ClientLookupResponse & {
                message?: string;
            };

            if (!response.ok) {
                throw new Error(
                    payload.message ?? 'No fue posible consultar el documento.',
                );
            }

            if (payload.exists && 'id' in payload.client) {
                const existing = payload.client;
                form.setData(valuesFromClient(existing));
                setResolvedClientId(existing.id);
                setLookupMessage(
                    'Cliente encontrado en tu base de datos. Se cargaron sus datos.',
                );

                return;
            }

            if ('metadata' in payload.client) {
                form.setData({
                    ...form.data,
                    name: payload.client.name,
                    document_type:
                        payload.client.document_type ?? form.data.document_type,
                    document_number:
                        payload.client.document_number ?? documentNumber,
                    lookup_metadata: payload.client.metadata,
                });

                // Only switch to "create" mode when the dialog was opened for a new
                // client. When editing an existing client, an external (not-yet-saved
                // locally) lookup result must still update that same client, not
                // silently create a duplicate on save.
                if (!client) {
                    setResolvedClientId(null);
                }

                setLookupMessage(
                    'Documento validado externamente. Completa los datos de contacto.',
                );
            }
        } catch (error) {
            setLookupMessage(
                error instanceof Error
                    ? error.message
                    : 'No fue posible consultar el documento.',
            );
        } finally {
            setLookingUp(false);
        }
    }

    function submit(event: React.FormEvent) {
        event.preventDefault();

        const cleanName = form.data.name.trim();

        if (!cleanName) {
            form.setError('name', 'El campo nombre es obligatorio.');
            void Swal.fire({
                icon: 'warning',
                title: 'Nombre requerido',
                text: 'Ingresa el nombre o razón social antes de guardar.',
                confirmButtonColor: '#16a34a',
            });

            return;
        }

        form.clearErrors('name');

        void Swal.fire({
            icon: 'question',
            title: resolvedClientId
                ? '¿Guardar cambios?'
                : '¿Registrar cliente?',
            text: `Se guardará la información de "${cleanName}".`,
            showCancelButton: true,
            confirmButtonText: resolvedClientId
                ? 'Sí, guardar'
                : 'Sí, registrar',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#16a34a',
            reverseButtons: true,
        }).then((result) => {
            if (!result.isConfirmed) {
                return;
            }

            saveClient(cleanName);
        });
    }

    function saveClient(cleanName: string) {
        const options = {
            preserveScroll: true,
            forceFormData: true,
            onSuccess: () => {
                onOpenChange(false);
            },
            onError: () => {
                void Swal.fire({
                    icon: 'error',
                    title: 'No se pudo guardar',
                    text: 'Revisa los campos marcados e intenta nuevamente.',
                    confirmButtonColor: '#16a34a',
                });
            },
        };
        const payload = {
            ...form.data,
            name: cleanName,
            document_number: form.data.document_number.replace(/\D/g, ''),
        };

        if (resolvedClientId) {
            form.transform(() => ({ ...payload, _method: 'put' }));
            form.post(`/clients/${resolvedClientId}`, options);
        } else {
            form.transform(() => {
                const { _method, ...data } = payload;

                return data;
            });
            form.post('/clients', options);
        }
    }

    return (
        <Dialog modal={false} open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <UserRoundPlus className="size-5 text-green-600" />
                        {resolvedClientId ? 'Editar cliente' : 'Nuevo cliente'}
                    </DialogTitle>
                    <DialogDescription>
                        Consulta primero el DNI o RUC. Buscaremos localmente
                        antes de usar RENIEC/SUNAT.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={submit} className="space-y-5">
                    <div className="rounded-xl border border-green-100 bg-green-50/60 p-4 dark:border-green-900 dark:bg-green-950/30">
                        <div className="mb-3 flex items-center gap-2 text-sm font-medium text-green-800 dark:text-green-300">
                            <Search className="size-4" /> Consulta documental
                        </div>
                        <div className="grid gap-3 sm:grid-cols-[150px_1fr_auto]">
                            <select
                                value={form.data.document_type}
                                onChange={(event) =>
                                    form.setData(
                                        'document_type',
                                        event.target.value,
                                    )
                                }
                                className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                            >
                                <option value="dni">DNI</option>
                                <option value="ruc">RUC</option>
                                <option value="pasaporte">Pasaporte</option>
                                <option value="sin_documento">
                                    Sin documento
                                </option>
                            </select>
                            <Input
                                value={form.data.document_number}
                                onChange={(event) =>
                                    form.setData(
                                        'document_number',
                                        event.target.value.replace(/\D/g, ''),
                                    )
                                }
                                placeholder={
                                    form.data.document_type === 'ruc'
                                        ? 'RUC de 11 dígitos'
                                        : form.data.document_type === 'dni'
                                          ? 'DNI de 8 dígitos'
                                          : 'Número de documento'
                                }
                                maxLength={
                                    form.data.document_type === 'ruc' ? 11 : 50
                                }
                            />
                            <Button
                                type="button"
                                variant="outline"
                                onClick={lookupDocument}
                                disabled={
                                    lookingUp ||
                                    !['dni', 'ruc'].includes(
                                        form.data.document_type,
                                    )
                                }
                            >
                                {lookingUp ? (
                                    <LoaderCircle className="mr-2 size-4 animate-spin" />
                                ) : (
                                    <Search className="mr-2 size-4" />
                                )}
                                Consultar
                            </Button>
                        </div>
                        <InputError message={form.errors.document_number} />
                        {lookupMessage && (
                            <div className="mt-3 flex items-start gap-2 text-xs text-muted-foreground">
                                {resolvedClientId ? (
                                    <Database className="mt-0.5 size-3.5 text-blue-600" />
                                ) : (
                                    <BadgeCheck className="mt-0.5 size-3.5 text-green-600" />
                                )}
                                {lookupMessage}
                            </div>
                        )}
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        {/* Subida de Imagen */}
                        <div className="flex flex-col gap-2 sm:col-span-2">
                            <Label>Foto de perfil</Label>
                            <div className="flex items-start gap-4">
                                <div className="relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full border border-dashed bg-gray-50 dark:bg-neutral-800">
                                    {imagePreview ? (
                                        <>
                                            <img
                                                src={imagePreview}
                                                alt="Vista previa"
                                                className="h-full w-full object-cover"
                                            />
                                            <button
                                                type="button"
                                                onClick={removeImage}
                                                className="absolute top-0 right-0 flex size-6 items-center justify-center rounded-bl-full bg-red-500/80 text-white backdrop-blur-sm transition-colors hover:bg-red-600"
                                                aria-label="Quitar imagen"
                                            >
                                                <X className="size-3 -translate-x-0.5 -translate-y-0.5" />
                                            </button>
                                        </>
                                    ) : (
                                        <ImageIcon className="size-8 text-muted-foreground opacity-50" />
                                    )}
                                </div>
                                <div className="flex flex-1 flex-col justify-center gap-2">
                                    <input
                                        type="file"
                                        accept="image/png, image/jpeg, image/webp"
                                        className="hidden"
                                        ref={fileInputRef}
                                        onChange={handleImageChange}
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="w-max"
                                        onClick={() =>
                                            fileInputRef.current?.click()
                                        }
                                    >
                                        Seleccionar imagen
                                    </Button>
                                    <p className="text-xs text-muted-foreground">
                                        Formatos recomendados: JPG, PNG, WEBP.
                                        Max: 2MB.
                                    </p>
                                    <InputError message={form.errors.image} />
                                </div>
                            </div>
                        </div>
                        <div className="grid gap-1.5 sm:col-span-2">
                            <Label htmlFor="client-name">
                                Nombre o razón social *
                            </Label>
                            <Input
                                id="client-name"
                                value={form.data.name}
                                onChange={(event) => {
                                    form.clearErrors('name');
                                    form.setData('name', event.target.value);
                                }}
                                required
                            />
                            <InputError message={form.errors.name} />
                        </div>
                        <div className="grid gap-1.5">
                            <Label htmlFor="client-email">Email</Label>
                            <Input
                                id="client-email"
                                type="email"
                                value={form.data.email}
                                onChange={(event) =>
                                    form.setData('email', event.target.value)
                                }
                            />
                            <InputError message={form.errors.email} />
                        </div>
                        <div className="grid gap-1.5">
                            <Label htmlFor="client-phone">Teléfono</Label>
                            <Input
                                id="client-phone"
                                value={form.data.phone}
                                onChange={(event) =>
                                    form.setData('phone', event.target.value)
                                }
                            />
                            <InputError message={form.errors.phone} />
                        </div>
                        <div className="grid gap-1.5 sm:col-span-2">
                            <Label htmlFor="client-notes">Notas</Label>
                            <textarea
                                id="client-notes"
                                rows={3}
                                value={form.data.notes}
                                onChange={(event) =>
                                    form.setData('notes', event.target.value)
                                }
                                className="rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                            />
                            <InputError message={form.errors.notes} />
                        </div>
                    </div>

                    <label className="flex items-center gap-3 text-sm">
                        <input
                            type="checkbox"
                            checked={form.data.is_active}
                            onChange={(event) =>
                                form.setData('is_active', event.target.checked)
                            }
                            className="size-4 rounded border-green-300 text-green-600"
                        />
                        Cliente activo
                    </label>

                    <DialogFooter className="border-t pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            disabled={form.processing}
                            className="bg-green-600 hover:bg-green-700"
                        >
                            {form.processing
                                ? 'Guardando...'
                                : resolvedClientId
                                  ? 'Guardar cambios'
                                  : 'Registrar cliente'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
