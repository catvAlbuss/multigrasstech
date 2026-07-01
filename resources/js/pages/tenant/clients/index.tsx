import { Head, router, usePage } from '@inertiajs/react';
import { Pencil, Plus, Search, Trash2, Users } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import Swal from 'sweetalert2';
import { ClientFormDialog } from '@/components/clients/client-form-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type {
    ClientsIndexPageProps as Props,
    TenantClientEdit,
    TenantClientListItem as Client,
} from '@/types/tenant';

const DOC_LABELS: Record<string, string> = {
    dni: 'DNI',
    ruc: 'RUC',
    pasaporte: 'Pasaporte',
    sin_documento: 'Sin documento',
};

export default function ClientsIndex({ clients, filters }: Props) {
    const { flash } = usePage<{ flash: { success?: string; error?: string } }>()
        .props;
    const searchRef = useRef<HTMLInputElement>(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedClient, setSelectedClient] =
        useState<TenantClientEdit | null>(null);

    useEffect(() => {
        if (flash?.success) {
            void Swal.fire({
                icon: 'success',
                title: flash.success,
                timer: 1600,
                showConfirmButton: false,
            });
        }

        if (flash?.error) {
            void Swal.fire({
                icon: 'error',
                title: flash.error,
                confirmButtonColor: '#16a34a',
            });
        }
    }, [flash]);

    function openCreate() {
        setSelectedClient(null);
        setDialogOpen(true);
    }

    function openEdit(client: Client) {
        setSelectedClient({ ...client, notes: client.notes ?? null });
        setDialogOpen(true);
    }

    function handleSearch(event: React.FormEvent) {
        event.preventDefault();
        router.get(
            '/clients',
            { search: searchRef.current?.value ?? '' },
            { preserveState: true, replace: true },
        );
    }

    async function handleDelete(client: Client) {
        const result = await Swal.fire({
            icon: 'warning',
            title: '¿Eliminar cliente?',
            text: `"${client.name}" será eliminado permanentemente.`,
            showCancelButton: true,
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#dc2626',
            reverseButtons: true,
        });

        if (result.isConfirmed) {
            router.delete(`/clients/${client.id}`, {
                preserveScroll: true,
                onError: () => {
                    void Swal.fire({
                        icon: 'error',
                        title: 'No se pudo eliminar',
                        text: 'Intenta nuevamente o revisa tus permisos.',
                        confirmButtonColor: '#16a34a',
                    });
                },
            });
        }
    }

    return (
        <>
            <Head title="Clientes" />
            <div className="space-y-5 px-4 pb-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <div className="flex items-center gap-2">
                            <Users className="size-5 text-green-600" />
                            <h1 className="text-2xl font-bold tracking-tight">
                                Clientes
                            </h1>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Gestiona y consulta la información de tus clientes.
                        </p>
                    </div>
                    <Button
                        onClick={openCreate}
                        className="bg-green-600 hover:bg-green-700"
                    >
                        <Plus className="mr-1.5 size-4" /> Nuevo cliente
                    </Button>
                </div>

                <div className="mb-6 overflow-hidden rounded-2xl border bg-card shadow-sm">
                    <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
                        <form
                            onSubmit={handleSearch}
                            className="flex w-full max-w-xl gap-2"
                        >
                            <div className="relative flex-1">
                                <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    ref={searchRef}
                                    defaultValue={filters.search}
                                    placeholder="Nombre, teléfono, email, DNI o RUC..."
                                    className="rounded-xl pl-9"
                                />
                            </div>
                            <Button
                                type="submit"
                                variant="outline"
                                className="rounded-xl"
                            >
                                Buscar
                            </Button>
                            {filters.search && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    className="rounded-xl"
                                    onClick={() =>
                                        router.get(
                                            '/clients',
                                            {},
                                            { replace: true },
                                        )
                                    }
                                >
                                    Limpiar
                                </Button>
                            )}
                        </form>
                        <div className="flex items-center gap-3">
                            <div className="flex flex-col text-right">
                                <span className="text-xs text-muted-foreground">
                                    Total
                                </span>
                                <span className="text-sm leading-none font-bold text-foreground">
                                    {clients.total}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Grid de Clientes */}
                {clients.data.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed bg-gray-50/50 py-24 text-muted-foreground dark:bg-gray-900/20">
                        <Users className="mb-4 size-12 opacity-20" />
                        <p className="text-base font-medium">
                            No hay clientes registrados.
                        </p>
                        <p className="mt-1 text-sm">
                            Registra tu primer cliente para empezar.
                        </p>
                        <Button
                            onClick={openCreate}
                            variant="outline"
                            className="mt-6 rounded-xl"
                        >
                            <Plus className="mr-2 size-4" /> Agregar cliente
                        </Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                        {clients.data.map((client) => (
                            <div
                                key={client.id}
                                className="group flex flex-col overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-gray-200 transition-all hover:shadow-md hover:ring-green-200 dark:bg-neutral-900 dark:ring-gray-800 dark:hover:ring-green-900/50"
                            >
                                {/* Imagen superior */}
                                <div className="relative aspect-[4/3] w-full overflow-hidden bg-gray-100 dark:bg-neutral-800">
                                    {client.image_url ? (
                                        <img
                                            src={client.image_url}
                                            alt={client.name}
                                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                                        />
                                    ) : (
                                        <div className="flex h-full items-center justify-center">
                                            <Users className="size-12 text-gray-300 dark:text-gray-600" />
                                        </div>
                                    )}

                                    {/* Badges superiores */}
                                    <div className="absolute top-3 right-3 flex flex-col items-end gap-1.5">
                                        <Badge
                                            className={`shadow-sm backdrop-blur-sm ${
                                                client.is_active
                                                    ? 'bg-green-500/90 text-white hover:bg-green-600'
                                                    : 'bg-gray-500/90 text-white hover:bg-gray-600'
                                            }`}
                                        >
                                            {client.is_active
                                                ? 'Activo'
                                                : 'Inactivo'}
                                        </Badge>
                                    </div>
                                </div>

                                {/* Contenido */}
                                <div className="flex flex-1 flex-col p-5">
                                    <div className="mb-3 flex items-start justify-between gap-3">
                                        <div className="flex-1">
                                            <h3 className="line-clamp-2 text-lg leading-tight font-bold text-gray-900 dark:text-gray-100">
                                                {client.name}
                                            </h3>
                                            <p className="mt-1 text-xs font-medium text-muted-foreground">
                                                {client.email || 'Sin email'}
                                            </p>
                                        </div>
                                        <div className="shrink-0 text-right">
                                            <div className="flex items-center justify-center rounded-full bg-green-50 px-2.5 py-1 text-xs font-bold text-green-700 dark:bg-green-950/30 dark:text-green-400">
                                                #
                                                {String(client.id).padStart(
                                                    4,
                                                    '0',
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mb-4 flex flex-1 flex-col gap-1 text-sm text-muted-foreground">
                                        <p className="flex justify-between">
                                            <span>Teléfono:</span>
                                            <span className="font-medium text-foreground">
                                                {client.phone || '—'}
                                            </span>
                                        </p>
                                        <p className="flex justify-between">
                                            <span>Documento:</span>
                                            <span className="font-medium text-foreground">
                                                {client.document_type
                                                    ? DOC_LABELS[
                                                          client.document_type
                                                      ]
                                                    : '—'}{' '}
                                                {client.document_number}
                                            </span>
                                        </p>
                                    </div>

                                    {/* Stats grid */}
                                    <div className="mt-auto mb-5 grid grid-cols-2 gap-3 text-sm">
                                        <div className="flex flex-col justify-center rounded-xl bg-gray-50 px-3 py-2 dark:bg-neutral-800/50">
                                            <span className="text-[10px] font-medium tracking-wider text-muted-foreground uppercase">
                                                Reservaciones
                                            </span>
                                            <span className="font-bold text-gray-900 dark:text-gray-100">
                                                {client.reservations_count ?? 0}
                                            </span>
                                        </div>
                                        <div className="flex flex-col justify-center rounded-xl bg-gray-50 px-3 py-2 dark:bg-neutral-800/50">
                                            <span className="text-[10px] font-medium tracking-wider text-muted-foreground uppercase">
                                                Asistencia
                                            </span>
                                            <span className="font-bold text-gray-900 dark:text-gray-100">
                                                —
                                            </span>
                                        </div>
                                    </div>

                                    {/* Acciones */}
                                    <div className="flex items-center gap-2 pt-1">
                                        <Button
                                            variant="outline"
                                            className="flex-1 rounded-xl text-green-700 hover:border-green-300 hover:bg-green-50 hover:text-green-800 dark:text-green-400 dark:hover:bg-green-950/30"
                                            onClick={() => openEdit(client)}
                                        >
                                            <Pencil className="mr-2 size-4" />
                                            Editar
                                        </Button>
                                        <Button
                                            variant="outline"
                                            className="flex-none rounded-xl text-red-500 hover:border-red-200 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30"
                                            onClick={() => handleDelete(client)}
                                            aria-label="Eliminar"
                                        >
                                            <Trash2 className="size-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Paginación */}
                {clients.last_page > 1 && (
                    <div className="mt-8 flex items-center justify-between rounded-2xl border bg-white p-4 text-sm text-muted-foreground shadow-sm dark:bg-neutral-900">
                        <span>
                            Mostrando {clients.from}–{clients.to} de{' '}
                            {clients.total}
                        </span>
                        <div className="flex gap-1">
                            {clients.links.map((link, index) => (
                                <button
                                    key={`${link.label}-${index}`}
                                    disabled={!link.url}
                                    onClick={() =>
                                        link.url && router.get(link.url)
                                    }
                                    className={`min-w-[32px] rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                                        link.active
                                            ? 'bg-green-600 text-white shadow-sm'
                                            : 'border hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-transparent dark:border-gray-800 dark:hover:bg-neutral-800'
                                    }`}
                                    dangerouslySetInnerHTML={{
                                        __html: link.label,
                                    }}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {dialogOpen && (
                <ClientFormDialog
                    open={dialogOpen}
                    client={selectedClient}
                    onOpenChange={setDialogOpen}
                />
            )}
        </>
    );
}

ClientsIndex.layout = {
    breadcrumbs: [{ title: 'Clientes', href: '/clients' }],
};
