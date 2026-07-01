import { Head, Link, router, usePage } from '@inertiajs/react';
import { format, parseISO } from 'date-fns';
import { CalendarDays, CheckCircle2, Layers, Pencil, Plus, Search, Trash2, XCircle } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import Swal from 'sweetalert2';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type {
    ReservationsIndexPageProps as Props,
    TenantReservation as Reservation,
} from '@/types/tenant';

const STATUS_COLORS: Record<string, string> = {
    pending:   'bg-amber-100 text-amber-700 border-amber-200',
    confirmed: 'bg-green-100 text-green-700 border-green-200',
    completed: 'bg-blue-100 text-blue-700 border-blue-200',
    cancelled: 'bg-red-100 text-red-700 border-red-200',
};
const STATUS_LABELS: Record<string, string> = {
    pending: 'Pendiente', confirmed: 'Confirmada', completed: 'Completada', cancelled: 'Cancelada',
};

export default function ReservationsIndex({ reservations, filters }: Props) {
    const { flash } = usePage<{ flash: { success?: string; error?: string } }>().props;
    const searchRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (flash?.success) {
toast.success(flash.success);
}

        if (flash?.error) {
toast.error(flash.error);
}
    }, [flash]);

    function handleSearch(e: React.FormEvent) {
        e.preventDefault();
        router.get('/reservations', { search: searchRef.current?.value ?? '', status: filters.status, date: filters.date }, { preserveState: true, replace: true });
    }

    function handleFilter(key: string, value: string) {
        router.get('/reservations', { ...filters, [key]: value }, { preserveState: true, replace: true });
    }

    async function handleDelete(r: Reservation) {
        const result = await Swal.fire({
            icon: 'warning',
            title: '¿Eliminar reservación?',
            text: `"${r.code}" será eliminada permanentemente.`,
            showCancelButton: true,
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#dc2626',
            reverseButtons: true,
        });

        if (result.isConfirmed) {
router.delete(`/reservations/${r.id}`);
}
    }

    function approveReservation(r: Reservation) {
        router.patch(`/reservations/${r.id}/approve`, {}, { preserveScroll: true });
    }

    function rejectReservation(r: Reservation) {
        router.patch(`/reservations/${r.id}/reject`, {}, { preserveScroll: true });
    }

    return (
        <>
            <Head title="Reservaciones" />

            <div className="space-y-6 px-4">
                <div className="flex items-center justify-between rounded-xl bg-green-700 px-6 py-5 text-white shadow-sm">
                    <div className="flex items-center gap-3">
                        <CalendarDays className="h-6 w-6 text-green-200" />
                        <div>
                            <h1 className="text-xl font-semibold">Reservaciones</h1>
                            <p className="text-sm text-green-200">{reservations.total} reservación{reservations.total !== 1 ? 'es' : ''}</p>
                        </div>
                    </div>
                    <Button asChild className="bg-white text-green-700 hover:bg-green-50">
                        <Link href="/reservations/create"><Plus className="mr-1.5 h-4 w-4" />Nueva Reservación</Link>
                    </Button>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-2">
                    <form onSubmit={handleSearch} className="flex flex-1 gap-2 min-w-[200px]">
                        <div className="relative flex-1">
                            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input ref={searchRef} defaultValue={filters.search} placeholder="Buscar código o cliente…" className="pl-9 focus-visible:ring-green-500" />
                        </div>
                        <Button type="submit" className="bg-green-600 hover:bg-green-700">Buscar</Button>
                    </form>
                    <Input type="date" defaultValue={filters.date} onChange={(e) => handleFilter('date', e.target.value)} className="w-40 focus-visible:ring-green-500" />
                    <select value={filters.status} onChange={(e) => handleFilter('status', e.target.value)} className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm text-foreground focus-visible:ring-1 focus-visible:ring-green-500 focus-visible:outline-none">
                        <option value="">Todos los estados</option>
                        <option value="pending">Pendiente</option>
                        <option value="confirmed">Confirmada</option>
                        <option value="completed">Completada</option>
                        <option value="cancelled">Cancelada</option>
                    </select>
                    {(filters.search || filters.status || filters.date) && (
                        <Button variant="outline" onClick={() => router.get('/reservations', {}, { replace: true })}>Limpiar</Button>
                    )}
                </div>

                <div className="overflow-hidden rounded-xl border border-green-100 bg-white shadow-sm dark:border-green-900/30 dark:bg-neutral-900">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-green-50 text-left text-green-900 dark:bg-green-900/30 dark:text-green-200">
                                <th className="px-4 py-3 font-medium">Código</th>
                                <th className="px-4 py-3 font-medium">Campo</th>
                                <th className="px-4 py-3 font-medium">Cliente</th>
                                <th className="px-4 py-3 font-medium">Fecha</th>
                                <th className="px-4 py-3 font-medium">Horario</th>
                                <th className="px-4 py-3 font-medium">Estado</th>
                                <th className="px-4 py-3 font-medium">Pago</th>
                                <th className="px-4 py-3 text-right font-medium">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-green-50 dark:divide-green-900/20">
                            {reservations.data.length === 0 ? (
                                <tr><td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">No hay reservaciones.</td></tr>
                            ) : (
                                reservations.data.map((r) => (
                                    <tr key={r.id} className="bg-white transition-colors hover:bg-green-50/50 dark:bg-neutral-900 dark:hover:bg-green-900/10">
                                        <td className="px-4 py-3 font-mono text-xs font-medium text-gray-700 dark:text-gray-300">{r.code}</td>
                                        <td className="px-4 py-3 text-gray-800 dark:text-gray-200">
                                            <div className="flex items-center gap-1.5">
                                                <span>{r.field?.name ?? '—'}</span>
                                                {r.field?.shared_group_id && (
                                                    <div className="group relative flex items-center">
                                                        <Layers className="h-3.5 w-3.5 text-blue-500" />
                                                        <span className="absolute bottom-full left-1/2 mb-2 w-max -translate-x-1/2 rounded bg-gray-900 px-2 py-1 text-[10px] text-white opacity-0 transition-opacity group-hover:opacity-100 dark:bg-gray-100 dark:text-gray-900 pointer-events-none">
                                                            Espacio Compartido
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="font-medium text-gray-900 dark:text-gray-100">{r.client?.name ?? 'Sin cliente'}</div>
                                            {r.client?.phone && <div className="text-xs text-muted-foreground">{r.client.phone}</div>}
                                        </td>
                                        <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400">{format(parseISO(r.date), 'dd/MM/yyyy')}</td>
                                        <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400">{r.start_time} – {r.end_time}</td>
                                        <td className="px-4 py-3">
                                            <Badge className={`border ${STATUS_COLORS[r.status] ?? ''}`}>{STATUS_LABELS[r.status] ?? r.status}</Badge>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="space-y-1 text-xs">
                                                <div className="font-medium text-gray-900 dark:text-gray-100">S/ {Number(r.amount).toLocaleString('es-PE', { minimumFractionDigits: 2 })}</div>
                                                {r.payment_method && (
                                                    <div className="text-muted-foreground">
                                                        {r.payment_method.toUpperCase()} · Adelanto S/ {Number(r.advance_amount ?? 0).toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                                                    </div>
                                                )}
                                                {r.payment_operation_number && (
                                                    <div className="font-mono text-[11px] text-emerald-700 dark:text-emerald-400">
                                                        Op: {r.payment_operation_number}
                                                    </div>
                                                )}
                                                {r.payment_proof_url && (
                                                    <a
                                                        href={r.payment_proof_url}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="inline-flex items-center rounded-md border border-emerald-200 px-2 py-1 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-50"
                                                    >
                                                        Ver comprobante
                                                    </a>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center justify-end gap-1">
                                                {r.status === 'pending' && r.payment_operation_number && (
                                                    <>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-emerald-600 hover:bg-emerald-50" onClick={() => approveReservation(r)}>
                                                            <CheckCircle2 className="h-3.5 w-3.5" />
                                                        </Button>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-amber-600 hover:bg-amber-50" onClick={() => rejectReservation(r)}>
                                                            <XCircle className="h-3.5 w-3.5" />
                                                        </Button>
                                                    </>
                                                )}
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-green-700 hover:bg-green-100" asChild>
                                                    <Link href={`/reservations/${r.id}/edit`}><Pencil className="h-3.5 w-3.5" /></Link>
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:bg-red-50" onClick={() => handleDelete(r)}>
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {reservations.last_page > 1 && (
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>Mostrando {reservations.from}–{reservations.to} de {reservations.total}</span>
                        <div className="flex gap-1">
                            {reservations.links.map((link, i) => (
                                <button key={i} disabled={!link.url} onClick={() => link.url && router.get(link.url)}
                                    className={`rounded px-3 py-1 text-xs transition-colors ${link.active ? 'bg-green-600 font-medium text-white' : link.url ? 'border border-green-200 text-green-700 hover:bg-green-50' : 'cursor-not-allowed border border-gray-200 opacity-40'}`}
                                    dangerouslySetInnerHTML={{ __html: link.label }} />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}

ReservationsIndex.layout = { breadcrumbs: [{ title: 'Reservaciones', href: '/reservations' }] };
