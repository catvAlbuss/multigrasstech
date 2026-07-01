import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    CircleDollarSign,
    Layers,
    LayoutGrid,
    Pencil,
    Plus,
    Search,
    Trash2,
    Users,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import Swal from 'sweetalert2';
import { FieldFormDialog } from '@/components/fields/field-form-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type {
    FieldsIndexPageProps as Props,
    TenantField as Field,
} from '@/types/tenant';

const SURFACE_LABELS: Record<string, string> = {
    artificial: 'Sintético',
    grass: 'Natural',
    concrete: 'Concreto',
    clay: 'Arcilla',
};

const FIELD_BACKGROUNDS: Record<string, string> = {
    artificial: 'from-emerald-950 via-emerald-700 to-green-500',
    grass: 'from-green-950 via-green-700 to-lime-500',
    concrete: 'from-slate-800 via-slate-600 to-slate-400',
    clay: 'from-orange-950 via-orange-700 to-amber-500',
};

const STATUS_COLORS: Record<string, string> = {
    active: 'border-green-200 bg-green-100 text-green-700 dark:border-green-900 dark:bg-green-950 dark:text-green-300',
    maintenance:
        'border-amber-200 bg-amber-100 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300',
    inactive:
        'border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300',
    blocked:
        'border-red-200 bg-red-100 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300',
};

const STATUS_LABELS: Record<string, string> = {
    active: 'Activo',
    maintenance: 'Mantenimiento',
    inactive: 'Inactivo',
    blocked: 'Bloqueado',
};

function formatCurrency(value: string) {
    return new Intl.NumberFormat('es-PE', {
        style: 'currency',
        currency: 'PEN',
        minimumFractionDigits: 2,
    }).format(Number(value));
}

function FieldPreview({ field }: { field: Field }) {
    const background =
        FIELD_BACKGROUNDS[field.surface_type] ?? FIELD_BACKGROUNDS.artificial;

    return (
        <div
            className={`relative h-44 overflow-hidden ${field.image_url ? 'bg-slate-900' : `bg-gradient-to-br ${background}`}`}
            aria-label={`Vista visual de ${field.name}`}
        >
            {field.image_url && (
                <img
                    src={field.image_url}
                    alt={field.name}
                    className="absolute inset-0 h-full w-full object-cover"
                />
            )}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-10%,rgba(255,255,255,0.38),transparent_48%)]" />
            {!field.image_url && (
                <div className="absolute inset-x-5 top-7 bottom-5 origin-center -skew-x-6 border-2 border-white/75 shadow-[0_0_20px_rgba(255,255,255,0.12)]">
                    <div className="absolute top-0 bottom-0 left-1/2 border-l-2 border-white/70" />
                    <div className="absolute top-1/2 left-1/2 size-11 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/70" />
                    <div className="absolute top-1/2 -left-px h-16 w-9 -translate-y-1/2 border-2 border-l-0 border-white/70" />
                    <div className="absolute top-1/2 -right-px h-16 w-9 -translate-y-1/2 border-2 border-r-0 border-white/70" />
                </div>
            )}
            <div className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-black/35 to-transparent" />
            <div className="absolute top-3 left-3 rounded-full border border-white/30 bg-black/25 px-2.5 py-1 text-[10px] font-medium text-white backdrop-blur-sm">
                {SURFACE_LABELS[field.surface_type] ?? field.surface_type}
            </div>
        </div>
    );
}

function FieldCard({
    field,
    onEdit,
    onDelete,
}: {
    field: Field;
    onEdit: (field: Field) => void;
    onDelete: (field: Field) => void;
}) {
    return (
        <article className="group overflow-hidden rounded-xl border bg-card shadow-xs transition duration-200 hover:-translate-y-0.5 hover:shadow-md">
            <FieldPreview field={field} />

            <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <h2 className="truncate font-semibold">{field.name}</h2>
                        <p className="mt-1 line-clamp-1 min-h-4 text-xs text-muted-foreground">
                            {field.description ||
                                'Campo deportivo disponible para reservaciones.'}
                        </p>
                        {field.shared_group_id && (
                            <div className="mt-1 flex items-center gap-1 text-[10px] text-blue-600 dark:text-blue-400">
                                <Layers className="size-3" />
                                <span>Espacio compartido</span>
                            </div>
                        )}
                    </div>
                    <Badge
                        className={`shrink-0 border text-[10px] ${STATUS_COLORS[field.status] ?? ''}`}
                    >
                        {STATUS_LABELS[field.status] ?? field.status}
                    </Badge>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2 rounded-lg bg-muted/45 p-3 text-xs">
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Users className="size-3.5 text-green-600" />
                        <span>{field.capacity} personas</span>
                    </div>
                    <div className="flex items-center justify-end gap-2 font-medium">
                        <CircleDollarSign className="size-3.5 text-green-600" />
                        <span>{formatCurrency(field.hourly_rate)}/h</span>
                    </div>
                </div>

                <div className="mt-4 flex items-center justify-between border-t pt-3">
                    <span className="text-xs text-muted-foreground">
                        {SURFACE_LABELS[field.surface_type] ??
                            field.surface_type}
                    </span>
                    <div className="flex items-center gap-1">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 text-green-700 hover:bg-green-50 hover:text-green-800 dark:text-green-400 dark:hover:bg-green-950"
                            aria-label={`Editar ${field.name}`}
                            onClick={() => onEdit(field)}
                        >
                            <Pencil className="size-3.5" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950"
                            aria-label={`Eliminar ${field.name}`}
                            onClick={() => onDelete(field)}
                        >
                            <Trash2 className="size-3.5" />
                        </Button>
                    </div>
                </div>
            </div>
        </article>
    );
}

export default function FieldsIndex({ fields, filters, allFields = [] }: Props & { allFields?: Pick<Field, 'id' | 'name' | 'shared_group_id'>[] }) {
    const { flash } = usePage<{
        flash: { success?: string; error?: string };
    }>().props;
    const searchRef = useRef<HTMLInputElement>(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingField, setEditingField] = useState<Field | null>(null);

    useEffect(() => {
        if (flash?.success) {
            toast.success(flash.success);
        }

        if (flash?.error) {
            toast.error(flash.error);
        }
    }, [flash]);

    function handleSearch(event: React.FormEvent) {
        event.preventDefault();
        router.get(
            '/fields',
            { search: searchRef.current?.value ?? '' },
            { preserveState: true, replace: true },
        );
    }

    async function handleDelete(field: Field) {
        const result = await Swal.fire({
            icon: 'warning',
            title: '¿Eliminar campo?',
            text: `"${field.name}" será eliminado permanentemente.`,
            showCancelButton: true,
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#dc2626',
            reverseButtons: true,
        });

        if (result.isConfirmed) {
            router.delete(`/fields/${field.id}`);
        }
    }

    function handleCreate() {
        setEditingField(null);
        setDialogOpen(true);
    }

    function handleEdit(field: Field) {
        setEditingField(field);
        setDialogOpen(true);
    }

    return (
        <>
            <Head title="Campos Deportivos" />

            <div className="space-y-5 px-4 pb-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <div className="flex items-center gap-2">
                            <LayoutGrid className="size-5 text-green-600" />
                            <h1 className="text-2xl font-bold tracking-tight">
                                Campos Deportivos
                            </h1>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Administra disponibilidad, capacidad y tarifas de
                            tus campos.
                        </p>
                    </div>
                    <Button
                        className="bg-white text-green-700 hover:bg-green-50"
                        onClick={handleCreate}
                    >
                        <Plus className="mr-1.5 size-4" />
                        Nuevo Campo
                    </Button>
                </div>

                <div className="flex flex-col gap-3 rounded-xl border bg-card p-3 shadow-xs sm:flex-row sm:items-center">
                    <form onSubmit={handleSearch} className="flex flex-1 gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                ref={searchRef}
                                defaultValue={filters.search}
                                placeholder="Buscar campo por nombre..."
                                className="pl-9 focus-visible:ring-green-500"
                            />
                        </div>
                        <Button type="submit" variant="outline">
                            Buscar
                        </Button>
                        {filters.search && (
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() =>
                                    router.get('/fields', {}, { replace: true })
                                }
                            >
                                Limpiar
                            </Button>
                        )}
                    </form>
                    <div className="flex items-center gap-2 border-t pt-3 text-xs text-muted-foreground sm:border-t-0 sm:border-l sm:pt-0 sm:pl-3">
                        <span className="font-semibold text-foreground">
                            {fields.total}
                        </span>
                        campo{fields.total !== 1 ? 's' : ''} registrado
                        {fields.total !== 1 ? 's' : ''}
                    </div>
                </div>

                {fields.data.length === 0 ? (
                    <div className="flex min-h-80 flex-col items-center justify-center rounded-xl border border-dashed bg-card px-6 text-center">
                        <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300">
                            <LayoutGrid className="size-6" />
                        </div>
                        <h2 className="font-semibold">
                            No se encontraron campos
                        </h2>
                        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                            {filters.search
                                ? `No hay resultados para “${filters.search}”.`
                                : 'Registra tu primer campo para comenzar a gestionar reservas.'}
                        </p>
                    </div>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                        {fields.data.map((field) => (
                            <FieldCard
                                key={field.id}
                                field={field}
                                onEdit={handleEdit}
                                onDelete={handleDelete}
                            />
                        ))}
                    </div>
                )}

                {fields.last_page > 1 && (
                    <div className="flex flex-col items-center justify-between gap-3 border-t pt-4 text-sm text-muted-foreground sm:flex-row">
                        <span>
                            Mostrando {fields.from}–{fields.to} de{' '}
                            {fields.total}
                        </span>
                        <div className="flex flex-wrap justify-center gap-1">
                            {fields.links.map((link, index) => (
                                <button
                                    key={`${link.label}-${index}`}
                                    type="button"
                                    disabled={!link.url}
                                    onClick={() =>
                                        link.url && router.get(link.url)
                                    }
                                    className={`rounded-md px-3 py-1.5 text-xs transition-colors ${
                                        link.active
                                            ? 'bg-green-600 font-medium text-white'
                                            : link.url
                                              ? 'border text-foreground hover:border-green-300 hover:bg-green-50 dark:hover:bg-green-950'
                                              : 'cursor-not-allowed border opacity-40'
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

            <FieldFormDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                field={editingField}
                allFields={allFields}
            />
        </>
    );
}

FieldsIndex.layout = {
    breadcrumbs: [{ title: 'Campos', href: '/fields' }],
};
