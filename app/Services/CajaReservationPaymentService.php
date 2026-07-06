<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Client;
use App\Models\Reservation;
use App\Models\Transaction;
use Illuminate\Support\Facades\DB;

class CajaReservationPaymentService
{
    /**
     * Registers a caja income transaction for a reservation, optionally
     * assigning/creating its client, and updates the reservation's paid
     * amount/status accordingly. Returns the amount that was actually
     * applied (0 if there was nothing pending to collect).
     */
    public function register(
        Reservation $reservation,
        string $paymentType,
        float $requestedAmount,
        ?string $documentType = null,
        ?int $attendedBy = null,
        int|string|null $clientId = null,
        ?string $newClientName = null,
        ?string $newClientPhone = null,
    ): float {
        $reservationTotal = round((float) $reservation->amount, 2);
        $alreadyPaid = round((float) $reservation->advance_amount, 2);
        $pendingAmount = max(0, round($reservationTotal - $alreadyPaid, 2));

        $amount = $paymentType === 'full'
            ? $pendingAmount
            : min(round($requestedAmount, 2), $pendingAmount);

        if ($amount <= 0) {
            return 0.0;
        }

        $resolvedClientId = $this->resolveClientId($clientId, $newClientName, $newClientPhone);

        DB::transaction(function () use ($reservation, $paymentType, $amount, $alreadyPaid, $reservationTotal, $documentType, $attendedBy, $resolvedClientId) {
            Transaction::create([
                'type' => 'income',
                'category' => 'reserva',
                'document_type' => $documentType,
                'description' => sprintf(
                    'Cobro de reserva %s - %s',
                    $reservation->code,
                    $reservation->field?->name ?? 'Cancha'
                ),
                'amount' => $amount,
                'date' => now()->toDateString(),
                'reservation_id' => $reservation->id,
                'attended_by' => $attendedBy,
                'notes' => $paymentType === 'full' ? 'Pago completo en caja.' : 'Adelanto en caja.',
            ]);

            $newPaidAmount = min($reservationTotal, round($alreadyPaid + $amount, 2));
            $reservation->forceFill([
                'advance_amount' => $newPaidAmount,
                'payment_method' => 'caja',
                'status' => $newPaidAmount >= $reservationTotal ? 'confirmed' : $reservation->status,
                ...($resolvedClientId ? ['client_id' => $resolvedClientId] : []),
            ])->save();
        });

        return $amount;
    }

    public function resolveClientId(int|string|null $clientId, ?string $newClientName, ?string $newClientPhone): ?int
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
}
