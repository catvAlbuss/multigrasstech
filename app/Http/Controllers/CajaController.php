<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\Transaction;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class CajaController extends Controller
{
    public function index(): Response
    {
        $products = Product::where('is_active', true)
            ->with(['variants' => fn ($q) => $q->where('is_active', true)->orderBy('sort_order')])
            ->orderBy('category')
            ->orderBy('name')
            ->get(['id', 'name', 'sku', 'category', 'unit', 'price', 'stock', 'igv_type', 'has_variants']);

        // Load media for products and their variants
        $products->each(function (Product $product) {
            $product->loadMedia('image');
            $product->variants->each(fn ($v) => $v->loadMedia('image'));
        });

        $today = now()->toDateString();

        // Sales from POS today
        $salesToday = Sale::with('items')
            ->whereDate('sold_at', $today)
            ->where('status', 'completed')
            ->orderByDesc('sold_at')
            ->get();

        // Manual expense transactions today
        $expensesToday = Transaction::whereDate('date', $today)
            ->where('type', 'expense')
            ->orderByDesc('created_at')
            ->get();

        $salesIncome = (float) $salesToday->sum('total');
        $manualIncome = (float) Transaction::whereDate('date', $today)
            ->where('type', 'income')
            ->sum('amount');
        $totalExpense = (float) $expensesToday->sum('amount');

        return Inertia::render('tenant/caja/index', [
            'products' => $products,
            'sales_today' => $salesToday->values(),
            'expenses_today' => $expensesToday->values(),
            'totals_today' => [
                'income' => round($salesIncome + $manualIncome, 2),
                'expense' => round($totalExpense, 2),
                'balance' => round($salesIncome + $manualIncome - $totalExpense, 2),
                'sales_count' => $salesToday->count(),
            ],
        ]);
    }

    /**
     * Checkout: creates a Sale + SaleItems, decrements stock atomically.
     * Returns JSON so the frontend can show the receipt without a page reload.
     */
    public function checkout(Request $request): JsonResponse
    {
        abort_unless($request->user()->can('manage-caja'), 403);

        $data = $request->validate([
            'document_type' => ['required', Rule::in(['boleta', 'factura'])],
            'customer_doc_type' => ['required', Rule::in(['dni', 'ruc', 'pasaporte', 'sin_documento'])],
            'customer_doc_number' => ['nullable', 'string', 'max:11'],
            'customer_name' => ['required', 'string', 'max:255'],
            'customer_address' => ['nullable', 'string', 'max:500'],
            'customer_email' => ['nullable', 'email', 'max:255'],
            'igv_applied' => ['required', 'boolean'],
            'payment_amount' => ['required', 'numeric', 'min:0'],
            'notes' => ['nullable', 'string'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'integer', Rule::exists('products', 'id')->where('tenant_id', tenant('id'))],
            'items.*.product_variant_id' => ['nullable', 'integer', Rule::exists('product_variants', 'id')->where('tenant_id', tenant('id'))],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
        ]);

        // Extra validation: factura requires RUC (11 digits)
        if ($data['document_type'] === 'factura') {
            if (empty($data['customer_doc_number']) || strlen((string) $data['customer_doc_number']) !== 11) {
                return response()->json([
                    'success' => false,
                    'message' => 'La factura requiere un RUC válido de 11 dígitos.',
                ], 422);
            }
        }

        // Load all products and variants from DB (server-authoritative prices)
        $productIds = collect($data['items'])->pluck('product_id')->unique()->values();
        $products = Product::whereIn('id', $productIds)->get()->keyBy('id');

        $variantIds = collect($data['items'])->pluck('product_variant_id')->filter()->unique()->values();
        $variants = ProductVariant::whereIn('id', $variantIds)->get()->keyBy('id');

        // Pre-validate stock for all items
        foreach ($data['items'] as $item) {
            $product = $products->get($item['product_id']);
            if (! $product) {
                return response()->json([
                    'success' => false,
                    'message' => "Producto ID {$item['product_id']} no encontrado.",
                ], 422);
            }

            if (! empty($item['product_variant_id'])) {
                $variant = $variants->get($item['product_variant_id']);
                if (! $variant) {
                    return response()->json(['success' => false, 'message' => 'Variante no encontrada.'], 422);
                }
                if ($variant->stock < $item['quantity']) {
                    return response()->json([
                        'success' => false,
                        'message' => "Stock insuficiente para \"{$product->name} - {$variant->label}\". Disponible: {$variant->stock}.",
                    ], 422);
                }
            } else {
                if ($product->stock < $item['quantity']) {
                    return response()->json([
                        'success' => false,
                        'message' => "Stock insuficiente para \"{$product->name}\". Disponible: {$product->stock}.",
                    ], 422);
                }
            }
        }

        $sale = DB::transaction(function () use ($data, $products, $variants) {
            $igvApplied = (bool) $data['igv_applied'];

            // Generate correlative sale number (locked to avoid race conditions)
            $count = Sale::where('document_type', $data['document_type'])
                ->lockForUpdate()
                ->count();

            $prefix = $data['document_type'] === 'boleta' ? 'B001' : 'F001';
            $saleNumber = $prefix.'-'.str_pad((string) ($count + 1), 8, '0', STR_PAD_LEFT);

            // Calculate totals
            $totalSubtotal = 0.0;
            $totalIgv = 0.0;
            $totalTotal = 0.0;

            $itemsToCreate = [];

            foreach ($data['items'] as $item) {
                $product = $products->get($item['product_id']);
                $variant = ! empty($item['product_variant_id']) ? $variants->get($item['product_variant_id']) : null;
                $qty = $item['quantity'];
                $price = (float) ($variant ? $variant->price : $product->price);
                $igvType = $product->igv_type;
                $sku = $variant ? $variant->sku : $product->sku;
                $unit = $variant ? $variant->unit : $product->unit;
                $name = $variant ? "{$product->name} - {$variant->label}" : $product->name;

                if ($igvApplied && $igvType === 'gravado') {
                    $basePrice = round($price / 1.18, 10);
                    $igvPerUnit = $price - $basePrice;
                    $itemSubtotal = round($basePrice * $qty, 2);
                    $itemIgv = round($igvPerUnit * $qty, 2);
                    $itemTotal = round($price * $qty, 2);
                } else {
                    $basePrice = $price;
                    $itemSubtotal = round($price * $qty, 2);
                    $itemIgv = 0.0;
                    $itemTotal = $itemSubtotal;
                }

                $totalSubtotal += $itemSubtotal;
                $totalIgv += $itemIgv;
                $totalTotal += $itemTotal;

                $itemsToCreate[] = [
                    'product_id' => $product->id,
                    'product_variant_id' => $variant?->id,
                    'product_name' => $name,
                    'product_sku' => $sku,
                    'unit' => $unit,
                    'quantity' => $qty,
                    'unit_price' => $price,
                    'igv_type' => $igvType,
                    'unit_price_base' => round($basePrice, 2),
                    'igv_amount' => $itemIgv,
                    'subtotal' => $itemSubtotal,
                    'total' => $itemTotal,
                ];
            }

            $totalSubtotal = round($totalSubtotal, 2);
            $totalIgv = round($totalIgv, 2);
            $totalTotal = round($totalTotal, 2);
            $paymentAmount = round((float) $data['payment_amount'], 2);
            $changeAmount = round($paymentAmount - $totalTotal, 2);

            // Create sale record
            $sale = Sale::create([
                'sale_number' => $saleNumber,
                'document_type' => $data['document_type'],
                'customer_doc_type' => $data['customer_doc_type'],
                'customer_doc_number' => $data['customer_doc_number'] ?? null,
                'customer_name' => $data['customer_name'],
                'customer_address' => $data['customer_address'] ?? null,
                'customer_email' => $data['customer_email'] ?? null,
                'igv_applied' => $igvApplied,
                'subtotal' => $totalSubtotal,
                'igv_amount' => $totalIgv,
                'total' => $totalTotal,
                'payment_amount' => $paymentAmount,
                'change_amount' => max(0, $changeAmount),
                'notes' => $data['notes'] ?? null,
                'status' => 'completed',
                'sold_at' => now(),
            ]);

            // Create sale items and decrement stock
            foreach ($itemsToCreate as $itemData) {
                SaleItem::create(array_merge(['sale_id' => $sale->id], $itemData));
                if ($itemData['product_variant_id']) {
                    ProductVariant::where('id', $itemData['product_variant_id'])->decrement('stock', $itemData['quantity']);
                } else {
                    Product::where('id', $itemData['product_id'])->decrement('stock', $itemData['quantity']);
                }
            }

            return $sale->load('items');
        });

        return response()->json([
            'success' => true,
            'sale' => $sale,
        ]);
    }

    /**
     * Register a manual cash-out (expense).
     */
    public function expense(Request $request): RedirectResponse
    {
        abort_unless($request->user()->can('manage-caja'), 403);

        $data = $request->validate([
            'category' => ['required', 'string', 'max:50'],
            'description' => ['required', 'string', 'max:255'],
            'amount' => ['required', 'numeric', 'min:0.01'],
            'notes' => ['nullable', 'string'],
        ]);

        Transaction::create([
            'type' => 'expense',
            'category' => $data['category'],
            'description' => $data['description'],
            'amount' => $data['amount'],
            'date' => now()->toDateString(),
            'notes' => $data['notes'] ?? null,
        ]);

        return back()->with('success', 'Salida registrada correctamente.');
    }
}
