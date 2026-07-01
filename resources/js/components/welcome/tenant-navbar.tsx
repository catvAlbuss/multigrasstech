import { Link } from '@inertiajs/react';
import { LayoutDashboard } from 'lucide-react';

export function TenantNavbar({
    tenantName,
    dashboardHref,
    isAuthenticated,
    loginHref,
}: {
    tenantName: string;
    dashboardHref: string;
    isAuthenticated: boolean;
    loginHref: string;
}) {
    return (
        <nav className="sticky top-0 z-50 flex h-16 items-center justify-between border-b border-white/5 bg-[#050d1a]/95 px-4 backdrop-blur-md sm:px-10">
            <a
                href="#inicio"
                className="min-w-0 truncate text-lg font-bold tracking-tight text-white"
            >
                {tenantName}
            </a>

            <div className="hidden gap-8 text-sm font-medium text-white/70 md:flex">
                <a href="#inicio" className="transition hover:text-white">
                    Inicio
                </a>
                <a href="#servicios" className="transition hover:text-white">
                    Servicios
                </a>
                <a href="#contacto" className="transition hover:text-white">
                    Contacto
                </a>
            </div>

            <Link
                href={isAuthenticated ? dashboardHref : loginHref}
                className="inline-flex h-10 items-center gap-2 rounded-md border border-white/20 bg-white/5 px-3 text-sm font-medium text-white transition hover:bg-white/10 sm:px-4"
            >
                {isAuthenticated ? (
                    <>
                        <LayoutDashboard className="size-4" />
                        Dashboard
                    </>
                ) : (
                    'Iniciar sesion'
                )}
            </Link>
        </nav>
    );
}
