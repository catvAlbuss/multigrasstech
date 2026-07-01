import { Mail, MapPin, Phone } from 'lucide-react';
import type { TenantProfileData } from '@/types/tenant';

export function ContactFooter({
    profile,
    tenantName,
}: {
    profile: TenantProfileData | null;
    tenantName: string;
}) {
    return (
        <footer id="contacto" className="border-t border-white/5 bg-[#020810] py-12">
            <div className="mx-auto max-w-8xl px-5 sm:px-10">
                <div className="flex flex-col items-start justify-between gap-8 sm:flex-row sm:items-center">
                    <div>
                        <p className="text-lg font-bold text-white">{tenantName}</p>
                        <p className="mt-1 text-sm text-white/40">
                            Complejo deportivo
                        </p>
                    </div>

                    <div className="flex flex-col gap-3 text-sm text-white/60">
                        {profile?.phone && (
                            <a
                                href={`tel:${profile.phone}`}
                                className="flex items-center gap-2 transition hover:text-white"
                            >
                                <Phone className="size-4 text-emerald-400" />
                                {profile.phone}
                            </a>
                        )}
                        {profile?.address && (
                            <span className="flex items-center gap-2">
                                <MapPin className="size-4 text-emerald-400" />
                                {profile.address}
                            </span>
                        )}
                        {profile?.email && (
                            <a
                                href={`mailto:${profile.email}`}
                                className="flex items-center gap-2 transition hover:text-white"
                            >
                                <Mail className="size-4 text-emerald-400" />
                                {profile.email}
                            </a>
                        )}
                    </div>
                </div>

                <div className="mt-8 border-t border-white/5 pt-6 text-center text-xs text-white/20">
                    (c) {new Date().getFullYear()} {tenantName}. Powered by
                    Multigrass.
                </div>
            </div>
        </footer>
    );
}
