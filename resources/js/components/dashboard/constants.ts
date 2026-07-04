export const ROLE_CONFIG = {
    admin: {
        label: 'Administrador',
        color: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300',
    },
    operator: {
        label: 'Operador',
        color: 'border-blue-500/40 bg-blue-500/10 text-blue-300',
    },
    viewer: {
        label: 'Visualizador',
        color: 'border-slate-600 bg-slate-800/80 text-slate-300',
    },
} as const;

export const PLAN_LABELS: Record<string, string> = {
    basic: 'Basic',
    premium: 'Premium',
    contact: 'Contáctenos',
    pro: 'Pro',
    enterprise: 'Enterprise',
};

export const CATEGORY_COLORS: Record<string, string> = {
    'bg-emerald-400': '#34d399',
    'bg-green-500': '#22c55e',
    'bg-blue-400': '#60a5fa',
    'bg-blue-500': '#3b82f6',
    'bg-amber-400': '#fbbf24',
    'bg-yellow-400': '#facc15',
};
