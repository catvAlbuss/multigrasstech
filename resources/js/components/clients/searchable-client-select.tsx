import { Check, Search, X } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import type { TenantClientOption } from '@/types/tenant';

interface SearchableClientSelectProps<T extends TenantClientOption> {
    clients: T[];
    selectedId: string;
    onSelect: (client: T | null) => void;
    placeholder?: string;
    className?: string;
}

/**
 * Type-to-filter dropdown over an already-loaded client list. There's no
 * combobox primitive in this codebase yet (no cmdk/popover), so this is a
 * small hand-rolled panel over Input rather than new UI infrastructure.
 * Generic over T so callers with a richer client shape (e.g. CajaClientOption,
 * which also carries document/email data) get it back intact in onSelect.
 */
export function SearchableClientSelect<T extends TenantClientOption>({
    clients,
    selectedId,
    onSelect,
    placeholder = 'Buscar cliente por nombre o teléfono...',
    className,
}: SearchableClientSelectProps<T>) {
    const [query, setQuery] = useState('');
    const [focused, setFocused] = useState(false);
    const blurTimeout = useRef<number | null>(null);

    const selected = useMemo(
        () => clients.find((client) => String(client.id) === selectedId) ?? null,
        [clients, selectedId],
    );

    const matches = useMemo(() => {
        const term = query.trim().toLowerCase();

        if (!term) {
            return clients.slice(0, 8);
        }

        return clients
            .filter(
                (client) =>
                    client.name.toLowerCase().includes(term) ||
                    (client.phone ?? '').toLowerCase().includes(term),
            )
            .slice(0, 8);
    }, [clients, query]);

    function handleFocus() {
        if (blurTimeout.current) {
            window.clearTimeout(blurTimeout.current);
        }

        setFocused(true);
    }

    function handleBlur() {
        // Delay so a click on a dropdown item registers before the panel unmounts.
        blurTimeout.current = window.setTimeout(() => setFocused(false), 150);
    }

    if (selected) {
        return (
            <div
                className={`flex h-10 items-center justify-between rounded-md border border-input bg-transparent px-3 text-sm dark:bg-input/30 ${className ?? ''}`}
            >
                <span className="flex min-w-0 items-center gap-1.5 truncate">
                    <Check className="size-3.5 shrink-0 text-green-600" />
                    <span className="truncate font-medium">{selected.name}</span>
                    {selected.phone && (
                        <span className="shrink-0 text-muted-foreground">
                            · {selected.phone}
                        </span>
                    )}
                </span>
                <button
                    type="button"
                    onClick={() => {
                        setQuery('');
                        onSelect(null);
                    }}
                    className="text-muted-foreground hover:text-foreground"
                    aria-label="Quitar selección"
                >
                    <X className="size-3.5" />
                </button>
            </div>
        );
    }

    return (
        <div className={`relative ${className ?? ''}`}>
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={handleFocus}
                onBlur={handleBlur}
                placeholder={placeholder}
                className="pl-9"
            />

            {focused && (
                <div className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-md border bg-popover p-1 shadow-md">
                    {matches.length === 0 ? (
                        <p className="px-3 py-2 text-xs text-muted-foreground">
                            Sin coincidencias.
                        </p>
                    ) : (
                        matches.map((client) => (
                            <button
                                key={client.id}
                                type="button"
                                onClick={() => {
                                    setQuery('');
                                    setFocused(false);
                                    onSelect(client);
                                }}
                                className="flex w-full items-center justify-between rounded-sm px-3 py-2 text-left text-sm hover:bg-accent"
                            >
                                <span className="truncate font-medium">{client.name}</span>
                                {client.phone && (
                                    <span className="shrink-0 text-xs text-muted-foreground">
                                        {client.phone}
                                    </span>
                                )}
                            </button>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
