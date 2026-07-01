<?php

declare(strict_types=1);

namespace App\Services;

use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;
use RuntimeException;

class PeruDocumentLookupService
{
    /**
     * @return array{name: string, document_type: string, document_number: string, metadata: array<string, mixed>}
     */
    public function lookup(string $documentType, string $documentNumber): array
    {
        $token = (string) config('services.peru_documents.token');

        if ($token === '') {
            throw new RuntimeException('La consulta RENIEC/SUNAT no está configurada.');
        }

        $resource = $documentType === 'dni' ? 'dni' : 'ruc';
        $url = rtrim((string) config('services.peru_documents.url'), '/').'/'.$resource;

        try {
            $response = Http::acceptJson()
                ->withToken($token)
                ->timeout(8)
                ->retry(2, 200, throw: false)
                ->post($url, [$resource => $documentNumber]);
        } catch (ConnectionException $exception) {
            throw new RuntimeException('No fue posible conectar con RENIEC/SUNAT.', previous: $exception);
        }

        if (! $response->successful()) {
            throw new RuntimeException('RENIEC/SUNAT no devolvió información para el documento.');
        }

        $payload = $response->json();

        if (! is_array($payload) || ($payload['success'] ?? false) !== true) {
            throw new RuntimeException('RENIEC/SUNAT no devolvió información para el documento.');
        }

        $data = $payload['data'] ?? null;

        if (! is_array($data)) {
            throw new RuntimeException('La respuesta del proveedor no es válida.');
        }

        $name = $documentType === 'dni'
            ? trim((string) ($data['nombre_completo'] ?? ''))
            : trim((string) ($data['nombre_o_razon_social'] ?? ''));

        if ($name === '') {
            throw new RuntimeException('El proveedor no devolvió un nombre válido.');
        }

        return [
            'name' => $name,
            'document_type' => $documentType,
            'document_number' => $documentNumber,
            'metadata' => [
                'source' => $documentType === 'dni' ? 'reniec' : 'sunat',
                'provider' => 'json_pe',
                'consulted_at' => now()->toIso8601String(),
                'status' => $data['estado'] ?? null,
                'condition' => $data['condicion'] ?? null,
                'address' => $data['direccion_completa'] ?? ($data['direccion'] ?? null),
                'ubigeo' => $data['ubigeo_sunat'] ?? null,
            ],
        ];
    }
}
