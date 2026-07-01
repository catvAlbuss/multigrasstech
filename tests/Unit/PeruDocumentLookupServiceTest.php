<?php

declare(strict_types=1);

namespace Tests\Unit;

use App\Services\PeruDocumentLookupService;
use Illuminate\Support\Facades\Http;
use RuntimeException;
use Tests\TestCase;

class PeruDocumentLookupServiceTest extends TestCase
{
    public function test_it_normalizes_a_dni_response(): void
    {
        config()->set('services.peru_documents', [
            'url' => 'https://documents.test/api',
            'token' => 'secret',
        ]);
        Http::fake([
            'documents.test/api/dni*' => Http::response([
                'success' => true,
                'message' => 'exito',
                'data' => [
                    'numero' => '12345678',
                    'nombre_completo' => 'CASTILLO TERRONES, JOSE PEDRO',
                    'nombres' => 'JOSE PEDRO',
                    'apellido_paterno' => 'CASTILLO',
                    'apellido_materno' => 'TERRONES',
                ],
            ]),
        ]);

        $result = app(PeruDocumentLookupService::class)->lookup('dni', '12345678');

        $this->assertSame('CASTILLO TERRONES, JOSE PEDRO', $result['name']);
        $this->assertSame('reniec', $result['metadata']['source']);
        Http::assertSent(function ($request) {
            return $request->method() === 'POST'
                && $request->hasHeader('Authorization', 'Bearer secret')
                && $request['dni'] === '12345678';
        });
    }

    public function test_it_normalizes_a_ruc_response(): void
    {
        config()->set('services.peru_documents', [
            'url' => 'https://documents.test/api',
            'token' => 'secret',
        ]);
        Http::fake([
            'documents.test/api/ruc*' => Http::response([
                'success' => true,
                'message' => 'exito',
                'data' => [
                    'ruc' => '20123456789',
                    'nombre_o_razon_social' => 'MULTIGRASS SAC',
                    'estado' => 'ACTIVO',
                    'condicion' => 'HABIDO',
                    'direccion_completa' => 'AV. PRINCIPAL 123, LIMA - LIMA - LIMA',
                    'ubigeo_sunat' => '150101',
                ],
            ]),
        ]);

        $result = app(PeruDocumentLookupService::class)->lookup('ruc', '20123456789');

        $this->assertSame('MULTIGRASS SAC', $result['name']);
        $this->assertSame('sunat', $result['metadata']['source']);
        $this->assertSame('ACTIVO', $result['metadata']['status']);
        $this->assertSame('150101', $result['metadata']['ubigeo']);
        Http::assertSent(function ($request) {
            return $request->method() === 'POST'
                && $request['ruc'] === '20123456789';
        });
    }

    public function test_it_throws_when_provider_reports_not_found(): void
    {
        config()->set('services.peru_documents', [
            'url' => 'https://documents.test/api',
            'token' => 'secret',
        ]);
        Http::fake([
            'documents.test/api/dni*' => Http::response([
                'success' => false,
                'message' => 'No se encontró DNI',
            ], 404),
        ]);

        $this->expectException(RuntimeException::class);

        app(PeruDocumentLookupService::class)->lookup('dni', '00000000');
    }
}
