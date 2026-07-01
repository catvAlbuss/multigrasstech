import type { ReactNode } from 'react';

export function BotBubble({ children }: { children: ReactNode }) {
    return (
        <div className="ml-3 max-w-[90%] rounded-2xl rounded-tl-sm bg-slate-100 px-3 py-2 text-xs leading-5 text-slate-700 shadow-sm">
            {children}
        </div>
    );
}
