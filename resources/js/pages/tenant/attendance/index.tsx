import { Head, Link, router, usePage } from '@inertiajs/react';
import { Plus, Search, Trash2, UserCheck } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import Swal from 'sweetalert2';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type {
    AttendanceIndexPageProps as Props,
    TenantAttendanceRecord as AttendanceRecord,
} from '@/types/tenant';

export default function AttendanceIndex({ records, fields, filters }: Props) {
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
        router.get('/attendance', { search: searchRef.current?.value ?? '', date: filters.date, field_id: filters.field_id }, { preserveState: true, replace: true });
    }

    function handleFilter(key: string, value: string) {
        router.get('/attendance', { ...filters, [key]: value }, { preserveState: true, replace: true });
    }

    async function handleDelete(record: AttendanceRecord) {
        const result = await Swal.fire({
            icon: 'warning',
            title: '¿Eliminar registro?',
            text: 'Este registro de asistencia será eliminado.',
            showCancelButton: true,
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#dc2626',
            reverseButtons: true,
        });

        if (result.isConfirmed) {
router.delete(`/attendance/${record.id}`);
}
    }

    return (
        <>
            <Head title="Asistencia" />

            <div className="space-y-6 px-4">
                <div className="flex items-center justify-between rounded-xl bg-green-700 px-6 py-5 text-white shadow-sm">
                    <div className="flex items-center gap-3">
                        <UserCheck className="h-6 w-6 text-green-200" />
                        <div>
                            <h1 className="text-xl font-semibold">Asistencia</h1>
                            <p className="text-sm text-green-200">{records.total} registro{records.total !== 1 ? 's' : ''}</p>
                        </div>
                    </div>
                    <Button asChild className="bg-white text-green-700 hover:bg-green-50">
                        <Link href="/attendance/create"><Plus className="mr-1.5 h-4 w-4" />Registrar Asistencia</Link>
                    </Button>
                </div>

                <div className="flex flex-wrap gap-2">
                    <form onSubmit={handleSearch} className="flex flex-1 gap-2 min-w-[200px]">
                        <div className="relative flex-1">
                            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input ref={searchRef} defaultValue={filters.search} placeholder="Buscar por cliente…" className="pl-9 focus-visible:ring-green-500" />
                        </div>
                        <Button type="submit" className="bg-green-600 hover:bg-green-700">Buscar</Button>
                    </form>
                    <Input type="date" defaultValue={filters.date} onChange={(e) => handleFilter('date', e.target.value)} className="w-40 focus-visible:ring-green-500" />
                    <select value={filters.field_id} onChange={(e) => handleFilter('field_id', e.target.value)} className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm text-foreground focus-visible:ring-1 focus-visible:ring-green-500 focus-visible:outline-none">
                        <option value="">Todos los campos</option>
                        {fields.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
                    </select>
                    {(filters.search || filters.date || filters.field_id) && (
                        <Button variant="outline" onClick={() => router.get('/attendance', {}, { replace: true })}>Limpiar</Button>
                    )}
                </div>

                <div className="overflow-hidden rounded-xl border border-green-100 bg-white shadow-sm dark:border-green-900/30 dark:bg-neutral-900">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-green-50 text-left text-green-900 dark:bg-green-900/30 dark:text-green-200">
                                <th className="px-4 py-3 font-medium">Cliente</th>
                                <th className="px-4 py-3 font-medium">Campo</th>
                                <th className="px-4 py-3 font-medium">Reservación</th>
                                <th className="px-4 py-3 font-medium">Fecha</th>
                                <th className="px-4 py-3 font-medium">Entrada</th>
                                <th className="px-4 py-3 font-medium">Salida</th>
                                <th className="px-4 py-3 text-right font-medium">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-green-50 dark:divide-green-900/20">
                            {records.data.length === 0 ? (
                                <tr><td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">No hay registros de asistencia.</td></tr>
                            ) : (
                                records.data.map((record) => (
                                    <tr key={record.id} className="bg-white transition-colors hover:bg-green-50/50 dark:bg-neutral-900 dark:hover:bg-green-900/10">
                                        <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">{record.client?.name ?? '—'}</td>
                                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{record.field?.name ?? '—'}</td>
                                        <td className="px-4 py-3 font-mono text-xs text-gray-600 dark:text-gray-400">{record.reservation?.code ?? '—'}</td>
                                        <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400">{new Date(record.date).toLocaleDateString('es-CO')}</td>
                                        <td className="px-4 py-3 text-gray-800 dark:text-gray-200">{record.check_in}</td>
                                        <td className="px-4 py-3">
                                            {record.check_out
                                                ? <span className="text-gray-800 dark:text-gray-200">{record.check_out}</span>
                                                : <span className="text-xs text-amber-600 font-medium">En curso</span>}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center justify-end gap-1">
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:bg-red-50" onClick={() => handleDelete(record)}>
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

                {records.last_page > 1 && (
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>Mostrando {records.from}–{records.to} de {records.total}</span>
                        <div className="flex gap-1">
                            {records.links.map((link, i) => (
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

AttendanceIndex.layout = { breadcrumbs: [{ title: 'Asistencia', href: '/attendance' }] };
