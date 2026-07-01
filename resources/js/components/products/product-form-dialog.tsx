import { router } from "@inertiajs/react";
import { ImagePlus, LoaderCircle, Package, Plus, Trash2, Info } from "lucide-react";
import { useRef, useState } from "react";
import InputError from "@/components/input-error";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { TenantProduct as Product, ProductVariant } from "@/types/tenant";

const CATEGORIES = [
    { value: "bebida", label: "Bebida" },
    { value: "snack", label: "Snack" },
    { value: "protector", label: "Protector" },
    { value: "equipo", label: "Equipo" },
    { value: "otro", label: "Otro" },
] as const;

// ------- Variant local type -------
type VariantDraft = {
    id?: number;
    label: string;
    sku: string;
    unit: string;
    price: string;
    stock: number;
    is_active: boolean;
    image?: File | null;
    remove_image?: boolean;
    existingImageUrl?: string | null;
};

function emptyVariant(): VariantDraft {
    return { label: "", sku: "", unit: "unidad", price: "0.00", stock: 0, is_active: true, image: null, remove_image: false };
}

// ------- Form data -------
type ProductFormData = {
    name: string;
    sku: string;
    category: string;
    unit: string;
    stock: number;
    price: string;
    description: string;
    is_active: boolean;
    igv_type: "gravado" | "exonerado" | "inafecto";
    has_variants: boolean;
    image: File | null;
    remove_image: boolean;
};

const EMPTY_FORM: ProductFormData = {
    name: "", sku: "", category: "bebida", unit: "unidad", stock: 0,
    price: "0.00", description: "", is_active: true, igv_type: "gravado",
    has_variants: false, image: null, remove_image: false,
};

function valuesFromProduct(product: Product): ProductFormData {
    return {
        name: product.name,
        sku: product.sku ?? "",
        category: product.category,
        unit: product.unit ?? "unidad",
        stock: product.stock ?? 0,
        price: product.price ?? "0.00",
        description: product.description ?? "",
        is_active: product.is_active,
        igv_type: product.igv_type ?? "gravado",
        has_variants: product.has_variants ?? false,
        image: null,
        remove_image: false,
    };
}

function variantsFromProduct(product: Product): VariantDraft[] {
    return (product.variants ?? []).map((v: ProductVariant) => ({
        id: v.id,
        label: v.label,
        sku: v.sku ?? "",
        unit: v.unit,
        price: v.price,
        stock: v.stock,
        is_active: v.is_active,
        image: null,
        remove_image: false,
        existingImageUrl: v.image_url,
    }));
}

// ------- Variant row component -------
function VariantRow({
    v,
    index,
    onChange,
    onRemove,
}: {
    v: VariantDraft;
    index: number;
    onChange: (index: number, updated: VariantDraft) => void;
    onRemove: (index: number) => void;
}) {
    const fileRef = useRef<HTMLInputElement>(null);
    const imgSrc = v.image ? URL.createObjectURL(v.image) : (v.remove_image ? null : v.existingImageUrl);

    return (
        <div className="group relative flex flex-col gap-3 rounded-xl border border-green-200 bg-white p-4 shadow-sm transition-all hover:border-green-300 dark:border-green-900/40 dark:bg-neutral-900/50">
            <div className="absolute right-2 top-2">
                <button
                    type="button"
                    onClick={() => onRemove(index)}
                    className="flex size-7 items-center justify-center rounded-full text-gray-400 hover:bg-red-50 hover:text-red-500"
                    title="Eliminar presentación"
                >
                    <Trash2 className="size-4" />
                </button>
            </div>
            <div className="flex gap-4">
                {/* Image Upload */}
                <div className="flex flex-col items-center gap-1">
                    <Label className="text-[10px] text-muted-foreground">Imagen</Label>
                    <div
                        className="relative flex size-16 cursor-pointer items-center justify-center overflow-hidden rounded-lg border border-dashed border-gray-300 bg-gray-50 transition-colors hover:border-green-400 dark:border-gray-700 dark:bg-neutral-800"
                        onClick={() => fileRef.current?.click()}
                        title="Subir imagen para esta presentación"
                    >
                        {imgSrc ? (
                            <img src={imgSrc} alt={v.label} className="size-full object-cover" />
                        ) : (
                            <ImagePlus className="size-5 text-gray-400" />
                        )}
                    </div>
                    {imgSrc && (
                        <button
                            type="button"
                            className="text-[10px] text-red-500 hover:underline"
                            onClick={() => onChange(index, { ...v, image: null, remove_image: true, existingImageUrl: undefined })}
                        >
                            Quitar
                        </button>
                    )}
                    <input
                        type="file"
                        ref={fileRef}
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                            const file = e.target.files?.[0] ?? null;
                            onChange(index, { ...v, image: file, remove_image: false });
                        }}
                    />
                </div>

                {/* Main Fields */}
                <div className="flex-1 space-y-4">
                    <div className="grid gap-1.5">
                        <Label className="text-sm font-semibold">
                            Nombre de la presentación <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            placeholder="Ej. 1.5 Litros, Botella Personal 500ml..."
                            value={v.label}
                            onChange={(e) => onChange(index, { ...v, label: e.target.value })}
                            className="h-10 text-sm focus-visible:ring-green-500"
                            required
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
                        <div className="grid gap-1.5">
                            <Label className="text-xs font-semibold">Precio (S/) <span className="text-red-500">*</span></Label>
                            <Input
                                type="number"
                                min={0}
                                step="0.01"
                                placeholder="0.00"
                                value={v.price}
                                onChange={(e) => onChange(index, { ...v, price: e.target.value })}
                                className="h-10 text-sm font-medium focus-visible:ring-green-500"
                                required
                            />
                        </div>
                        <div className="grid gap-1.5">
                            <Label className="text-xs font-semibold">Stock <span className="text-red-500">*</span></Label>
                            <Input
                                type="number"
                                min={0}
                                placeholder="0"
                                value={v.stock}
                                onChange={(e) => onChange(index, { ...v, stock: Number(e.target.value) })}
                                className="h-10 text-sm focus-visible:ring-green-500"
                                required
                            />
                        </div>
                        <div className="grid gap-1.5">
                            <Label className="text-xs font-semibold">Unidad <span className="text-red-500">*</span></Label>
                            <Input
                                placeholder="Botella, Lata..."
                                value={v.unit}
                                onChange={(e) => onChange(index, { ...v, unit: e.target.value })}
                                className="h-10 text-sm focus-visible:ring-green-500"
                                required
                            />
                        </div>
                        <div className="grid gap-1.5">
                            <Label className="text-xs font-semibold">Cód. Interno / SKU</Label>
                            <Input
                                placeholder="Opcional"
                                value={v.sku}
                                onChange={(e) => onChange(index, { ...v, sku: e.target.value })}
                                className="h-10 text-sm focus-visible:ring-green-500"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ------- Main Dialog -------
export function ProductFormDialog({
    open,
    product,
    onOpenChange,
}: {
    open: boolean;
    product: Product | null;
    onOpenChange: (open: boolean) => void;
}) {
    const [form, setForm] = useState<ProductFormData>(product ? valuesFromProduct(product) : EMPTY_FORM);
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState<Partial<Record<string, string>>>({});
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [variants, setVariants] = useState<VariantDraft[]>(() =>
        product?.has_variants ? variantsFromProduct(product) : [],
    );

    const hasVariants = form.has_variants;

    function setData<K extends keyof ProductFormData>(key: K, value: ProductFormData[K]) {
        setForm((prev) => ({ ...prev, [key]: value }));
    }

    function submit(event: React.FormEvent) {
        event.preventDefault();
        setProcessing(true);
        setErrors({});

        const fd = new FormData();

        if (product) {
fd.append("_method", "PUT");
}

        fd.append("name", form.name);
        fd.append("category", form.category);
        fd.append("description", form.description);
        fd.append("is_active", form.is_active ? "1" : "0");
        fd.append("igv_type", form.igv_type);
        fd.append("has_variants", hasVariants ? "1" : "0");

        if (!hasVariants) {
            fd.append("sku", form.sku);
            fd.append("unit", form.unit);
            fd.append("stock", String(form.stock));
            fd.append("price", form.price);
        }

        if (form.image) {
fd.append("image", form.image);
}

        if (form.remove_image) {
fd.append("remove_image", "1");
}

        if (hasVariants) {
            variants.forEach((v, i) => {
                if (v.id) {
fd.append(`variants[${i}][id]`, String(v.id));
}

                fd.append(`variants[${i}][label]`, v.label);
                fd.append(`variants[${i}][sku]`, v.sku ?? "");
                fd.append(`variants[${i}][unit]`, v.unit);
                fd.append(`variants[${i}][price]`, v.price);
                fd.append(`variants[${i}][stock]`, String(v.stock));
                fd.append(`variants[${i}][is_active]`, v.is_active ? "1" : "0");
                fd.append(`variants[${i}][sort_order]`, String(i));

                if (v.image) {
fd.append(`variants[${i}][image]`, v.image);
}

                if (v.remove_image) {
fd.append(`variants[${i}][remove_image]`, "1");
}
            });
        }

        const url = product ? `/products/${product.id}` : "/products";
        router.post(url, fd, {
            preserveScroll: true,
            onSuccess: () => {
 setProcessing(false); onOpenChange(false); 
},
            onError: (errs) => {
 setProcessing(false); setErrors(errs); 
},
        });
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className={`max-h-[95vh] overflow-y-auto transition-all duration-300 ${hasVariants ? 'sm:max-w-6xl' : 'sm:max-w-xl'}`}>
                <DialogHeader className="mb-2">
                    <DialogTitle className="flex items-center gap-2 text-2xl font-bold">
                        <Package className="size-6 text-green-600" />
                        {product ? "Editar producto" : "Crear nuevo producto"}
                    </DialogTitle>
                    <DialogDescription className="text-base">
                        {product
                            ? `Modifica los datos de "${product.name}".`
                            : "Completa los detalles de tu producto para agregarlo al inventario."}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={submit} className="flex flex-col gap-6">
                    <div className={`grid gap-8 ${hasVariants ? 'lg:grid-cols-2' : ''}`}>
                        
                        {/* --- LEFT COLUMN: Product Info --- */}
                        <div className="flex flex-col gap-5">
                            {hasVariants && (
                                <div className="rounded-lg bg-blue-50 p-3 text-sm text-blue-800 dark:bg-blue-950/30 dark:text-blue-300">
                                    <div className="flex items-start gap-2">
                                        <Info className="mt-0.5 size-4 shrink-0" />
                                        <p>Has activado <strong>Presentaciones Múltiples</strong>. Los datos aquí son generales del producto. Define precios, stock e imágenes específicas en la columna derecha para cada presentación.</p>
                                    </div>
                                </div>
                            )}

                            {/* Main Image */}
                            <div className="flex flex-col gap-2">
                                <Label className="font-semibold text-gray-700 dark:text-gray-300">
                                    Imagen {hasVariants ? "General (Referencial)" : "Principal"}
                                </Label>
                                <div className="flex items-start gap-4">
                                    <div className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50/50 dark:border-gray-800 dark:bg-gray-900/50">
                                    {form.image ? (
                                            <img src={URL.createObjectURL(form.image)} alt="Preview" className="size-full object-cover" />
                                        ) : product?.image_url && !form.remove_image ? (
                                            <img src={product.image_url} alt={product.name} className="size-full object-cover" />
                                        ) : (
                                            <Package className="size-8 text-gray-300 dark:text-gray-600" />
                                        )}
                                    </div>
                                    <div className="flex flex-col items-start justify-center gap-2 pt-2">
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            onChange={(e) => {
                                                if (e.target.files?.[0]) {
                                                    setData("image", e.target.files[0]);
                                                    setData("remove_image", false);
                                                }
                                            }}
                                            accept="image/*"
                                            className="hidden"
                                        />
                                        <div className="flex gap-2">
                                            <Button type="button" variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()} className="rounded-xl">
                                                <ImagePlus className="mr-2 size-4" /> Subir imagen
                                            </Button>
                                            {(form.image || (product?.image_url && !form.remove_image)) && (
                                                <Button
                                                    type="button" variant="outline" size="sm"
                                                    className="rounded-xl text-red-500 hover:bg-red-50 hover:text-red-600"
                                                    onClick={() => {
                                                        setData("image", null);
                                                        setData("remove_image", true);

                                                        if (fileInputRef.current) {
fileInputRef.current.value = "";
}
                                                    }}
                                                >
                                                    <Trash2 className="size-4" />
                                                </Button>
                                            )}
                                        </div>
                                        <p className="text-xs text-muted-foreground">Recomendado: Formato cuadrado, max. 2MB</p>
                                    </div>
                                </div>
                                <InputError message={errors.image} />
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="grid gap-1.5 sm:col-span-2">
                                    <Label htmlFor="prod-name" className="font-semibold text-gray-700 dark:text-gray-300">
                                        Nombre del Producto <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="prod-name"
                                        value={form.name}
                                        onChange={(e) => setData("name", e.target.value)}
                                        placeholder="Ej: Gaseosa Inca Kola, Cerveza Pilsen..."
                                        className="h-10 text-base focus-visible:ring-green-500"
                                        required
                                    />
                                    <InputError message={errors.name} />
                                </div>
                                
                                <div className="grid gap-1.5">
                                    <Label htmlFor="prod-category" className="font-semibold text-gray-700 dark:text-gray-300">
                                        Categoría <span className="text-red-500">*</span>
                                    </Label>
                                    <select
                                        id="prod-category"
                                        value={form.category}
                                        onChange={(e) => setData("category", e.target.value)}
                                        className="h-10 w-full rounded-md border border-input bg-background px-3 py-1 text-sm text-foreground shadow-xs focus-visible:ring-1 focus-visible:ring-green-500 focus-visible:outline-none dark:bg-input/30"
                                        required
                                    >
                                        {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                                    </select>
                                    <InputError message={errors.category} />
                                </div>

                                <div className="grid gap-1.5">
                                    <Label htmlFor="prod-igv" className="font-semibold text-gray-700 dark:text-gray-300">Tipo IGV</Label>
                                    <select
                                        id="prod-igv"
                                        value={form.igv_type}
                                        onChange={(e) => setData("igv_type", e.target.value as "gravado" | "exonerado" | "inafecto")}
                                        className="h-10 w-full rounded-md border border-input bg-background px-3 py-1 text-sm text-foreground shadow-xs focus-visible:ring-1 focus-visible:ring-green-500 focus-visible:outline-none dark:bg-input/30"
                                    >
                                        <option value="gravado">Gravado (IGV 18%)</option>
                                        <option value="exonerado">Exonerado</option>
                                        <option value="inafecto">Inafecto</option>
                                    </select>
                                    <InputError message={errors.igv_type} />
                                </div>
                            </div>

                            <div className="grid gap-1.5">
                                <Label htmlFor="prod-desc" className="font-semibold text-gray-700 dark:text-gray-300">Descripción Corta</Label>
                                <textarea
                                    id="prod-desc"
                                    rows={2}
                                    value={form.description}
                                    onChange={(e) => setData("description", e.target.value)}
                                    placeholder="Agrega algún detalle o descripción opcional del producto."
                                    className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm text-foreground shadow-xs focus-visible:ring-1 focus-visible:ring-green-500 focus-visible:outline-none dark:bg-input/30"
                                />
                                <InputError message={errors.description} />
                            </div>

                            {/* --- SIMPLE PRODUCT FIELDS (if NO variants) --- */}
                            {!hasVariants && (
                                <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-4 dark:border-gray-800 dark:bg-neutral-900/30">
                                    <h4 className="mb-4 font-semibold text-gray-900 dark:text-gray-100">Detalles de Inventario y Precio</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="grid gap-1.5">
                                            <Label htmlFor="prod-price" className="text-sm font-semibold text-green-700 dark:text-green-400">
                                                Precio Venta (S/) <span className="text-red-500">*</span>
                                            </Label>
                                            <Input id="prod-price" type="number" min={0} step="0.01" value={form.price} onChange={(e) => setData("price", e.target.value)} placeholder="0.00" className="h-10 text-lg font-medium focus-visible:ring-green-500" required />
                                            <InputError message={errors.price} />
                                        </div>
                                        <div className="grid gap-1.5">
                                            <Label htmlFor="prod-stock" className="text-sm font-semibold">
                                                Stock Inicial <span className="text-red-500">*</span>
                                            </Label>
                                            <Input id="prod-stock" type="number" min={0} value={form.stock} onChange={(e) => setData("stock", Number(e.target.value))} className="h-10 focus-visible:ring-green-500" required />
                                            <InputError message={errors.stock} />
                                        </div>
                                        <div className="grid gap-1.5">
                                            <Label htmlFor="prod-unit" className="text-sm font-semibold">
                                                Unidad Medida <span className="text-red-500">*</span>
                                            </Label>
                                            <Input id="prod-unit" value={form.unit} onChange={(e) => setData("unit", e.target.value)} placeholder="Ej: botella, kg, unidad" className="h-10 focus-visible:ring-green-500" required />
                                            <InputError message={errors.unit} />
                                        </div>
                                        <div className="grid gap-1.5">
                                            <Label htmlFor="prod-sku" className="text-sm font-semibold">SKU / Código</Label>
                                            <Input id="prod-sku" value={form.sku} onChange={(e) => setData("sku", e.target.value)} placeholder="Opcional" className="h-10 focus-visible:ring-green-500" />
                                            <InputError message={errors.sku} />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Active Toggle & Variants Toggle */}
                            <div className="mt-2 flex flex-col gap-3 rounded-xl border border-gray-100 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-neutral-900/50">
                                <label className="flex cursor-pointer items-center gap-3">
                                    <div className="relative flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={form.is_active}
                                            onChange={(e) => setData("is_active", e.target.checked)}
                                            className="peer sr-only"
                                        />
                                        <div className="h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-green-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 dark:border-gray-600 dark:bg-gray-700 dark:peer-focus:ring-green-800"></div>
                                    </div>
                                    <span className="text-sm font-medium text-gray-900 dark:text-gray-300">
                                        Producto Activo (Visible para venta)
                                    </span>
                                </label>

                                <div className="my-1 h-px w-full bg-gray-100 dark:bg-gray-800" />

                                <label className="flex cursor-pointer items-start gap-3">
                                    <div className="relative flex items-center pt-1">
                                        <input
                                            type="checkbox"
                                            checked={hasVariants}
                                            onChange={(e) => {
                                                setData("has_variants", e.target.checked);

                                                if (e.target.checked && variants.length === 0) {
                                                    setVariants([emptyVariant()]);
                                                }
                                            }}
                                            className="peer sr-only"
                                        />
                                        <div className="h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[3px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-green-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 dark:border-gray-600 dark:bg-gray-700 dark:peer-focus:ring-green-800"></div>
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-gray-900 dark:text-gray-100">
                                            Habilitar Múltiples Presentaciones (Variantes)
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            Activa esto si el producto se vende en diferentes tamaños, capacidades o tipos (ej: 1.5L, 3L).
                                        </p>
                                    </div>
                                </label>
                            </div>
                        </div>

                        {/* --- RIGHT COLUMN: Variants --- */}
                        {hasVariants && (
                            <div className="flex flex-col gap-4 rounded-2xl border border-green-100 bg-green-50/40 p-5 dark:border-green-900/20 dark:bg-green-950/10 lg:pl-6">
                                <div className="flex items-center justify-between pb-2 border-b border-green-200 dark:border-green-900/40">
                                    <div>
                                        <h3 className="text-lg font-bold text-green-800 dark:text-green-400">Presentaciones del Producto</h3>
                                        <p className="text-sm text-green-700/70 dark:text-green-500/70">Añade cada versión con su propio precio y stock.</p>
                                    </div>
                                    <Button
                                        type="button"
                                        size="sm"
                                        className="h-9 rounded-xl bg-green-600 hover:bg-green-700"
                                        onClick={() => setVariants((prev) => [...prev, emptyVariant()])}
                                    >
                                        <Plus className="mr-1.5 size-4" /> Agregar Nueva
                                    </Button>
                                </div>

                                <div className="flex flex-col gap-4 pr-1 max-h-[60vh] overflow-y-auto">
                                    {variants.length === 0 && (
                                        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-green-200 py-10 text-center dark:border-green-900/40">
                                            <Package className="mb-3 size-10 text-green-300/50" />
                                            <p className="font-medium text-green-800 dark:text-green-400">No hay presentaciones añadidas</p>
                                            <p className="text-sm text-green-700/60 dark:text-green-500/60">Haz clic en el botón superior para comenzar.</p>
                                        </div>
                                    )}
                                    {variants.map((v, i) => (
                                        <VariantRow
                                            key={i}
                                            v={v}
                                            index={i}
                                            onChange={(idx, updated) =>
                                                setVariants((prev) => prev.map((item, j) => (j === idx ? updated : item)))
                                            }
                                            onRemove={(idx) => setVariants((prev) => prev.filter((_, j) => j !== idx))}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <DialogFooter className="mt-2 border-t pt-5">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl h-11 px-6">
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={processing} className="rounded-xl h-11 px-8 bg-green-600 hover:bg-green-700">
                            {processing ? (
                                <><LoaderCircle className="mr-2 size-5 animate-spin" />Guardando…</>
                            ) : product ? "Guardar cambios" : "Crear producto"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
