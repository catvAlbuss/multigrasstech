import { Head, Link, router, usePage } from '@inertiajs/react';
import { CreditCard, Pencil, Plus, Trash2 } from 'lucide-react';
import { useEffect } from 'react';
import { toast } from 'sonner';
import Swal from 'sweetalert2';
import PlanController from '@/actions/App/Http/Controllers/Admin/PlanController';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { create } from '@/routes/admin/plans';
import type { AdminPlanListItem as Plan } from '@/types/admin';

const PERIOD_LABELS: Record<Plan['billing_period'], string> = {
    monthly: 'Mensual',
    yearly: 'Anual',
    lifetime: 'De por vida',
    contact: 'Contactar',
};

function formatPrice(plan: Plan) {
    if (plan.billing_period === 'contact' || plan.price === null) {
        return 'Consultar';
    }

    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'PEN',
    }).format(Number(plan.price));
}

export default function PlansIndex({ plans }: { plans: Plan[] }) {
    const { flash } = usePage<{
        flash: { success?: string; error?: string };
    }>().props;

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

    async function handleDelete(plan: Plan) {
        const result = await Swal.fire({
            icon: 'warning',
            title: '¿Eliminar plan?',
            text:
                plan.tenants_count > 0
                    ? `El plan tiene ${plan.tenants_count} empresa(s) asignada(s) y no puede eliminarse.`
                    : `Esta acción eliminará el plan "${plan.name}".`,
            showCancelButton: plan.tenants_count === 0,
            confirmButtonText:
                plan.tenants_count > 0 ? 'Entendido' : 'Sí, eliminar',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: plan.tenants_count > 0 ? '#16a34a' : '#dc2626',
            reverseButtons: true,
        });

        if (!result.isConfirmed || plan.tenants_count > 0) {
            return;
        }

        router.delete(PlanController.destroy.url(plan.id));
    }

    return (
        <>
            <Head title="Planes de pago" />

            <div className="space-y-6 px-4">
                <div className="flex items-center justify-between rounded-xl bg-green-700 px-6 py-5 text-white shadow-sm">
                    <div className="flex items-center gap-3">
                        <CreditCard className="h-6 w-6 text-green-200" />
                        <div>
                            <h1 className="text-xl font-semibold">
                                Planes de pago
                            </h1>
                            <p className="text-sm text-green-200">
                                {plans.length} plan
                                {plans.length !== 1 ? 'es' : ''} configurado
                                {plans.length !== 1 ? 's' : ''}
                            </p>
                        </div>
                    </div>
                    <Button
                        asChild
                        className="bg-white text-green-700 hover:bg-green-50 hover:text-green-800"
                    >
                        <Link href={create()}>
                            <Plus className="mr-1.5 h-4 w-4" />
                            Nuevo plan
                        </Link>
                    </Button>
                </div>

                <div className="overflow-hidden rounded-xl border border-green-100 bg-white shadow-sm dark:border-green-900/30 dark:bg-neutral-900">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-green-50 text-left text-green-900 dark:bg-green-900/30 dark:text-green-200">
                                <th className="px-4 py-3 font-medium">Plan</th>
                                <th className="px-4 py-3 font-medium">
                                    Precio
                                </th>
                                <th className="px-4 py-3 font-medium">
                                    Modalidad
                                </th>
                                <th className="px-4 py-3 font-medium">
                                    Empresas
                                </th>
                                <th className="px-4 py-3 font-medium">
                                    Estado
                                </th>
                                <th className="px-4 py-3 text-right font-medium">
                                    Acciones
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-green-50 dark:divide-green-900/20">
                            {plans.map((plan) => (
                                <tr
                                    key={plan.id}
                                    className="transition-colors hover:bg-green-50/50 dark:hover:bg-green-900/10"
                                >
                                    <td className="px-4 py-3">
                                        <div className="font-medium text-gray-900 dark:text-gray-100">
                                            {plan.name}
                                        </div>
                                        <div className="max-w-md truncate text-xs text-muted-foreground">
                                            {plan.description ?? plan.slug}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 font-semibold text-green-700 dark:text-green-400">
                                        {formatPrice(plan)}
                                    </td>
                                    <td className="px-4 py-3 text-muted-foreground">
                                        {PERIOD_LABELS[plan.billing_period]}
                                    </td>
                                    <td className="px-4 py-3">
                                        {plan.tenants_count}
                                    </td>
                                    <td className="px-4 py-3">
                                        <Badge
                                            variant={
                                                plan.is_active
                                                    ? 'default'
                                                    : 'outline'
                                            }
                                            className={
                                                plan.is_active
                                                    ? 'border-green-200 bg-green-100 text-green-700 hover:bg-green-100 dark:border-green-800 dark:bg-green-900/30 dark:text-green-300'
                                                    : 'text-gray-500'
                                            }
                                        >
                                            {plan.is_active
                                                ? 'Activo'
                                                : 'Inactivo'}
                                        </Badge>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex justify-end gap-1">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-green-700 dark:text-green-400"
                                                asChild
                                            >
                                                <Link
                                                    href={PlanController.edit.url(
                                                        plan.id,
                                                    )}
                                                >
                                                    <Pencil className="h-3.5 w-3.5" />
                                                </Link>
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-red-500 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                                                onClick={() =>
                                                    handleDelete(plan)
                                                }
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
}

PlansIndex.layout = {
    breadcrumbs: [{ title: 'Planes de pago', href: '/admin/plans' }],
};
