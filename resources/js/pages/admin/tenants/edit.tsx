import { Form, Head, usePage } from '@inertiajs/react';
import { Building2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import TenantController from '@/actions/App/Http/Controllers/Admin/TenantController';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { automaticExpirationLabel } from '@/lib/plan-expiration';
import type { AdminTenantEditPageProps as Props } from '@/types/admin';

export default function TenantEdit({ tenant, plans }: Props) {
    const { flash } = usePage<{ flash: { success?: string; error?: string } }>()
        .props;
    const [selectedPlanSlug, setSelectedPlanSlug] = useState(tenant.plan);
    const selectedPlan = plans.find((plan) => plan.slug === selectedPlanSlug);
    const planChanged = selectedPlanSlug !== tenant.plan;

    useEffect(() => {
        if (flash?.success) {
            toast.success(flash.success);
        }

        if (flash?.error) {
            toast.error(flash.error);
        }
    }, [flash]);

    return (
        <>
            <Head title={`Editar — ${tenant.name}`} />

            <div className="mx-auto max-w-2xl space-y-6">
                {/* Header */}
                <div className="flex items-center gap-3 rounded-xl bg-green-700 px-6 py-5 text-white shadow-sm">
                    <Building2 className="h-6 w-6 text-green-200" />
                    <div>
                        <h1 className="text-xl font-semibold">{tenant.name}</h1>
                        <p className="font-mono text-sm text-green-200">
                            {tenant.slug}.multigrass.com
                        </p>
                    </div>
                </div>

                {/* Form */}
                <div className="rounded-xl border border-green-100 bg-white p-6 shadow-sm dark:border-green-900/30 dark:bg-neutral-900">
                    <Form
                        {...TenantController.update.form(tenant.id)}
                        className="space-y-5"
                    >
                        {({ processing, errors }) => (
                            <>
                                <div className="grid gap-1.5">
                                    <Label htmlFor="name">
                                        Nombre de la empresa{' '}
                                        <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="name"
                                        name="name"
                                        defaultValue={tenant.name}
                                        placeholder="GrassVerde SAS"
                                        className="focus-visible:ring-green-500"
                                        required
                                    />
                                    <InputError message={errors.name} />
                                </div>

                                <div className="grid gap-1.5">
                                    <Label htmlFor="slug">Subdominio</Label>
                                    <div className="flex items-center gap-1">
                                        <Input
                                            id="slug"
                                            defaultValue={tenant.slug}
                                            className="bg-gray-50 text-muted-foreground dark:bg-input/30"
                                            disabled
                                        />
                                        <span className="shrink-0 text-sm text-muted-foreground">
                                            .multigrass.com
                                        </span>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        El subdominio no puede modificarse
                                        después de creado.
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-1.5">
                                        <Label htmlFor="email">
                                            Email de contacto
                                        </Label>
                                        <Input
                                            id="email"
                                            name="email"
                                            type="email"
                                            defaultValue={tenant.email ?? ''}
                                            placeholder="admin@empresa.com"
                                            className="focus-visible:ring-green-500"
                                        />
                                        <InputError message={errors.email} />
                                    </div>
                                    <div className="grid gap-1.5">
                                        <Label htmlFor="phone">Teléfono</Label>
                                        <Input
                                            id="phone"
                                            name="phone"
                                            type="tel"
                                            defaultValue={tenant.phone ?? ''}
                                            placeholder="+57 300 000 0000"
                                            className="focus-visible:ring-green-500"
                                        />
                                        <InputError message={errors.phone} />
                                    </div>
                                </div>

                                <div className="grid gap-1.5">
                                    <Label htmlFor="plan">
                                        Plan{' '}
                                        <span className="text-red-500">*</span>
                                    </Label>
                                    <select
                                        id="plan"
                                        name="plan"
                                        value={selectedPlanSlug}
                                        onChange={(event) =>
                                            setSelectedPlanSlug(
                                                event.target.value,
                                            )
                                        }
                                        className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm text-foreground shadow-xs focus-visible:ring-1 focus-visible:ring-green-500 focus-visible:outline-none dark:bg-input/30"
                                        required
                                    >
                                        {plans.map((plan) => (
                                            <option
                                                key={plan.id}
                                                value={plan.slug}
                                            >
                                                {plan.name}
                                            </option>
                                        ))}
                                    </select>
                                    <InputError message={errors.plan} />
                                    <p className="text-xs font-medium text-green-700 dark:text-green-400">
                                        {planChanged && selectedPlan
                                            ? automaticExpirationLabel(
                                                  selectedPlan.billing_period,
                                              )
                                            : tenant.plan_expires_at
                                              ? `Vigencia actual: ${new Date(tenant.plan_expires_at).toLocaleDateString('es-CO')}.`
                                              : 'Vigencia actual: de por vida.'}
                                    </p>
                                </div>

                                <div className="flex items-center gap-3">
                                    <input
                                        id="is_active"
                                        name="is_active"
                                        type="checkbox"
                                        defaultChecked={tenant.is_active}
                                        value="1"
                                        className="h-4 w-4 rounded border-green-300 text-green-600 focus:ring-green-500"
                                    />
                                    <Label
                                        htmlFor="is_active"
                                        className="cursor-pointer"
                                    >
                                        Empresa activa
                                    </Label>
                                </div>

                                <div className="flex items-center justify-end gap-3 border-t border-green-50 pt-4 dark:border-green-900/30">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => history.back()}
                                    >
                                        Cancelar
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={processing}
                                        className="bg-green-600 hover:bg-green-700"
                                    >
                                        {processing
                                            ? 'Guardando…'
                                            : 'Guardar cambios'}
                                    </Button>
                                </div>
                            </>
                        )}
                    </Form>
                </div>
            </div>
        </>
    );
}

TenantEdit.layout = {
    breadcrumbs: [
        { title: 'Empresas', href: '/admin/tenants' },
        { title: 'Editar', href: '#' },
    ],
};
