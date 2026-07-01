<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\Field;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class FieldController extends Controller
{
    public function index(Request $request): Response
    {
        $fields = Field::query()
            ->with(['media', 'sharedFields'])
            ->when($request->search, fn ($q, $s) => $q->where('name', 'like', "%{$s}%"))
            ->orderBy('name')
            ->paginate(12)
            ->withQueryString();

        $allFields = Field::orderBy('name')->get(['id', 'name', 'shared_group_id']);

        return Inertia::render('tenant/fields/index', [
            'fields' => $fields,
            'allFields' => $allFields,
            'filters' => ['search' => $request->search ?? ''],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        abort_unless($request->user()->can('manage-fields'), 403);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'surface_type' => ['required', 'in:artificial,grass,concrete,clay'],
            'sport_type' => ['nullable', 'in:futbol,voley,basketball,padel,tennis,natacion,multisport'],
            'capacity' => ['required', 'integer', 'min:0'],
            'hourly_rate' => ['required', 'numeric', 'min:0'],
            'status' => ['required', 'in:active,maintenance,inactive,blocked'],
            'is_featured' => ['sometimes', 'boolean'],
            'image' => ['nullable', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
            'shared_with' => ['nullable', 'array'],
            'shared_with.*' => [Rule::exists('fields', 'id')->where('tenant_id', tenant('id'))],
        ]);

        $sharedWithIds = $data['shared_with'] ?? [];
        unset($data['image'], $data['shared_with']);
        $data['is_featured'] = $request->boolean('is_featured');

        // Determine shared_group_id
        if (! empty($sharedWithIds)) {
            $existingGroup = Field::whereIn('id', $sharedWithIds)->whereNotNull('shared_group_id')->first();
            $data['shared_group_id'] = $existingGroup ? $existingGroup->shared_group_id : Str::uuid()->toString();
        }

        $field = Field::create($data);

        if ($request->hasFile('image')) {
            $field->addMediaFromRequest('image')->toMediaCollection('image');
        }

        // Update peers
        if (! empty($sharedWithIds)) {
            Field::whereIn('id', $sharedWithIds)->update(['shared_group_id' => $field->shared_group_id]);
        }

        return redirect()->route('fields.index')
            ->with('success', 'Campo creado correctamente.');
    }

    public function update(Request $request, Field $field): RedirectResponse
    {
        abort_unless($request->user()->can('manage-fields'), 403);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'surface_type' => ['required', 'in:artificial,grass,concrete,clay'],
            'sport_type' => ['nullable', 'in:futbol,voley,basketball,padel,tennis,natacion,multisport'],
            'capacity' => ['required', 'integer', 'min:0'],
            'hourly_rate' => ['required', 'numeric', 'min:0'],
            'status' => ['required', 'in:active,maintenance,inactive,blocked'],
            'is_featured' => ['sometimes', 'boolean'],
            'image' => ['nullable', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
            'remove_image' => ['sometimes', 'boolean'],
            'shared_with' => ['nullable', 'array'],
            'shared_with.*' => [Rule::exists('fields', 'id')->where('tenant_id', tenant('id'))],
        ]);

        $sharedWithIds = $data['shared_with'] ?? [];
        unset($data['image'], $data['remove_image'], $data['shared_with']);
        $data['is_featured'] = $request->boolean('is_featured');

        // Handle shared_group_id
        if (empty($sharedWithIds)) {
            // If they removed all shared fields, un-share it
            // Wait, we just clear its shared_group_id. Other fields keep theirs.
            $data['shared_group_id'] = null;
        } else {
            // Find a group ID from the selected fields, or keep its own, or create a new one
            $existingGroup = Field::whereIn('id', $sharedWithIds)->whereNotNull('shared_group_id')->first();
            $data['shared_group_id'] = $existingGroup
                ? $existingGroup->shared_group_id
                : ($field->shared_group_id ?? Str::uuid()->toString());
        }

        $field->update($data);

        if ($request->boolean('remove_image')) {
            $field->clearMediaCollection('image');
        }

        if ($request->hasFile('image')) {
            $field->clearMediaCollection('image');
            $field->addMediaFromRequest('image')->toMediaCollection('image');
        }

        // If they linked fields, we must update the selected fields to join the group
        if (! empty($sharedWithIds)) {
            Field::whereIn('id', $sharedWithIds)->update(['shared_group_id' => $field->shared_group_id]);
        }

        return redirect()->route('fields.index')
            ->with('success', 'Campo actualizado correctamente.');
    }

    public function destroy(Request $request, Field $field): RedirectResponse
    {
        abort_unless($request->user()->can('delete-fields'), 403);

        $field->delete();

        return redirect()->route('fields.index')
            ->with('success', 'Campo eliminado correctamente.');
    }
}
