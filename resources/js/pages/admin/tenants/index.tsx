import { faBolt, faPowerOff } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { Building2, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import Swal from 'sweetalert2';
import TenantController from '@/actions/App/Http/Controllers/Admin/TenantController';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { create } from '@/routes/admin/tenants';
import type {
    AdminTenantListItem as Tenant,
    AdminTenantsPageProps as Props,
} from '@/types/admin';

const PLAN_LABELS: Record<string, string> = {
    basic: 'Basic',
    premium: 'Premium',
    contact: 'Contáctenos',
    pro: 'Pro',
    enterprise: 'Enterprise',
};

const PLAN_COLORS: Record<string, string> = {
    basic: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800',
    premium:
        'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800',
    contact:
        'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800',
    pro: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800',
    enterprise: 'bg-green-700 text-white border-green-700',
};

export default function TenantsIndex({ tenants, filters, plans }: Props) {
    const { flash } = usePage<{ flash: { success?: string; error?: string } }>()
        .props;

    useEffect(() => {
        if (flash?.success) {
            void Swal.fire({
                icon: 'success',
                title: 'Operación completada',
                text: flash.success,
                confirmButtonColor: '#16a34a',
            });
        }

        if (flash?.error) {
            toast.error(flash.error);
        }
    }, [flash]);

    const searchRef = useRef<HTMLInputElement>(null);

    function handleSearch(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const value = searchRef.current?.value ?? '';
        router.get(
            TenantController.index.url(),
            { search: value },
            { preserveState: true, replace: true },
        );
    }

    async function handleToggle(tenant: Tenant) {
        const action = tenant.is_active ? 'desactivar' : 'activar';
        const result = await Swal.fire({
            icon: 'warning',
            title: `¿${action.charAt(0).toUpperCase() + action.slice(1)} empresa?`,
            text: tenant.is_active
                ? `Los usuarios de "${tenant.name}" perderán el acceso.`
                : `Los usuarios de "${tenant.name}" podrán volver a ingresar.`,
            showCancelButton: true,
            confirmButtonText: `Sí, ${action}`,
            cancelButtonText: 'Cancelar',
            confirmButtonColor: tenant.is_active ? '#d97706' : '#16a34a',
            reverseButtons: true,
        });

        if (!result.isConfirmed) {
            return;
        }

        router.patch(
            TenantController.toggle.url(tenant.id),
            {},
            { preserveScroll: true },
        );
    }

    async function handleDelete(tenant: Tenant) {
        const result = await Swal.fire({
            icon: 'warning',
            title: '¿Eliminar empresa?',
            text: `Esta acción eliminará "${tenant.name}" y no se puede deshacer.`,
            showCancelButton: true,
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#dc2626',
            reverseButtons: true,
        });

        if (!result.isConfirmed) {
            return;
        }

        router.delete(TenantController.destroy.url(tenant.id));
    }

    return (
        <>
            <Head title="Empresas" />

            <div className="space-y-6 px-4">
                {/* Header */}
                <div className="flex items-center justify-between rounded-xl bg-green-700 px-6 py-5 text-white shadow-sm">
                    <div className="flex items-center gap-3">
                        <Building2 className="h-6 w-6 text-green-200" />
                        <div>
                            <h1 className="text-xl font-semibold">Empresas</h1>
                            <p className="text-sm text-green-200">
                                {tenants.total} empresa
                                {tenants.total !== 1 ? 's' : ''} registrada
                                {tenants.total !== 1 ? 's' : ''}
                            </p>
                        </div>
                    </div>
                    <Button
                        asChild
                        className="bg-white text-green-700 hover:bg-green-50 hover:text-green-800"
                    >
                        <Link href={create()}>
                            <Plus className="mr-1.5 h-4 w-4" />
                            Nueva Empresa
                        </Link>
                    </Button>
                </div>

                {/* Search */}
                <form onSubmit={handleSearch} className="flex gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            ref={searchRef}
                            defaultValue={filters.search}
                            placeholder="Buscar por nombre, subdominio o email…"
                            className="pl-9 focus-visible:ring-green-500"
                        />
                    </div>
                    <Button type="submit" className="bg-green-600 hover:bg-green-700">
                        Buscar
                    </Button>
                    {filters.search && (
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() =>
                                router.get(
                                    TenantController.index.url(),
                                    {},
                                    { replace: true },
                                )
                            }>
                            Limpiar
                        </Button>
                    )}
                </form>

                {/* Table */}
                <div className="overflow-hidden rounded-xl border border-green-100 bg-white shadow-sm dark:border-green-900/30 dark:bg-neutral-900">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-green-50 text-left text-green-900 dark:bg-green-900/30 dark:text-green-200">
                                <th className="px-4 py-3 font-medium">
                                    Empresa
                                </th>
                                <th className="px-4 py-3 font-medium">
                                    Subdominio
                                </th>
                                <th className="px-4 py-3 font-medium">Plan</th>
                                <th className="px-4 py-3 font-medium">
                                    Estado
                                </th>
                                <th className="px-4 py-3 font-medium">
                                    Registro
                                </th>
                                <th className="px-4 py-3 text-right font-medium">
                                    Acciones
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-green-50 dark:divide-green-900/20">
                            {tenants.data.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={6}
                                        className="px-4 py-12 text-center text-muted-foreground">
                                        {filters.search
                                            ? `Sin resultados para "${filters.search}".`
                                            : 'No hay empresas registradas aún.'}
                                    </td>
                                </tr>
                            ) : (
                                tenants.data.map((tenant) => (
                                    <tr
                                        key={tenant.id}
                                        className="bg-white transition-colors hover:bg-green-50/50 dark:bg-neutral-900 dark:hover:bg-green-900/10">
                                        <td className="px-4 py-3">
                                            <div className="font-medium text-gray-900 dark:text-gray-100">
                                                {tenant.name}
                                            </div>
                                            {tenant.email && (
                                                <div className="text-xs text-muted-foreground">
                                                    {tenant.email}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 font-mono text-xs text-gray-600 dark:text-gray-400">
                                            {tenant.slug}.multigrass.com
                                        </td>
                                        <td className="px-4 py-3">
                                            <span
                                                className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${PLAN_COLORS[tenant.plan] ?? 'border-gray-200 bg-gray-100 text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300'}`}>
                                                {tenant.payment_plan?.name ??
                                                    plans.find(
                                                        (plan) =>
                                                            plan.slug ===
                                                            tenant.plan,
                                                    )?.name ??
                                                    PLAN_LABELS[tenant.plan] ??
                                                    tenant.plan}
                                            </span>
                                            <div className="mt-1 text-xs text-muted-foreground">
                                                {tenant.plan_expires_at
                                                    ? `Vence ${new Date(tenant.plan_expires_at).toLocaleDateString('es-CO')}`
                                                    : 'De por vida'}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            {tenant.is_active ? (
                                                <Badge className="border-green-200 bg-green-100 text-green-700 hover:bg-green-100 dark:border-green-800 dark:bg-green-900/30 dark:text-green-300 dark:hover:bg-green-900/30">
                                                    Activa
                                                </Badge>
                                            ) : (
                                                <Badge variant="outline" className="text-gray-500">
                                                    Inactiva
                                                </Badge>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-xs text-muted-foreground">
                                            {new Date(tenant.created_at).toLocaleDateString('es-CO')}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center justify-end gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-green-700 hover:bg-green-100 hover:text-green-900 dark:text-green-400 dark:hover:bg-green-900/30 dark:hover:text-green-300"
                                                    asChild
                                                >
                                                    <Link
                                                        href={TenantController.edit.url(
                                                            tenant.id,
                                                        )}
                                                    >
                                                        <Pencil className="h-3.5 w-3.5" />
                                                    </Link>
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className={`h-8 w-8 ${tenant.is_active ? 'text-amber-600 hover:bg-amber-50 hover:text-amber-700 dark:text-amber-400 dark:hover:bg-amber-900/20 dark:hover:text-amber-300' : 'text-green-600 hover:bg-green-50 hover:text-green-700 dark:text-green-400 dark:hover:bg-green-900/20 dark:hover:text-green-300'}`}
                                                    onClick={() =>
                                                        handleToggle(tenant)
                                                    }
                                                    title={
                                                        tenant.is_active
                                                            ? 'Desactivar'
                                                            : 'Activar'
                                                    }
                                                >
                                                    {tenant.is_active ? (
                                                        <FontAwesomeIcon
                                                            icon={faPowerOff}
                                                            className="h-3.5 w-3.5"
                                                        />
                                                    ) : (
                                                        <FontAwesomeIcon
                                                            icon={faBolt}
                                                            className="h-3.5 w-3.5"
                                                        />
                                                    )}
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-red-500 hover:bg-red-50 hover:text-red-600 dark:text-red-400 dark:hover:bg-red-900/20 dark:hover:text-red-300"
                                                    onClick={() =>
                                                        handleDelete(tenant)
                                                    }
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {tenants.last_page > 1 && (
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>
                            Mostrando {tenants.from}–{tenants.to} de{' '}
                            {tenants.total}
                        </span>
                        <div className="flex gap-1">
                            {tenants.links.map((link, i) => (
                                <button
                                    key={i}
                                    disabled={!link.url}
                                    onClick={() =>
                                        link.url && router.get(link.url)
                                    }
                                    className={`rounded px-3 py-1 text-xs transition-colors ${
                                        link.active
                                            ? 'bg-green-600 font-medium text-white'
                                            : link.url
                                              ? 'border border-green-200 text-green-700 hover:bg-green-50 dark:border-green-800 dark:text-green-400 dark:hover:bg-green-900/20'
                                              : 'cursor-not-allowed border border-gray-200 opacity-40 dark:border-gray-700'
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
        </>
    );
}

TenantsIndex.layout = {
    breadcrumbs: [{ title: 'Empresas', href: '/admin/tenants' }],
};
