<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\ProductVariant;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ProductController extends Controller
{
    public function index(Request $request): Response
    {
        $products = Product::query()
            ->with(['variants' => fn ($q) => $q->where('is_active', true)])
            ->when($request->search, fn ($q, $s) => $q->where('name', 'like', "%{$s}%")
                ->orWhere('category', 'like', "%{$s}%"))
            ->when($request->category, fn ($q, $c) => $q->where('category', $c))
            ->orderBy('name')
            ->paginate(15)
            ->withQueryString();

        // Load media for products and their variants
        $products->getCollection()->each(function (Product $product) {
            $product->loadMedia('image');
            $product->variants->each(fn ($v) => $v->loadMedia('image'));
        });

        return Inertia::render('tenant/products/index', [
            'products' => $products,
            'filters' => [
                'search' => $request->search ?? '',
                'category' => $request->category ?? '',
            ],
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('tenant/products/create');
    }

    public function store(Request $request): RedirectResponse
    {
        abort_unless($request->user()->can('manage-products'), 403);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'category' => ['required', 'in:bebida,snack,protector,equipo,otro'],
            'description' => ['nullable', 'string'],
            'is_active' => ['boolean'],
            'igv_type' => ['required', 'in:gravado,exonerado,inafecto'],
            'has_variants' => ['boolean'],
            // Simple product fields
            'sku' => ['nullable', 'string', 'max:50'],
            'unit' => ['nullable', 'string', 'max:30'],
            'stock' => ['nullable', 'integer', 'min:0'],
            'price' => ['nullable', 'numeric', 'min:0'],
            'image' => ['nullable', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
            // Variants
            'variants' => ['nullable', 'array'],
            'variants.*.label' => ['required_with:variants', 'string', 'max:100'],
            'variants.*.sku' => ['nullable', 'string', 'max:50'],
            'variants.*.unit' => ['required_with:variants', 'string', 'max:30'],
            'variants.*.price' => ['required_with:variants', 'numeric', 'min:0'],
            'variants.*.stock' => ['required_with:variants', 'integer', 'min:0'],
            'variants.*.is_active' => ['boolean'],
            'variants.*.sort_order' => ['integer'],
            'variants.*.image' => ['nullable', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
        ]);

        $hasVariants = (bool) ($data['has_variants'] ?? false);

        if ($hasVariants) {
            $data['sku'] = null;
            $data['unit'] = null;
            $data['stock'] = null;
            $data['price'] = null;
        }

        $product = Product::create($data);

        // Main product image (for simple products or fallback)
        if ($request->hasFile('image')) {
            $product->addMediaFromRequest('image')->toMediaCollection('image');
        }

        // Create variants with their images
        if ($hasVariants) {
            foreach ($data['variants'] as $index => $variantData) {
                $variant = $product->variants()->create([
                    'tenant_id' => $product->tenant_id,
                    'label' => $variantData['label'],
                    'sku' => $variantData['sku'] ?? null,
                    'unit' => $variantData['unit'],
                    'price' => $variantData['price'],
                    'stock' => $variantData['stock'],
                    'is_active' => $variantData['is_active'] ?? true,
                    'sort_order' => $variantData['sort_order'] ?? $index,
                ]);

                if ($request->hasFile("variants.{$index}.image")) {
                    $variant->addMediaFromRequest("variants.{$index}.image")
                        ->toMediaCollection('image');
                }
            }
        }

        return redirect()->route('products.index')
            ->with('success', 'Producto creado correctamente.');
    }

    public function edit(Product $product): Response
    {
        $product->load('variants');
        $product->loadMedia('image');
        $product->variants->each(fn ($v) => $v->loadMedia('image'));

        return Inertia::render('tenant/products/edit', ['product' => $product]);
    }

    public function update(Request $request, Product $product): RedirectResponse
    {
        abort_unless($request->user()->can('manage-products'), 403);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'category' => ['required', 'in:bebida,snack,protector,equipo,otro'],
            'description' => ['nullable', 'string'],
            'is_active' => ['boolean'],
            'igv_type' => ['required', 'in:gravado,exonerado,inafecto'],
            'has_variants' => ['boolean'],
            'sku' => ['nullable', 'string', 'max:50'],
            'unit' => ['nullable', 'string', 'max:30'],
            'stock' => ['nullable', 'integer', 'min:0'],
            'price' => ['nullable', 'numeric', 'min:0'],
            'image' => ['nullable', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
            'remove_image' => ['nullable', 'boolean'],
            // Variants
            'variants' => ['nullable', 'array'],
            'variants.*.id' => ['nullable', 'integer'],
            'variants.*.label' => ['required_with:variants', 'string', 'max:100'],
            'variants.*.sku' => ['nullable', 'string', 'max:50'],
            'variants.*.unit' => ['required_with:variants', 'string', 'max:30'],
            'variants.*.price' => ['required_with:variants', 'numeric', 'min:0'],
            'variants.*.stock' => ['required_with:variants', 'integer', 'min:0'],
            'variants.*.is_active' => ['boolean'],
            'variants.*.sort_order' => ['integer'],
            'variants.*.remove_image' => ['nullable', 'boolean'],
            'variants.*.image' => ['nullable', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
        ]);

        $hasVariants = (bool) ($data['has_variants'] ?? false);

        if ($hasVariants) {
            $data['sku'] = null;
            $data['unit'] = null;
            $data['stock'] = null;
            $data['price'] = null;
        }

        // Product image handling
        if ($request->boolean('remove_image')) {
            $product->clearMediaCollection('image');
        } elseif ($request->hasFile('image')) {
            $product->addMediaFromRequest('image')->toMediaCollection('image');
        }

        $product->update($data);

        // Sync variants
        if ($hasVariants) {
            $incomingIds = collect($data['variants'])->pluck('id')->filter()->all();
            // Delete removed variants
            $product->variants()->whereNotIn('id', $incomingIds)->each(function ($v) {
                $v->clearMediaCollection('image');
                $v->delete();
            });

            foreach ($data['variants'] as $index => $variantData) {
                if (! empty($variantData['id'])) {
                    $variant = ProductVariant::find($variantData['id']);
                    if ($variant && $variant->product_id === $product->id) {
                        $variant->update([
                            'label' => $variantData['label'],
                            'sku' => $variantData['sku'] ?? null,
                            'unit' => $variantData['unit'],
                            'price' => $variantData['price'],
                            'stock' => $variantData['stock'],
                            'is_active' => $variantData['is_active'] ?? true,
                            'sort_order' => $variantData['sort_order'] ?? $index,
                        ]);

                        if ($request->boolean("variants.{$index}.remove_image")) {
                            $variant->clearMediaCollection('image');
                        } elseif ($request->hasFile("variants.{$index}.image")) {
                            $variant->addMediaFromRequest("variants.{$index}.image")
                                ->toMediaCollection('image');
                        }
                    }
                } else {
                    $variant = $product->variants()->create([
                        'tenant_id' => $product->tenant_id,
                        'label' => $variantData['label'],
                        'sku' => $variantData['sku'] ?? null,
                        'unit' => $variantData['unit'],
                        'price' => $variantData['price'],
                        'stock' => $variantData['stock'],
                        'is_active' => $variantData['is_active'] ?? true,
                        'sort_order' => $variantData['sort_order'] ?? $index,
                    ]);

                    if ($request->hasFile("variants.{$index}.image")) {
                        $variant->addMediaFromRequest("variants.{$index}.image")
                            ->toMediaCollection('image');
                    }
                }
            }
        } else {
            // Removing all variants: delete them
            $product->variants->each(function ($v) {
                $v->clearMediaCollection('image');
                $v->delete();
            });
        }

        return redirect()->route('products.index')
            ->with('success', 'Producto actualizado correctamente.');
    }

    public function destroy(Request $request, Product $product): RedirectResponse
    {
        abort_unless($request->user()->can('delete-products'), 403);

        $product->variants->each(function ($v) {
            $v->clearMediaCollection('image');
            $v->delete();
        });
        $product->clearMediaCollection('image');
        $product->delete();

        return redirect()->route('products.index')
            ->with('success', 'Producto eliminado correctamente.');
    }
}
