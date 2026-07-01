import { Form, Head } from '@inertiajs/react';
import { UserCheck } from 'lucide-react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { todayLocalIso } from '@/lib/utils';
import type { AttendanceCreatePageProps as Props } from '@/types/tenant';

export default function AttendanceCreate({ fields, clients, reservations }: Props) {
    return (
        <>
            <Head title="Registrar Asistencia" />

            <div className="mx-auto max-w-2xl space-y-6">
                <div className="flex items-center gap-3 rounded-xl bg-green-700 px-6 py-5 text-white shadow-sm">
                    <UserCheck className="h-6 w-6 text-green-200" />
                    <div>
                        <h1 className="text-xl font-semibold">Registrar Asistencia</h1>
                        <p className="text-sm text-green-200">Registra la entrada de un cliente</p>
                    </div>
                </div>

                <div className="rounded-xl border border-green-100 bg-white p-6 shadow-sm dark:border-green-900/30 dark:bg-neutral-900">
                    <Form action="/attendance" method="post" className="space-y-5">
                        {({ processing, errors }) => (
                            <>
                                {reservations.length > 0 && (
                                    <div className="grid gap-1.5">
                                        <Label htmlFor="reservation_id">Reservación de hoy (opcional)</Label>
                                        <select id="reservation_id" name="reservation_id" className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm text-foreground shadow-xs focus-visible:ring-1 focus-visible:ring-green-500 focus-visible:outline-none dark:bg-input/30">
                                            <option value="">Sin reservación vinculada</option>
                                            {reservations.map((r) => <option key={r.id} value={r.id}>{r.code} — {r.start_time}–{r.end_time}</option>)}
                                        </select>
                                        <InputError message={errors.reservation_id} />
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-1.5">
                                        <Label htmlFor="client_id">Cliente</Label>
                                        <select id="client_id" name="client_id" className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm text-foreground shadow-xs focus-visible:ring-1 focus-visible:ring-green-500 focus-visible:outline-none dark:bg-input/30">
                                            <option value="">Sin cliente</option>
                                            {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                                        </select>
                                        <InputError message={errors.client_id} />
                                    </div>
                                    <div className="grid gap-1.5">
                                        <Label htmlFor="field_id">Campo</Label>
                                        <select id="field_id" name="field_id" className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm text-foreground shadow-xs focus-visible:ring-1 focus-visible:ring-green-500 focus-visible:outline-none dark:bg-input/30">
                                            <option value="">Sin campo</option>
                                            {fields.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
                                        </select>
                                        <InputError message={errors.field_id} />
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-4">
                                    <div className="grid gap-1.5">
                                        <Label htmlFor="date">Fecha <span className="text-red-500">*</span></Label>
                                        <Input id="date" name="date" type="date" defaultValue={todayLocalIso()} className="focus-visible:ring-green-500" required />
                                        <InputError message={errors.date} />
                                    </div>
                                    <div className="grid gap-1.5">
                                        <Label htmlFor="check_in">Hora entrada <span className="text-red-500">*</span></Label>
                                        <Input id="check_in" name="check_in" type="time" defaultValue={new Date().toTimeString().slice(0, 5)} className="focus-visible:ring-green-500" required />
                                        <InputError message={errors.check_in} />
                                    </div>
                                    <div className="grid gap-1.5">
                                        <Label htmlFor="check_out">Hora salida</Label>
                                        <Input id="check_out" name="check_out" type="time" className="focus-visible:ring-green-500" />
                                        <InputError message={errors.check_out} />
                                    </div>
                                </div>

                                <div className="grid gap-1.5">
                                    <Label htmlFor="notes">Notas</Label>
                                    <textarea id="notes" name="notes" rows={2} className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm text-foreground shadow-xs focus-visible:ring-1 focus-visible:ring-green-500 focus-visible:outline-none dark:bg-input/30" />
                                    <InputError message={errors.notes} />
                                </div>

                                <div className="flex items-center justify-end gap-3 border-t border-green-50 pt-4 dark:border-green-900/30">
                                    <Button type="button" variant="outline" onClick={() => history.back()}>Cancelar</Button>
                                    <Button type="submit" disabled={processing} className="bg-green-600 hover:bg-green-700">
                                        {processing ? 'Guardando…' : 'Registrar Entrada'}
                                    </Button>
                                </div>
                            </>
                        )}
                    </Form>
                </div>
            </div>
        </>
    );
}

AttendanceCreate.layout = {
    breadcrumbs: [
        { title: 'Asistencia', href: '/attendance' },
        { title: 'Registrar Asistencia', href: '/attendance/create' },
    ],
};
