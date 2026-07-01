<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\Attendance;
use App\Models\Client;
use App\Models\Field;
use App\Models\Reservation;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class AttendanceController extends Controller
{
    public function index(Request $request): Response
    {
        $records = Attendance::query()
            ->with(['client:id,name', 'field:id,name', 'reservation:id,code'])
            ->when($request->search, fn ($q, $s) => $q->whereHas('client', fn ($q2) => $q2->where('name', 'like', "%{$s}%")))
            ->when($request->date, fn ($q, $d) => $q->whereDate('date', $d))
            ->when($request->field_id, fn ($q, $f) => $q->where('field_id', $f))
            ->orderByDesc('date')
            ->orderBy('check_in')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('tenant/attendance/index', [
            'records' => $records,
            'fields' => Field::where('status', 'active')->orderBy('name')->get(['id', 'name']),
            'filters' => [
                'search' => $request->search ?? '',
                'date' => $request->date ?? '',
                'field_id' => $request->field_id ?? '',
            ],
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('tenant/attendance/create', [
            'fields' => Field::where('status', 'active')->orderBy('name')->get(['id', 'name']),
            'clients' => Client::where('is_active', true)->orderBy('name')->get(['id', 'name']),
            'reservations' => Reservation::whereDate('date', today())
                ->with(['client:id,name', 'field:id,name'])
                ->orderBy('start_time')
                ->get(['id', 'code', 'client_id', 'field_id', 'start_time', 'end_time']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        abort_unless($request->user()->can('manage-attendance'), 403);

        $data = $request->validate([
            'reservation_id' => ['nullable', Rule::exists('reservations', 'id')->where('tenant_id', tenant('id'))],
            'client_id' => ['nullable', Rule::exists('clients', 'id')->where('tenant_id', tenant('id'))],
            'field_id' => ['nullable', Rule::exists('fields', 'id')->where('tenant_id', tenant('id'))],
            'date' => ['required', 'date'],
            'check_in' => ['required', 'date_format:H:i'],
            'check_out' => ['nullable', 'date_format:H:i', 'after:check_in'],
            'notes' => ['nullable', 'string'],
        ]);

        Attendance::create($data);

        return redirect()->route('attendance.index')
            ->with('success', 'Asistencia registrada correctamente.');
    }

    public function update(Request $request, Attendance $attendance): RedirectResponse
    {
        abort_unless($request->user()->can('manage-attendance'), 403);

        $data = $request->validate([
            'check_out' => ['nullable', 'date_format:H:i'],
            'notes' => ['nullable', 'string'],
        ]);

        $attendance->update($data);

        return redirect()->route('attendance.index')
            ->with('success', 'Asistencia actualizada correctamente.');
    }

    public function destroy(Request $request, Attendance $attendance): RedirectResponse
    {
        abort_unless($request->user()->can('manage-attendance'), 403);

        $attendance->delete();

        return redirect()->route('attendance.index')
            ->with('success', 'Registro eliminado correctamente.');
    }
}
