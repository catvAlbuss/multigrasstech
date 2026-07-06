<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\Client;
use App\Models\Field;
use App\Models\Reservation;
use App\Models\TenantProfile;
use App\Models\User;
use App\Services\CajaReservationPaymentService;
use App\Services\PeruDocumentLookupService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class ReservationController extends Controller
{
    public function index(Request $request): Response
    {
        // Default to today so the page always opens scoped to the current day;
        // an explicitly blanked date (?date=) is treated as "show all dates".
        $date = $request->has('date') ? $request->string('date')->toString() : now()->toDateString();

        $reservations = Reservation::query()
            ->with(['field:id,name,shared_group_id', 'client:id,name,phone'])
            ->when($request->search, fn ($q, $s) => $q->where('code', 'like', "%{$s}%")
                ->orWhereHas('client', fn ($q2) => $q2->where('name', 'like', "%{$s}%")))
            ->when($request->status, fn ($q, $s) => $q->where('status', $s))
            ->when($date !== '', fn ($q) => $q->whereDate('date', $date))
            ->orderByDesc('date')
            ->orderBy('start_time')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('tenant/reservations/index', [
            'reservations' => $reservations,
            'fields' => Field::where('status', 'active')->orderBy('name')->get(['id', 'name', 'hourly_rate']),
            'clients' => Client::where('is_active', true)->orderBy('name')->get(['id', 'name', 'phone']),
            'staff' => User::where('tenant_id', tenant('id'))->orderBy('name')->get(['id', 'name']),
            'booking_hours' => $this->bookingHours(),
            'filters' => [
                'search' => $request->search ?? '',
                'status' => $request->status ?? '',
                'date' => $date,
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        abort_unless($request->user()->can('manage-reservations'), 403);

        $validated = $request->validate([
            'field_id' => ['required', Rule::exists('fields', 'id')->where('tenant_id', tenant('id'))],
            'client_id' => ['nullable', Rule::exists('clients', 'id')->where('tenant_id', tenant('id'))],
            'new_client_name' => ['nullable', 'string', 'max:120'],
            'new_client_phone' => ['nullable', 'string', 'max:30'],
            'date' => ['required', 'date'],
            'start_time' => ['required', 'date_format:H:i'],
            'end_time' => ['required', 'date_format:H:i', 'after:start_time'],
            'status' => ['required', 'in:pending,confirmed,completed,cancelled'],
            'amount' => ['required', 'numeric', 'min:0'],
            'notes' => ['nullable', 'string'],
            'mark_as_paid' => ['nullable', 'boolean'],
        ]);

        $validated['client_id'] = $this->resolveClientId(
            $validated['client_id'] ?? null,
            $validated['new_client_name'] ?? null,
            $validated['new_client_phone'] ?? null,
        );

        $markAsPaid = (bool) ($validated['mark_as_paid'] ?? false);

        $data = $this->normalizeReservationData(collect($validated)
            ->only(['field_id', 'client_id', 'date', 'start_time', 'end_time', 'status', 'amount', 'notes'])
            ->toArray());

        $this->ensureWithinTenantBookingHours($data['start_time'], $data['end_time']);
        $this->ensureNoOverlap($data['field_id'], $data['date'], $data['start_time'], $data['end_time']);

        if ($markAsPaid) {
            $data['status'] = 'completed';
            $data['advance_amount'] = $data['amount'];
            $data['payment_method'] = 'historico';
        }

        Reservation::create($data);

        if ($markAsPaid) {
            return redirect()->route('reservations.index')
                ->with('success', 'Reserva histórica registrada correctamente.');
        }

        return redirect()->route('reservations.index', ['date' => $data['date']])
            ->with('success', 'Reservación creada correctamente.');
    }

    /**
     * Creates a reservation and immediately collects its deposit/full payment
     * in one atomic step — used by the "Guardar y cobrar en caja" flow so a
     * reservation only ever exists in the database once it's been paid (or
     * explicitly marked historical via store()). Mirrors CajaController's
     * reservationPayment() JSON contract so the same checkout dialog can post
     * to either endpoint.
     */
    public function storeAndCharge(Request $request, CajaReservationPaymentService $paymentService): JsonResponse
    {
        abort_unless(
            $request->user()->can('manage-reservations') && $request->user()->can('manage-caja'),
            403
        );

        $validated = $request->validate([
            'field_id' => ['required', Rule::exists('fields', 'id')->where('tenant_id', tenant('id'))],
            'date' => ['required', 'date'],
            'start_time' => ['required', 'date_format:H:i'],
            'end_time' => ['required', 'date_format:H:i', 'after:start_time'],
            'status' => ['required', 'in:pending,confirmed,completed,cancelled'],
            'amount' => ['required', 'numeric', 'min:0'],
            'notes' => ['nullable', 'string'],
            'payment_type' => ['required', Rule::in(['advance', 'full'])],
            'document_type' => ['nullable', Rule::in(['boleta', 'factura'])],
            'attended_by' => ['nullable', 'integer', Rule::exists('users', 'id')->where('tenant_id', tenant('id'))],
            'client_id' => ['nullable', Rule::exists('clients', 'id')->where('tenant_id', tenant('id'))],
            'new_client_name' => ['nullable', 'string', 'max:120'],
            'new_client_phone' => ['nullable', 'string', 'max:30'],
            'new_client_document_type' => ['nullable', Rule::in(['dni', 'ruc'])],
            'new_client_document_number' => ['nullable', 'string', 'max:20'],
            'new_client_email' => ['nullable', 'email', 'max:120'],
        ]);

        $data = $this->normalizeReservationData(collect($validated)
            ->only(['field_id', 'date', 'start_time', 'end_time', 'status', 'amount', 'notes'])
            ->toArray());

        $this->ensureWithinTenantBookingHours($data['start_time'], $data['end_time']);
        $this->ensureNoOverlap($data['field_id'], $data['date'], $data['start_time'], $data['end_time']);

        try {
            $reservation = DB::transaction(function () use ($data, $validated, $paymentService) {
                $reservation = Reservation::create($data);

                $chargeAmount = $validated['payment_type'] === 'full'
                    ? (float) $data['amount']
                    : round((float) $data['amount'] * 0.5, 2);

                $applied = $paymentService->register(
                    $reservation,
                    $validated['payment_type'],
                    $chargeAmount,
                    $validated['document_type'] ?? null,
                    $validated['attended_by'] ?? null,
                    $validated['client_id'] ?? null,
                    $validated['new_client_name'] ?? null,
                    $validated['new_client_phone'] ?? null,
                    $validated['new_client_document_type'] ?? null,
                    $validated['new_client_document_number'] ?? null,
                    $validated['new_client_email'] ?? null,
                );

                if ($applied <= 0) {
                    throw new \RuntimeException('No hay saldo pendiente por cobrar en esta reserva.');
                }

                return $reservation;
            });
        } catch (\RuntimeException $exception) {
            return response()->json([
                'success' => false,
                'message' => $exception->getMessage(),
            ], 422);
        }

        return response()->json([
            'success' => true,
            'reservation' => $reservation->fresh(['field', 'client']),
        ]);
    }

    public function calendarSummary(Request $request): JsonResponse
    {
        $data = $request->validate([
            'from' => ['required', 'date'],
            'to' => ['required', 'date', 'after_or_equal:from'],
        ]);

        $from = Carbon::parse($data['from'])->startOfDay();
        $to = Carbon::parse($data['to'])->startOfDay();

        if ($from->diffInDays($to) > 45) {
            $to = $from->copy()->addDays(45);
        }

        $rows = DB::table('reservations')
            ->where('tenant_id', tenant('id'))
            ->whereBetween('date', [$from->toDateString(), $to->toDateString()])
            ->selectRaw("date, count(*) as total, coalesce(sum(amount), 0) as amount,
                sum(case when status = 'pending' then 1 else 0 end) as pending,
                sum(case when status = 'confirmed' then 1 else 0 end) as confirmed,
                sum(case when status = 'completed' then 1 else 0 end) as completed,
                sum(case when status = 'cancelled' then 1 else 0 end) as cancelled")
            ->groupBy('date')
            ->get();

        return response()->json($rows);
    }

    public function publicStore(Request $request)
    {
        $data = $this->normalizeReservationData($request->validate([
            'client_name' => ['required', 'string', 'max:120'],
            'client_phone' => ['required', 'string', 'max:30'],
            'client_email' => ['nullable', 'email', 'max:120'],
            'document_type' => ['nullable', Rule::in(['dni', 'ruc'])],
            'document_number' => ['nullable', 'string', 'max:20'],
            'field_id' => ['required', Rule::exists('fields', 'id')->where('tenant_id', tenant('id'))],
            'date' => ['required', 'date', 'after_or_equal:today'],
            'start_time' => ['required', 'date_format:H:i'],
            'duration_hours' => ['required', 'integer', 'min:1', 'max:6'],
            'payment_method' => ['required', 'in:yape,plin'],
            'advance_amount' => ['required', 'numeric', 'min:1'],
            'payment_operation_number' => ['required', 'string', 'max:80'],
            'payment_proof' => ['required', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
            'notes' => ['nullable', 'string', 'max:500'],
        ]));

        $startTime = $data['start_time'];
        $endTime = Carbon::createFromFormat('H:i', $startTime)
            ->addHours($data['duration_hours'])
            ->format('H:i');

        $this->ensureWithinTenantBookingHours($startTime, $endTime);
        $this->ensureNoOverlap($data['field_id'], $data['date'], $startTime, $endTime);

        $field = Field::findOrFail($data['field_id']);
        $amount = round((float) $field->hourly_rate * $data['duration_hours'], 2);
        $requiredAdvance = round($amount * 0.5, 2);

        if (abs($data['advance_amount'] - $requiredAdvance) > 0.01) {
            throw ValidationException::withMessages([
                'advance_amount' => 'El adelanto debe ser el 50% del total: S/ '.number_format($requiredAdvance, 2, '.', ''),
            ]);
        }

        $client = null;

        if (! empty($data['document_type']) && ! empty($data['document_number'])) {
            $client = Client::query()
                ->where('document_type', $data['document_type'])
                ->where('document_number', $data['document_number'])
                ->first();
        }

        $client ??= Client::query()
            ->where('phone', $data['client_phone'])
            ->first();

        if ($client) {
            $client->fill([
                'name' => $data['client_name'],
                'email' => $data['client_email'] ?? $client->email,
                'phone' => $data['client_phone'],
                'document_type' => $data['document_type'] ?? $client->document_type,
                'document_number' => $data['document_number'] ?? $client->document_number,
                'is_active' => true,
            ])->save();
        } else {
            $client = Client::create([
                'name' => $data['client_name'],
                'phone' => $data['client_phone'],
                'email' => $data['client_email'] ?? null,
                'document_type' => $data['document_type'] ?? null,
                'document_number' => $data['document_number'] ?? null,
                'is_active' => true,
            ]);
        }

        $reservation = Reservation::create([
            'field_id' => $field->id,
            'client_id' => $client->id,
            'date' => $data['date'],
            'start_time' => $startTime,
            'end_time' => $endTime,
            'status' => 'pending',
            'amount' => $amount,
            'payment_method' => $data['payment_method'],
            'advance_amount' => $requiredAdvance,
            'payment_operation_number' => $data['payment_operation_number'],
            'payment_expires_at' => now()->addMinutes(10),
            'notes' => $data['notes'] ?? null,
        ]);

        $reservation->addMediaFromRequest('payment_proof')
            ->toMediaCollection('payment_proof');

        return response()->json([
            'message' => 'Reserva enviada. Revisaremos tu adelanto para confirmarla.',
            'reservation' => [
                'code' => $reservation->code,
                'status' => $reservation->status,
            ],
        ], 201);
    }

    public function publicAvailability(Request $request)
    {
        $data = $request->validate([
            'field_id' => ['required', Rule::exists('fields', 'id')->where('tenant_id', tenant('id'))],
            'date' => ['required', 'date', 'after_or_equal:today'],
        ]);

        $field = Field::findOrFail($data['field_id']);
        $fieldIds = $this->relatedFieldIds($field);

        $reservations = Reservation::whereIn('field_id', $fieldIds)
            ->where('date', $data['date'])
            ->whereIn('status', ['pending', 'confirmed'])
            ->get(['start_time', 'end_time']);

        $profile = TenantProfile::first();
        $startHour = (int) substr((string) ($profile?->booking_start_time ?? '06:00'), 0, 2);
        $endHour = (int) substr((string) ($profile?->booking_end_time ?? '23:00'), 0, 2);

        $slots = [];
        for ($hour = $startHour; $hour < $endHour; $hour++) {
            $start = str_pad((string) $hour, 2, '0', STR_PAD_LEFT).':00';
            $end = str_pad((string) ($hour + 1), 2, '0', STR_PAD_LEFT).':00';
            $available = ! $reservations->contains(function ($reservation) use ($start, $end) {
                return substr((string) $reservation->start_time, 0, 5) < $end
                    && substr((string) $reservation->end_time, 0, 5) > $start;
            });

            $slots[] = [
                'start_time' => $start,
                'end_time' => $end,
                'available' => $available,
            ];
        }

        return response()->json([
            'field' => [
                'id' => $field->id,
                'name' => $field->name,
                'shared' => $field->shared_group_id !== null,
            ],
            'date' => $data['date'],
            'slots' => $slots,
        ]);
    }

    public function publicDocumentLookup(
        Request $request,
        PeruDocumentLookupService $lookupService,
    ) {
        $validated = $request->validate([
            'document_type' => ['required', Rule::in(['dni', 'ruc'])],
            'document_number' => [
                'required',
                'digits_between:8,11',
                Rule::when($request->string('document_type')->toString() === 'dni', ['digits:8']),
                Rule::when($request->string('document_type')->toString() === 'ruc', ['digits:11']),
            ],
        ]);

        $client = Client::query()
            ->where('document_type', $validated['document_type'])
            ->where('document_number', $validated['document_number'])
            ->first();

        if ($client) {
            return response()->json([
                'source' => 'database',
                'client' => [
                    'name' => $client->name,
                    'phone' => $client->phone,
                    'email' => $client->email,
                    'document_type' => $client->document_type,
                    'document_number' => $client->document_number,
                ],
            ]);
        }

        try {
            return response()->json([
                'source' => 'external',
                'client' => $lookupService->lookup(
                    $validated['document_type'],
                    $validated['document_number'],
                ),
            ]);
        } catch (\RuntimeException $exception) {
            return response()->json([
                'message' => $exception->getMessage(),
            ], 404);
        }
    }

    public function publicAssistantReply(Request $request)
    {
        $data = $request->validate([
            'message' => ['required', 'string', 'max:500'],
            'context' => ['nullable', 'array'],
        ]);

        $apiKey = (string) config('services.openai.api_key');
        if ($apiKey === '') {
            return response()->json([
                'reply' => $this->publicAssistantFallbackReply(
                    (string) $data['message'],
                    $data['context'] ?? [],
                ),
                'ai_enabled' => false,
            ]);
        }

        try {
            $response = Http::withToken($apiKey)
                ->acceptJson()
                ->timeout(12)
                ->post('https://api.openai.com/v1/responses', [
                    'model' => config('services.openai.model'),
                    'input' => [
                        [
                            'role' => 'system',
                            'content' => 'Eres un asistente IA de reservas de canchas. Responde en espanol, breve, profesional y puntual. Ayuda a reservar, consultar ubicacion, deportes, precios, dias y horas disponibles. No inventes disponibilidad, precios ni datos del campo; usa solo el contexto recibido. Indica que el adelanto para reservar es automatico del 50% del total.',
                        ],
                        [
                            'role' => 'user',
                            'content' => json_encode([
                                'message' => $data['message'],
                                'context' => $data['context'] ?? [],
                            ], JSON_UNESCAPED_UNICODE),
                        ],
                    ],
                ]);

            if (! $response->successful()) {
                throw new \RuntimeException('OpenAI request failed.');
            }

            return response()->json([
                'reply' => $response->json('output_text')
                    ?? $response->json('output.0.content.0.text')
                    ?? 'Te ayudo con tu reserva. Continuemos con el siguiente dato.',
                'ai_enabled' => true,
            ]);
        } catch (\Throwable $exception) {
            Log::warning('OpenAI assistant failed', ['message' => $exception->getMessage()]);

            return response()->json([
                'reply' => $this->publicAssistantFallbackReply(
                    (string) $data['message'],
                    $data['context'] ?? [],
                ),
                'ai_enabled' => false,
            ]);
        }
    }

    private function publicAssistantFallbackReply(string $message, array $context): string
    {
        $sport = (string) ($context['sport'] ?? '');
        $field = (string) ($context['field'] ?? '');
        $date = (string) ($context['date'] ?? '');
        $availableSlots = $context['available_slots'] ?? [];
        $requiredAdvance = isset($context['required_advance'])
            ? (float) $context['required_advance']
            : 0.0;

        if ($sport !== '' && $field === '') {
            return "Perfecto. Te mostrare solo los espacios configurados para {$sport}.";
        }

        if ($field !== '' && $date !== '') {
            if (is_array($availableSlots) && count($availableSlots) > 0) {
                $firstSlots = implode(', ', array_slice($availableSlots, 0, 4));

                return "Para {$field}, las primeras horas disponibles son: {$firstSlots}.";
            }

            return "Para {$field}, elige una fecha disponible y reviso los horarios libres.";
        }

        if (str_contains(mb_strtolower($message), 'pagar') && $requiredAdvance > 0) {
            return 'El adelanto automatico es el 50%: S/ '.number_format($requiredAdvance, 2, '.', '').'.';
        }

        return 'Te ayudo a reservar con los datos disponibles del complejo.';
    }

    public function edit(Reservation $reservation): Response
    {
        return Inertia::render('tenant/reservations/edit', [
            'reservation' => $reservation,
            'fields' => Field::where('status', 'active')->orderBy('name')->get(['id', 'name', 'hourly_rate']),
            'clients' => Client::where('is_active', true)->orderBy('name')->get(['id', 'name', 'phone']),
        ]);
    }

    public function update(Request $request, Reservation $reservation): RedirectResponse
    {
        abort_unless($request->user()->can('manage-reservations'), 403);

        $data = $this->normalizeReservationData($request->validate([
            'field_id' => ['required', Rule::exists('fields', 'id')->where('tenant_id', tenant('id'))],
            'client_id' => ['nullable', Rule::exists('clients', 'id')->where('tenant_id', tenant('id'))],
            'date' => ['required', 'date'],
            'start_time' => ['required', 'date_format:H:i'],
            'end_time' => ['required', 'date_format:H:i', 'after:start_time'],
            'status' => ['required', 'in:pending,confirmed,completed,cancelled'],
            'amount' => ['required', 'numeric', 'min:0'],
            'notes' => ['nullable', 'string'],
        ]));

        if (in_array($data['status'], ['pending', 'confirmed'])) {
            $this->ensureNoOverlap($data['field_id'], $data['date'], $data['start_time'], $data['end_time'], $reservation->id);
        }

        $reservation->update($data);

        return redirect()->route('reservations.index')
            ->with('success', 'Reservación actualizada correctamente.');
    }

    public function approve(Request $request, Reservation $reservation): RedirectResponse
    {
        abort_unless($request->user()->can('manage-reservations'), 403);

        $reservation->update(['status' => 'confirmed']);

        return back()->with('success', 'Reserva aprobada correctamente.');
    }

    public function reject(Request $request, Reservation $reservation): RedirectResponse
    {
        abort_unless($request->user()->can('manage-reservations'), 403);

        $reservation->update(['status' => 'cancelled']);

        return back()->with('success', 'Reserva rechazada correctamente.');
    }

    private function resolveClientId(int|string|null $clientId, ?string $newClientName, ?string $newClientPhone): ?int
    {
        if ($clientId) {
            return (int) $clientId;
        }

        if (! $newClientName) {
            return null;
        }

        $client = null;

        if ($newClientPhone) {
            $client = Client::where('phone', $newClientPhone)->first();
        }

        $client ??= Client::create([
            'name' => $newClientName,
            'phone' => $newClientPhone,
            'is_active' => true,
        ]);

        return $client->id;
    }

    public function destroy(Request $request, Reservation $reservation): RedirectResponse
    {
        abort_unless($request->user()->can('manage-reservations'), 403);

        $reservation->delete();

        return redirect()->route('reservations.index')
            ->with('success', 'Reservación eliminada correctamente.');
    }

    public function availability(Request $request)
    {
        $data = $request->validate([
            'field_id' => ['required', Rule::exists('fields', 'id')->where('tenant_id', tenant('id'))],
            'date' => ['required', 'date'],
            'ignore_id' => ['nullable', Rule::exists('reservations', 'id')->where('tenant_id', tenant('id'))],
        ]);

        $fieldId = $data['field_id'];
        $date = $data['date'];

        $field = Field::findOrFail($fieldId);

        $fieldIds = [$fieldId];
        if ($field->shared_group_id) {
            $fieldIds = Field::where('shared_group_id', $field->shared_group_id)->pluck('id')->toArray();
        }

        $query = Reservation::whereIn('field_id', $fieldIds)
            ->where('date', $date)
            ->whereIn('status', ['pending', 'confirmed']);

        if (! empty($data['ignore_id'])) {
            $query->where('id', '!=', $data['ignore_id']);
        }

        $reservations = $query->get(['start_time', 'end_time']);

        return response()->json($reservations);
    }

    private function bookingHours(): array
    {
        $profile = TenantProfile::first();

        return [
            'start' => substr((string) ($profile?->booking_start_time ?? '06:00'), 0, 5),
            'end' => substr((string) ($profile?->booking_end_time ?? '23:00'), 0, 5),
        ];
    }

    private function ensureNoOverlap(int $fieldId, string $date, string $startTime, string $endTime, ?int $ignoreReservationId = null): void
    {
        $field = Field::findOrFail($fieldId);
        $fieldIds = $this->relatedFieldIds($field);

        $overlapQuery = Reservation::whereIn('field_id', $fieldIds)
            ->where('date', $date)
            ->whereIn('status', ['pending', 'confirmed'])
            ->where(function ($query) use ($startTime, $endTime) {
                $query->where('start_time', '<', $endTime)
                    ->where('end_time', '>', $startTime);
            });

        if ($ignoreReservationId) {
            $overlapQuery->where('id', '!=', $ignoreReservationId);
        }

        if ($overlapQuery->exists()) {
            throw ValidationException::withMessages([
                'start_time' => 'El horario seleccionado se cruza con otra reservación en este espacio físico.',
            ]);
        }
    }

    private function normalizeReservationData(array $data): array
    {
        if (array_key_exists('field_id', $data)) {
            $data['field_id'] = (int) $data['field_id'];
        }

        if (array_key_exists('client_id', $data)) {
            $data['client_id'] = $data['client_id'] === null || $data['client_id'] === ''
                ? null
                : (int) $data['client_id'];
        }

        if (array_key_exists('duration_hours', $data)) {
            $data['duration_hours'] = (int) $data['duration_hours'];
        }

        if (array_key_exists('amount', $data)) {
            $data['amount'] = (float) $data['amount'];
        }

        if (array_key_exists('advance_amount', $data)) {
            $data['advance_amount'] = (float) $data['advance_amount'];
        }

        return $data;
    }

    private function ensureWithinTenantBookingHours(string $startTime, string $endTime): void
    {
        $profile = TenantProfile::first();
        $tenantStart = substr((string) ($profile?->booking_start_time ?? '06:00'), 0, 5);
        $tenantEnd = substr((string) ($profile?->booking_end_time ?? '23:00'), 0, 5);

        if ($startTime < $tenantStart || $endTime > $tenantEnd) {
            throw ValidationException::withMessages([
                'start_time' => "El horario debe estar entre {$tenantStart} y {$tenantEnd}.",
            ]);
        }
    }

    /** @return array<int> */
    private function relatedFieldIds(Field $field): array
    {
        if (! $field->shared_group_id) {
            return [$field->id];
        }

        return Field::where('shared_group_id', $field->shared_group_id)
            ->pluck('id')
            ->toArray();
    }
}
