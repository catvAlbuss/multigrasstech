import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowRight, CalendarCheck, ChartNoAxesCombined, Wallet } from 'lucide-react';
import { login } from '@/routes';
import { index as adminTenantsIndex } from '@/routes/admin/tenants';
import { dashboard } from '@/routes/tenant';
import type { Auth, TenantShared } from '@/types';

type WelcomeProps = {
    auth: Auth;
    name: string;
    tenant: TenantShared;
};

export default function Welcome() {
    const { auth, name, tenant } = usePage<WelcomeProps>().props;
    const isSuperAdmin = auth.user?.tenant_id === null;
    const displayName = tenant?.name ?? name;
    const isTenant = Boolean(tenant);

    const primaryHref = auth.user
        ? isSuperAdmin
            ? adminTenantsIndex()
            : dashboard()
        : login();

    return (
        <>
            <Head title={displayName} />

            <main className="relative min-h-svh overflow-hidden bg-[#050806] text-white">
                <div
                    className="absolute inset-0 scale-105 bg-cover bg-center opacity-70"
                    style={{
                        backgroundImage:
                            "url('https://images.unsplash.com/photo-1556056504-5c7696c4c28d?auto=format&fit=crop&w=1800&q=85')",
                    }}
                />
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-950/92 via-emerald-900/72 to-black/92" />
                <div className="auth-field-scan absolute inset-0 opacity-30" />

                <section className="relative z-10 mx-auto flex min-h-svh w-full max-w-6xl flex-col px-6 py-8 sm:px-10">
                    <header className="flex items-center justify-between">
                        <Link
                            href="/"
                            className="text-2xl font-semibold tracking-tight"
                        >
                            {displayName}
                        </Link>

                        <Link
                            href={primaryHref}
                            className="inline-flex items-center gap-2 rounded-md border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-black/20 backdrop-blur-sm transition hover:bg-white/15"
                        >
                            {auth.user
                                ? isSuperAdmin
                                    ? 'Panel admin'
                                    : 'Dashboard'
                                : 'Iniciar sesion'}
                            <ArrowRight className="size-4" />
                        </Link>
                    </header>

                    <div className="flex flex-1 items-center py-16">
                        <div className="max-w-4xl animate-[auth-form-in_760ms_ease-out_both]">
                            <p className="text-sm font-semibold tracking-[0.34em] text-emerald-200 uppercase">
                                {isTenant ? 'Bienvenido a tu grass' : 'Multigrass'}
                            </p>
                            <h1 className="mt-6 text-5xl leading-[1.02] font-bold text-balance drop-shadow-[0_18px_40px_rgba(0,0,0,0.55)] sm:text-7xl">
                                {isTenant
                                    ? `${displayName} listo para reservar y operar.`
                                    : 'Gestiona complejos deportivos desde una sola plataforma.'}
                            </h1>
                            <p className="mt-6 max-w-2xl text-lg leading-8 text-emerald-50/85 sm:text-xl">
                                Controla reservas, caja, clientes, productos y
                                reportes diarios con una experiencia pensada
                                para canchas de grass.
                            </p>

                            <div className="mt-9 flex flex-wrap gap-3">
                                <Link
                                    href={primaryHref}
                                    className="inline-flex h-11 items-center gap-2 rounded-md bg-emerald-400 px-5 text-sm font-semibold text-emerald-950 shadow-xl shadow-emerald-950/35 transition hover:bg-emerald-300"
                                >
                                    {auth.user
                                        ? 'Ir al panel'
                                        : isTenant
                                          ? `Entrar a ${displayName}`
                                          : 'Entrar'}
                                    <ArrowRight className="size-4" />
                                </Link>
                            </div>
                        </div>
                    </div>

                    <div className="grid gap-3 pb-8 sm:grid-cols-3">
                        {[
                            {
                                icon: CalendarCheck,
                                label: 'Reservas',
                                text: 'Horarios y disponibilidad al dia.',
                            },
                            {
                                icon: Wallet,
                                label: 'Caja',
                                text: 'Ventas, cobros y salidas controladas.',
                            },
                            {
                                icon: ChartNoAxesCombined,
                                label: 'Reportes',
                                text: 'Indicadores claros para decidir rapido.',
                            },
                        ].map((item) => (
                            <div
                                key={item.label}
                                className="rounded-lg border border-white/10 bg-white/[0.06] p-4 shadow-xl shadow-black/20 backdrop-blur-sm"
                            >
                                <item.icon className="size-5 text-emerald-200" />
                                <h2 className="mt-3 font-semibold">
                                    {item.label}
                                </h2>
                                <p className="mt-1 text-sm leading-6 text-emerald-50/70">
                                    {item.text}
                                </p>
                            </div>
                        ))}
                    </div>
                </section>
            </main>
        </>
    );
}
