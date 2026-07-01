import { Link, usePage } from '@inertiajs/react';
import AppLogoIcon from '@/components/app-logo-icon';
import type { AuthLayoutProps } from '@/types';

function formatDomainName(value: string) {
    return value
        .split(/[-_\s.]+/)
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
}

function getHostnameBrand() {
    if (typeof window === 'undefined') {
        return null;
    }

    const hostname = window.location.hostname.toLowerCase();
    const centralHosts = ['localhost', '127.0.0.1', 'multigrass.test'];

    if (centralHosts.includes(hostname)) {
        return null;
    }

    return formatDomainName(hostname.split('.')[0] ?? '');
}

function currentOriginPath(path: string) {
    return path;
}

export default function AuthSplitLayout({
    children,
    title,
    description,
}: AuthLayoutProps) {
    const { name, tenant } = usePage().props;
    const displayName = tenant?.name ?? getHostnameBrand() ?? name;
    const homeHref = currentOriginPath('/');

    return (
        <div className="relative grid min-h-svh overflow-hidden bg-[#050806] text-white lg:grid-cols-[minmax(0,1.1fr)_minmax(420px,0.9fr)]">
            <div className="auth-panel relative hidden min-h-svh overflow-hidden text-white lg:flex lg:flex-col">
                <div
                    className="auth-sport-photo absolute inset-0 bg-cover bg-center"
                    style={{
                        backgroundImage:
                            "url('https://images.unsplash.com/photo-1556056504-5c7696c4c28d?auto=format&fit=crop&w=1600&q=85')",
                    }}
                />
                <div className="absolute inset-0 bg-linear-to-br from-emerald-950/90 via-emerald-900/58 to-zinc-950/65" />
                <div className="auth-field-scan absolute inset-0 opacity-40" />
                <div className="absolute inset-x-0 bottom-0 h-2/5 bg-linear-to-t from-zinc-950/80 to-transparent" />

                <Link
                    href={homeHref}
                    className="absolute top-12 left-1/2 z-20 flex -translate-x-1/2 items-center text-center text-4xl font-semibold tracking-tight drop-shadow-[0_10px_28px_rgba(0,0,0,0.45)] animate-[auth-field-in_700ms_ease-out_120ms_both]"
                >
                    <AppLogoIcon className="mr-3 size-10 fill-current text-white" />
                    {displayName}
                </Link>

                <div className="relative z-10 mx-auto flex min-h-svh w-full max-w-5xl flex-col items-center justify-center px-12 pt-32 text-center animate-[auth-form-in_780ms_ease-out_220ms_both]">
                    <p className="text-base font-semibold tracking-[0.32em] text-emerald-200 uppercase drop-shadow-[0_8px_18px_rgba(0,0,0,0.45)]">
                        {displayName}
                    </p>
                    <h2 className="mt-7 max-w-4xl text-6xl leading-[1.02] font-bold text-balance drop-shadow-[0_16px_34px_rgba(0,0,0,0.55)] xl:text-7xl">
                        Reservas, caja y clientes en un solo lugar.
                    </h2>
                    <p className="mt-7 max-w-2xl text-xl leading-8 text-emerald-50/90 drop-shadow-[0_8px_20px_rgba(0,0,0,0.45)]">
                        Controla horarios, pagos y operaciones diarias con una
                        vista pensada para complejos deportivos.
                    </p>
                </div>
            </div>

            <div className="relative flex min-h-svh w-full items-center justify-center bg-[radial-gradient(circle_at_20%_20%,rgba(34,197,94,0.14),transparent_28%),linear-gradient(135deg,#050806_0%,#090b0a_48%,#020403_100%)] px-6 py-10 sm:px-8 lg:px-12">
                <div className="pointer-events-none absolute inset-y-10 left-0 w-px bg-linear-to-b from-transparent via-emerald-300/25 to-transparent" />
                <div className="auth-form flex w-full max-w-sm flex-col justify-center space-y-7 rounded-lg border border-white/10 bg-white/[0.035] p-6 shadow-2xl shadow-black/30 backdrop-blur-sm sm:p-8">
                    <Link href={homeHref} className="relative z-20 flex flex-col items-center justify-center gap-2 text-center lg:hidden">
                        <AppLogoIcon className="h-10 fill-current text-white sm:h-12" />
                        <span className="text-base font-semibold">
                            {displayName}
                        </span>
                    </Link>
                    <div className="flex flex-col items-start gap-2 text-left">
                        <h1 className="text-2xl font-semibold">{title}</h1>
                        <p className="text-sm leading-6 text-balance text-zinc-400">
                            {description}
                        </p>
                    </div>
                    {children}
                </div>
            </div>
        </div>
    );
}
