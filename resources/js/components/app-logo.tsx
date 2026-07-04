import AppLogoIcon from '@/components/app-logo-icon';

export default function AppLogo() {
    return (
        <>
            <div className="flex aspect-square size-10 items-center justify-center rounded-lg border border-emerald-400/40 bg-emerald-500/10 text-emerald-300 shadow-[0_0_24px_rgba(34,197,94,0.16)]">
                <AppLogoIcon className="size-7" />
            </div>
            <div className="ml-2 grid flex-1 text-left">
                <span className="truncate text-sm leading-tight font-black tracking-wide text-white">
                    GRASSVERDE
                </span>
                <span className="truncate text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-400">
                    Complejo deportivo
                </span>
            </div>
        </>
    );
}
