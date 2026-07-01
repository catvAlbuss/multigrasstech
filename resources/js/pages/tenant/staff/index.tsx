import { Head, router, useForm, usePage } from '@inertiajs/react';
import {
    CalendarDays,
    Mail,
    Pencil,
    Plus,
    Search,
    ShieldCheck,
    Trash2,
    UserCog,
    Users,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { toast } from 'sonner';
import Swal from 'sweetalert2';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes/tenant';

type StaffMember = {
    id: number;
    name: string;
    email: string;
    role: string;
    created_at: string;
};

type Props = {
    staff: StaffMember[];
};

type RoleFilter = 'all' | 'admin' | 'operator' | 'viewer';

type StaffFormData = {
    name: string;
    email: string;
    password: string;
    role: string;
    _token: string;
    _method?: 'put' | 'delete';
};

const ROLE_LABELS: Record<string, string> = {
    admin: 'Administrador',
    operator: 'Asistente',
    viewer: 'Cliente / Visualizador',
};

const ROLE_STYLES: Record<
    string,
    {
        badge: string;
        card: string;
        avatar: string;
        icon: string;
        button: string;
    }
> = {
    admin: {
        badge: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
        card: 'border-red-200 hover:ring-red-200 dark:border-red-950/60 dark:hover:ring-red-900/60',
        avatar: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
        icon: 'text-red-600 dark:text-red-400',
        button: 'text-red-700 hover:border-red-200 hover:bg-red-50 hover:text-red-800 dark:text-red-300 dark:hover:bg-red-950/30',
    },
    operator: {
        badge: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
        card: 'border-blue-200 hover:ring-blue-200 dark:border-blue-950/60 dark:hover:ring-blue-900/60',
        avatar: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
        icon: 'text-blue-600 dark:text-blue-400',
        button: 'text-blue-700 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-800 dark:text-blue-300 dark:hover:bg-blue-950/30',
    },
    viewer: {
        badge: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
        card: 'border-slate-200 hover:ring-slate-200 dark:border-slate-800 dark:hover:ring-slate-700',
        avatar: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
        icon: 'text-slate-600 dark:text-slate-300',
        button: 'text-slate-700 hover:border-slate-200 hover:bg-slate-50 hover:text-slate-800 dark:text-slate-300 dark:hover:bg-slate-900',
    },
};

const ROLE_FILTERS: { value: RoleFilter; label: string }[] = [
    { value: 'all', label: 'Todos' },
    { value: 'admin', label: 'Administradores' },
    { value: 'operator', label: 'Asistentes' },
    { value: 'viewer', label: 'Visualizadores' },
];

function getRoleStyles(role: string) {
    return ROLE_STYLES[role] ?? ROLE_STYLES.viewer;
}

function initials(name: string) {
    return name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join('');
}

function csrfToken() {
    return (
        document
            .querySelector<HTMLMetaElement>('meta[name="csrf-token"]')
            ?.getAttribute('content') ?? ''
    );
}

export default function StaffIndex({ staff }: Props) {
    const { flash } = usePage<{ flash: { success?: string; error?: string } }>()
        .props;
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(
        null,
    );
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');

    const {
        data,
        setData,
        post,
        transform,
        processing,
        errors,
        reset,
        clearErrors,
    } = useForm<StaffFormData>({
        name: '',
        email: '',
        password: '',
        role: 'operator',
        _token: csrfToken(),
    });

    const roleCounts = useMemo(
        () => ({
            all: staff.length,
            admin: staff.filter((member) => member.role === 'admin').length,
            operator: staff.filter((member) => member.role === 'operator')
                .length,
            viewer: staff.filter((member) => member.role === 'viewer').length,
        }),
        [staff],
    );

    const filteredStaff = useMemo(() => {
        const normalizedSearch = search.trim().toLowerCase();

        return staff.filter((member) => {
            const matchesRole =
                roleFilter === 'all' || member.role === roleFilter;
            const matchesSearch =
                !normalizedSearch ||
                member.name.toLowerCase().includes(normalizedSearch) ||
                member.email.toLowerCase().includes(normalizedSearch) ||
                (ROLE_LABELS[member.role] ?? member.role)
                    .toLowerCase()
                    .includes(normalizedSearch);

            return matchesRole && matchesSearch;
        });
    }, [roleFilter, search, staff]);

    useEffect(() => {
        if (flash?.success) {
            toast.success(flash.success);
        }

        if (flash?.error) {
            toast.error(flash.error);
        }
    }, [flash]);

    function openCreate() {
        setSelectedStaff(null);
        clearErrors();
        reset();
        setDialogOpen(true);
    }

    function openEdit(member: StaffMember) {
        setSelectedStaff(member);
        clearErrors();
        setData({
            name: member.name,
            email: member.email,
            password: '',
            role: member.role,
            _token: csrfToken(),
        });
        setDialogOpen(true);
    }

    function submitForm(e: React.FormEvent) {
        e.preventDefault();

        if (selectedStaff) {
            transform((data) => ({
                ...data,
                _method: 'put',
                _token: csrfToken(),
            }));
            post(`/staff/${selectedStaff.id}`, {
                onSuccess: () => setDialogOpen(false),
            });

            return;
        }

        transform((data) => ({
            name: data.name,
            email: data.email,
            password: data.password,
            role: data.role,
            _token: csrfToken(),
        }));
        post('/staff', {
            onSuccess: () => setDialogOpen(false),
        });
    }

    async function handleDelete(member: StaffMember) {
        const result = await Swal.fire({
            icon: 'warning',
            title: '¿Eliminar trabajador?',
            text: `"${member.name}" será eliminado del sistema.`,
            showCancelButton: true,
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#dc2626',
            reverseButtons: true,
        });

        if (result.isConfirmed) {
            router.post(
                `/staff/${member.id}`,
                { _method: 'delete', _token: csrfToken() },
                { preserveScroll: true },
            );
        }
    }

    return (
        <>
            <Head title="Personal de Trabajo" />
            <div className="space-y-5 px-4 pb-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <div className="flex items-center gap-2">
                            <UserCog className="size-5 text-indigo-600" />
                            <h1 className="text-2xl font-bold tracking-tight">
                                Personal de Trabajo
                            </h1>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Gestiona tu equipo y asigna roles de acceso.
                        </p>
                    </div>
                    <Button
                        onClick={openCreate}
                        className="bg-indigo-600 hover:bg-indigo-700"
                    >
                        <Plus className="mr-1.5 size-4" /> Nuevo trabajador
                    </Button>
                </div>

                <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
                    <div className="flex flex-col gap-4 p-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="relative w-full lg:max-w-md">
                            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                value={search}
                                onChange={(event) =>
                                    setSearch(event.target.value)
                                }
                                placeholder="Buscar por nombre, correo o rol..."
                                className="rounded-xl pl-9"
                            />
                        </div>

                        <div className="flex flex-wrap gap-2">
                            {ROLE_FILTERS.map((filter) => {
                                const isActive = roleFilter === filter.value;
                                const roleStyle =
                                    filter.value === 'all'
                                        ? 'border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-900 dark:bg-indigo-950/30 dark:text-indigo-300'
                                        : getRoleStyles(filter.value).badge;

                                return (
                                    <Button
                                        key={filter.value}
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                            setRoleFilter(filter.value)
                                        }
                                        className={`rounded-xl ${
                                            isActive
                                                ? roleStyle
                                                : 'text-muted-foreground'
                                        }`}
                                    >
                                        {filter.label}
                                        <span className="ml-1.5 rounded-full bg-background/80 px-1.5 text-[11px]">
                                            {roleCounts[filter.value]}
                                        </span>
                                    </Button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {filteredStaff.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed bg-gray-50/50 py-24 text-muted-foreground dark:bg-gray-900/20">
                        <Users className="mb-4 size-12 opacity-20" />
                        <p className="text-base font-medium">
                            No hay personal para estos filtros.
                        </p>
                        <p className="mt-1 text-sm">
                            Ajusta la búsqueda o registra un nuevo trabajador.
                        </p>
                        <Button
                            onClick={openCreate}
                            variant="outline"
                            className="mt-6 rounded-xl"
                        >
                            <Plus className="mr-2 size-4" /> Agregar personal
                        </Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                        {filteredStaff.map((member) => {
                            const roleStyle = getRoleStyles(member.role);

                            return (
                                <article
                                    key={member.id}
                                    className={`flex min-h-64 flex-col rounded-2xl border bg-card p-5 shadow-sm ring-1 ring-transparent transition hover:shadow-md ${roleStyle.card}`}
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div
                                            className={`flex size-12 shrink-0 items-center justify-center rounded-2xl text-sm font-bold ${roleStyle.avatar}`}
                                        >
                                            {initials(member.name) || 'P'}
                                        </div>
                                        <Badge
                                            variant="secondary"
                                            className={roleStyle.badge}
                                        >
                                            {ROLE_LABELS[member.role] ||
                                                member.role}
                                        </Badge>
                                    </div>

                                    <div className="mt-4 min-w-0">
                                        <h3 className="line-clamp-2 text-lg leading-tight font-bold text-foreground">
                                            {member.name}
                                        </h3>
                                        <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                                            <Mail className="size-4 shrink-0" />
                                            <span className="truncate">
                                                {member.email}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="mt-4 grid gap-2 text-sm">
                                        <div className="flex items-center gap-2 rounded-xl bg-muted/50 px-3 py-2">
                                            <ShieldCheck
                                                className={`size-4 ${roleStyle.icon}`}
                                            />
                                            <span className="font-medium">
                                                {ROLE_LABELS[member.role] ||
                                                    member.role}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 rounded-xl bg-muted/50 px-3 py-2 text-muted-foreground">
                                            <CalendarDays className="size-4" />
                                            <span>
                                                Creado el {member.created_at}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="mt-auto flex items-center gap-2 pt-5">
                                        <Button
                                            variant="outline"
                                            className={`flex-1 rounded-xl ${roleStyle.button}`}
                                            onClick={() => openEdit(member)}
                                        >
                                            <Pencil className="mr-2 size-4" />
                                            Editar
                                        </Button>
                                        <Button
                                            variant="outline"
                                            className="flex-none rounded-xl text-red-500 hover:border-red-200 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30"
                                            onClick={() => handleDelete(member)}
                                            aria-label="Eliminar"
                                        >
                                            <Trash2 className="size-4" />
                                        </Button>
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                )}
            </div>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent>
                    <form onSubmit={submitForm}>
                        <DialogHeader>
                            <DialogTitle>
                                {selectedStaff
                                    ? 'Editar trabajador'
                                    : 'Nuevo trabajador'}
                            </DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Nombre</Label>
                                <Input
                                    id="name"
                                    value={data.name}
                                    onChange={(e) =>
                                        setData('name', e.target.value)
                                    }
                                    autoFocus
                                />
                                {errors.name && (
                                    <p className="text-sm text-red-600">
                                        {errors.name}
                                    </p>
                                )}
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="email">
                                    Correo electrónico
                                </Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={data.email}
                                    onChange={(e) =>
                                        setData('email', e.target.value)
                                    }
                                />
                                {errors.email && (
                                    <p className="text-sm text-red-600">
                                        {errors.email}
                                    </p>
                                )}
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="password">
                                    Contraseña{' '}
                                    {selectedStaff &&
                                        '(dejar en blanco para no cambiar)'}
                                </Label>
                                <Input
                                    id="password"
                                    type="password"
                                    value={data.password}
                                    onChange={(e) =>
                                        setData('password', e.target.value)
                                    }
                                />
                                {errors.password && (
                                    <p className="text-sm text-red-600">
                                        {errors.password}
                                    </p>
                                )}
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="role">Rol de acceso</Label>
                                <Select
                                    value={data.role}
                                    onValueChange={(val) =>
                                        setData('role', val)
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecciona un rol" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="admin">
                                            Administrador (Todo)
                                        </SelectItem>
                                        <SelectItem value="operator">
                                            Asistente (Operación)
                                        </SelectItem>
                                        <SelectItem value="viewer">
                                            Cliente / Visualizador (Solo
                                            lectura)
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                                {errors.role && (
                                    <p className="text-sm text-red-600">
                                        {errors.role}
                                    </p>
                                )}
                            </div>
                        </div>
                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setDialogOpen(false)}
                            >
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={processing}>
                                {processing ? 'Guardando...' : 'Guardar'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}

StaffIndex.layout = (page: ReactNode) => (
    <AppLayout
        breadcrumbs={[
            { title: 'Dashboard', href: dashboard() },
            { title: 'Personal de Trabajo', href: '#' },
        ]}
    >
        {page}
    </AppLayout>
);
