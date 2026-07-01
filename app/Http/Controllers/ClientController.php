<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\Client;
use App\Services\PeruDocumentLookupService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class ClientController extends Controller
{
    public function index(Request $request): Response
    {
        $clients = Client::query()
            ->when($request->search, fn ($q, $s) => $q->where('name', 'like', "%{$s}%")
                ->orWhere('email', 'like', "%{$s}%")
                ->orWhere('phone', 'like', "%{$s}%")
                ->orWhere('document_number', 'like', "%{$s}%"))
            ->withCount('reservations')
            ->orderBy('name')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('tenant/clients/index', [
            'clients' => $clients,
            'filters' => ['search' => $request->search ?? ''],
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('tenant/clients/create');
    }

    public function store(Request $request): RedirectResponse
    {
        abort_unless($request->user()->can('manage-clients'), 403);

        $data = $this->validatedData($request);

        $client = Client::create($data);

        if ($request->hasFile('image')) {
            $client->addMediaFromRequest('image')->toMediaCollection('image');
        }

        return redirect()->route('clients.index')
            ->with('success', 'Cliente creado correctamente.');
    }

    public function edit(Client $client): Response
    {
        return Inertia::render('tenant/clients/edit', ['client' => $client]);
    }

    public function update(Request $request, Client $client): RedirectResponse
    {
        abort_unless($request->user()->can('manage-clients'), 403);

        $data = $this->validatedData($request, $client);

        if ($request->boolean('remove_image')) {
            $client->clearMediaCollection('image');
        } elseif ($request->hasFile('image')) {
            $client->addMediaFromRequest('image')->toMediaCollection('image');
        }

        $client->update($data);

        return redirect()->route('clients.index')
            ->with('success', 'Cliente actualizado correctamente.');
    }

    public function destroy(Request $request, Client $client): RedirectResponse
    {
        abort_unless($request->user()->can('delete-clients'), 403);

        $client->clearMediaCollection('image');
        $client->delete();

        return redirect()->route('clients.index')
            ->with('success', 'Cliente eliminado correctamente.');
    }

    public function documentLookup(
        Request $request,
        PeruDocumentLookupService $lookupService,
    ): JsonResponse {
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
                'exists' => true,
                'client' => $client,
            ]);
        }

        try {
            return response()->json([
                'source' => 'external',
                'exists' => false,
                'client' => $lookupService->lookup(
                    $validated['document_type'],
                    $validated['document_number'],
                ),
            ]);
        } catch (\RuntimeException $exception) {
            Log::warning('Document lookup failed', [
                'document_type' => $validated['document_type'],
                'message' => $exception->getMessage(),
            ]);

            return response()->json(['message' => $exception->getMessage()], 503);
        }
    }

    /** @return array<string, mixed> */
    private function validatedData(Request $request, ?Client $client = null): array
    {
        $documentType = $request->string('document_type')->toString();

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:30'],
            'document_type' => ['nullable', Rule::in(['dni', 'ruc', 'pasaporte', 'sin_documento'])],
            'document_number' => [
                'nullable',
                'string',
                'max:50',
                Rule::unique('clients', 'document_number')
                    ->where(fn ($query) => $query
                        ->where('tenant_id', tenant('id'))
                        ->where('document_type', $documentType))
                    ->ignore($client?->id),
            ],
            'lookup_metadata' => ['nullable', 'array'],
            'lookup_metadata.source' => ['nullable', 'string', 'max:30'],
            'lookup_metadata.provider' => ['nullable', 'string', 'max:50'],
            'lookup_metadata.consulted_at' => ['nullable', 'date'],
            'lookup_metadata.status' => ['nullable', 'string', 'max:100'],
            'lookup_metadata.condition' => ['nullable', 'string', 'max:100'],
            'lookup_metadata.address' => ['nullable', 'string', 'max:500'],
            'lookup_metadata.ubigeo' => ['nullable', 'string', 'max:20'],
            'notes' => ['nullable', 'string'],
            'is_active' => ['required', 'boolean'],
            'image' => ['nullable', 'mimes:jpg,jpeg,png,webp', 'max:2048'], // 2MB max
            'remove_image' => ['nullable', 'boolean'],
        ]);

        $data['document_number'] = ! empty($data['document_number'])
            ? preg_replace('/\D+/', '', $data['document_number'])
            : null;

        return $data;
    }
}
