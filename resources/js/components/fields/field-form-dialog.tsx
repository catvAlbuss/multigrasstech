import { useForm } from '@inertiajs/react';
import { ImagePlus, Ruler, Star, Trash2, UploadCloud, Users } from 'lucide-react';
import { useEffect, useMemo } from 'react';
import Select from 'react-select';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { TenantField as Field } from '@/types/tenant';

interface FieldFormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    field: Field | null;
    allFields: Pick<Field, 'id' | 'name' | 'shared_group_id'>[];
}

type FieldFormData = {
    name: string;
    description: string;
    surface_type: string;
    sport_type: string;
    capacity: number;
    hourly_rate: string;
    status: string;
    is_featured: boolean;
    ancho: number | string;
    largo: number | string;
    zona_tribuna: boolean;
    image: File | null;
    remove_image: boolean;
    shared_with: number[];
    _token: string;
    _method?: 'put';
};

function csrfToken() {
    return (
        document
            .querySelector<HTMLMetaElement>('meta[name="csrf-token"]')
            ?.getAttribute('content') ?? ''
    );
}

const sportOptions = [
    { value: '', label: 'Sin deporte específico' },
    { value: 'futbol', label: 'Fútbol' },
    { value: 'voley', label: 'Vóleibol' },
    { value: 'basketball', label: 'Básquetbol' },
    { value: 'padel', label: 'Pádel' },
    { value: 'tennis', label: 'Tenis' },
    { value: 'natacion', label: 'Natación' },
    { value: 'multisport', label: 'Multideporte' },
];

const nativeSelectClass =
    'flex h-9 w-full rounded-md border bg-background px-3 py-1 text-sm text-foreground shadow-sm transition-colors focus-visible:ring-1 focus-visible:ring-green-500 focus-visible:outline-none dark:bg-input/30';

const nativeOptionClass = 'bg-background text-foreground';

export function FieldFormDialog({
    open,
    onOpenChange,
    field,
    allFields,
}: FieldFormDialogProps) {
    const isEditing = !!field;
    const availableFields = allFields.filter((f) => f.id !== field?.id);
    const options = availableFields.map((f) => ({
        value: f.id,
        label: f.name,
        groupId: f.shared_group_id,
    }));

    const initialSharedWith = field?.shared_group_id
        ? options.filter((o) => o.groupId === field.shared_group_id)
        : [];

    const { data, setData, transform, post, processing, errors, reset, clearErrors } =
        useForm<FieldFormData>({
            name: field?.name ?? '',
            description: field?.description ?? '',
            surface_type: field?.surface_type ?? 'artificial',
            sport_type: field?.sport_type ?? '',
            capacity: field?.capacity ?? 0,
            hourly_rate: field?.hourly_rate ?? '',
            status: field?.status ?? 'active',
            is_featured: field?.is_featured ?? false,
            ancho: field?.ancho ?? '',
            largo: field?.largo ?? '',
            zona_tribuna: field?.zona_tribuna ?? false,
            image: null,
            remove_image: false,
            shared_with: initialSharedWith.map((o) => o.value),
            _token: csrfToken(),
        });

    const previewUrl = useMemo(() => {
        if (data.image) {
            return URL.createObjectURL(data.image);
        }

        if (data.remove_image) {
            return null;
        }

        return field?.image_url ?? null;
    }, [data.image, data.remove_image, field?.image_url]);

    useEffect(() => {
        return () => {
            if (data.image && previewUrl?.startsWith('blob:')) {
                URL.revokeObjectURL(previewUrl);
            }
        };
    }, [data.image, previewUrl]);

    useEffect(() => {
        if (!open) {
            return;
        }

        clearErrors();

        if (field) {
            setData({
                name: field.name,
                description: field.description ?? '',
                surface_type: field.surface_type,
                sport_type: field.sport_type ?? '',
                capacity: field.capacity,
                hourly_rate: field.hourly_rate,
                status: field.status,
                is_featured: field.is_featured,
                ancho: field.ancho ?? '',
                largo: field.largo ?? '',
                zona_tribuna: field.zona_tribuna ?? false,
                image: null,
                remove_image: false,
                shared_with: field.shared_group_id
                    ? options
                          .filter((o) => o.groupId === field.shared_group_id)
                          .map((o) => o.value)
                    : [],
                _token: csrfToken(),
            });
        } else {
            setData({
                name: '',
                description: '',
                surface_type: 'artificial',
                sport_type: '',
                capacity: 0,
                hourly_rate: '',
                status: 'active',
                is_featured: false,
                ancho: '',
                largo: '',
                zona_tribuna: false,
                image: null,
                remove_image: false,
                shared_with: [],
                _token: csrfToken(),
            });
        }
    }, [open, field]);

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        if (isEditing) {
            transform((data) => ({ ...data, _method: 'put' }));
            post(`/fields/${field.id}`, {
                forceFormData: true,
                onSuccess: () => onOpenChange(false),
            });

            return;
        }

        post('/fields', {
            forceFormData: true,
            onSuccess: () => {
                reset();
                onOpenChange(false);
            },
        });
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[640px]">
                <DialogHeader>
                    <DialogTitle>
                        {isEditing ? 'Editar campo' : 'Nuevo campo'}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-5 py-4">
                    <div className="space-y-3">
                        <Label>Imagen del campo</Label>
                        <div className="overflow-hidden rounded-xl border bg-muted/30">
                            {previewUrl ? (
                                <div className="relative">
                                    <img
                                        src={previewUrl}
                                        alt="Vista previa del campo"
                                        className="h-44 w-full object-cover"
                                    />
                                    <Button
                                        type="button"
                                        variant="destructive"
                                        size="sm"
                                        className="absolute top-3 right-3"
                                        onClick={() => {
                                            setData('image', null);
                                            setData('remove_image', true);
                                        }}
                                    >
                                        <Trash2 className="size-4" />
                                        Quitar
                                    </Button>
                                </div>
                            ) : (
                                <label className="flex h-44 cursor-pointer flex-col items-center justify-center gap-2 text-center">
                                    <UploadCloud className="size-8 text-muted-foreground" />
                                    <span className="text-sm font-medium">
                                        Subir foto del campo
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                        PNG, JPG o WEBP - Máx. 5 MB
                                    </span>
                                    <ImagePlus className="size-4 text-muted-foreground" />
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="sr-only"
                                        onChange={(e) => {
                                            setData(
                                                'image',
                                                e.target.files?.[0] ?? null,
                                            );
                                            setData('remove_image', false);
                                        }}
                                    />
                                </label>
                            )}
                        </div>
                        {previewUrl && (
                            <Input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                    setData(
                                        'image',
                                        e.target.files?.[0] ?? null,
                                    );
                                    setData('remove_image', false);
                                }}
                            />
                        )}
                        {errors.image && (
                            <p className="text-xs text-red-500">
                                {errors.image}
                            </p>
                        )}
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-1.5 sm:col-span-2">
                            <Label htmlFor="name">Nombre *</Label>
                            <Input
                                id="name"
                                value={data.name}
                                onChange={(e) =>
                                    setData('name', e.target.value)
                                }
                                placeholder="Ej.: Cancha de fútbol 1"
                                className={errors.name ? 'border-red-500' : ''}
                            />
                            {errors.name && (
                                <p className="text-xs text-red-500">
                                    {errors.name}
                                </p>
                            )}
                        </div>

                        <div className="space-y-1.5 sm:col-span-2">
                            <Label htmlFor="description">Descripción</Label>
                            <Textarea
                                id="description"
                                value={data.description}
                                onChange={(e) =>
                                    setData('description', e.target.value)
                                }
                                placeholder="Detalles adicionales..."
                                rows={2}
                                className={
                                    errors.description ? 'border-red-500' : ''
                                }
                            />
                            {errors.description && (
                                <p className="text-xs text-red-500">
                                    {errors.description}
                                </p>
                            )}
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="surface_type">Superficie *</Label>
                            <select
                                id="surface_type"
                                value={data.surface_type}
                                onChange={(e) =>
                                    setData('surface_type', e.target.value)
                                }
                                className={`${nativeSelectClass} ${errors.surface_type ? 'border-red-500' : 'border-input'}`}
                            >
                                <option className={nativeOptionClass} value="artificial">Sintético</option>
                                <option className={nativeOptionClass} value="grass">Natural</option>
                                <option className={nativeOptionClass} value="concrete">Concreto</option>
                                <option className={nativeOptionClass} value="clay">Arcilla</option>
                            </select>
                            {errors.surface_type && (
                                <p className="text-xs text-red-500">
                                    {errors.surface_type}
                                </p>
                            )}
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="sport_type">Deporte</Label>
                            <select
                                id="sport_type"
                                value={data.sport_type}
                                onChange={(e) =>
                                    setData('sport_type', e.target.value)
                                }
                                className={`${nativeSelectClass} ${errors.sport_type ? 'border-red-500' : 'border-input'}`}
                            >
                                {sportOptions.map((option) => (
                                    <option
                                        className={nativeOptionClass}
                                        key={option.value}
                                        value={option.value}
                                    >
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                            {errors.sport_type && (
                                <p className="text-xs text-red-500">
                                    {errors.sport_type}
                                </p>
                            )}
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="capacity">
                                Capacidad (personas) *
                            </Label>
                            <Input
                                id="capacity"
                                type="number"
                                min="0"
                                value={data.capacity}
                                onChange={(e) =>
                                    setData('capacity', Number(e.target.value))
                                }
                                className={
                                    errors.capacity ? 'border-red-500' : ''
                                }
                            />
                            {errors.capacity && (
                                <p className="text-xs text-red-500">
                                    {errors.capacity}
                                </p>
                            )}
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="hourly_rate">
                                Tarifa por hora (S/) *
                            </Label>
                            <Input
                                id="hourly_rate"
                                type="number"
                                step="0.01"
                                min="0"
                                value={data.hourly_rate}
                                onChange={(e) =>
                                    setData('hourly_rate', e.target.value)
                                }
                                placeholder="0.00"
                                className={
                                    errors.hourly_rate ? 'border-red-500' : ''
                                }
                            />
                            {errors.hourly_rate && (
                                <p className="text-xs text-red-500">
                                    {errors.hourly_rate}
                                </p>
                            )}
                        </div>

                        <div className="space-y-1.5 sm:col-span-2">
                            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                                <Ruler className="size-3.5" />
                                Dimensiones del campo (metros)
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <Label htmlFor="ancho">Ancho</Label>
                                    <Input
                                        id="ancho"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={data.ancho}
                                        onChange={(e) =>
                                            setData('ancho', e.target.value)
                                        }
                                        placeholder="0.00"
                                        className={
                                            errors.ancho ? 'border-red-500' : ''
                                        }
                                    />
                                    {errors.ancho && (
                                        <p className="text-xs text-red-500">
                                            {errors.ancho}
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <Label htmlFor="largo">Largo</Label>
                                    <Input
                                        id="largo"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={data.largo}
                                        onChange={(e) =>
                                            setData('largo', e.target.value)
                                        }
                                        placeholder="0.00"
                                        className={
                                            errors.largo ? 'border-red-500' : ''
                                        }
                                    />
                                    {errors.largo && (
                                        <p className="text-xs text-red-500">
                                            {errors.largo}
                                        </p>
                                    )}
                                </div>
                            </div>
                            {data.ancho && data.largo && Number(data.ancho) > 0 && Number(data.largo) > 0 ? (
                                <div className="rounded-lg border bg-muted/40 p-2 text-xs">
                                    <span className="font-medium">
                                        {Number(data.ancho) * Number(data.largo) > 0 ? `${(Number(data.ancho) * Number(data.largo)).toFixed(2)} m²` : ''} 
                                        {Number(data.ancho) * Number(data.largo) > 0 && Number(data.ancho) > 0 && Number(data.largo) > 0 ? ` | ${(2 * (Number(data.ancho) + Number(data.largo))).toFixed(2)} m` : ''}
                                    </span>
                                </div>
                            ) : null}
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="status">Estado *</Label>
                            <select
                                id="status"
                                value={data.status}
                                onChange={(e) =>
                                    setData('status', e.target.value)
                                }
                                className={`${nativeSelectClass} ${errors.status ? 'border-red-500' : 'border-input'}`}
                            >
                                <option className={nativeOptionClass} value="active">Activo</option>
                                <option className={nativeOptionClass} value="maintenance">
                                    Mantenimiento
                                </option>
                                <option className={nativeOptionClass} value="inactive">Inactivo</option>
                                <option className={nativeOptionClass} value="blocked">Bloqueado</option>
                            </select>
                            {errors.status && (
                                <p className="text-xs text-red-500">
                                    {errors.status}
                                </p>
                            )}
                        </div>

                        <label className="flex items-center gap-3 rounded-xl border bg-muted/30 p-3">
                            <Checkbox
                                checked={data.is_featured}
                                onCheckedChange={(checked) =>
                                    setData('is_featured', checked === true)
                                }
                            />
                            <div>
                                <span className="flex items-center gap-1.5 text-sm font-medium">
                                    <Star className="size-3.5 text-amber-500" />
                                    Destacar en la web
                                </span>
                                <p className="text-xs text-muted-foreground">
                                    Se mostrará como campo principal en el
                                    welcome.
                                </p>
                            </div>
                        </label>

                        <label className="flex items-center gap-3 rounded-xl border bg-muted/30 p-3">
                            <Checkbox
                                checked={data.zona_tribuna}
                                onCheckedChange={(checked) =>
                                    setData('zona_tribuna', checked === true)
                                }
                            />
                            <div>
                                <span className="flex items-center gap-1.5 text-sm font-medium">
                                    <Users className="size-3.5 text-blue-600" />
                                    Zona de tribuna
                                </span>
                                <p className="text-xs text-muted-foreground">
                                    Marcar si el campo cuenta con tribuna o
                                    zona de espera para público.
                                </p>
                            </div>
                        </label>

                        <div className="mt-2 space-y-1.5 rounded-xl border bg-blue-50/50 p-3 sm:col-span-2 dark:border-blue-900/30 dark:bg-blue-900/10">
                            <Label
                                htmlFor="shared_with"
                                className="text-blue-800 dark:text-blue-300"
                            >
                                Comparte espacio físico con:
                            </Label>
                            <p className="mb-2 text-[10px] leading-tight text-blue-600/80 dark:text-blue-400">
                                Si seleccionas otros campos aquí, al reservar
                                uno se bloquearán los demás automáticamente para
                                evitar cruces.
                            </p>
                            <Select
                                id="shared_with"
                                isMulti
                                options={options}
                                value={options.filter((o) =>
                                    data.shared_with.includes(o.value),
                                )}
                                onChange={(selected) =>
                                    setData(
                                        'shared_with',
                                        selected.map((s) => s.value),
                                    )
                                }
                                placeholder="Seleccionar campos..."
                                className="text-sm"
                                classNamePrefix="react-select"
                                styles={{
                                    control: (base) => ({
                                        ...base,
                                        borderColor: 'var(--border)',
                                        backgroundColor: 'var(--background)',
                                        color: 'var(--foreground)',
                                        boxShadow: 'none',
                                        minHeight: '2.25rem',
                                    }),
                                    menu: (base) => ({
                                        ...base,
                                        backgroundColor: 'var(--background)',
                                        borderColor: 'var(--border)',
                                        color: 'var(--foreground)',
                                        zIndex: 60,
                                    }),
                                    menuList: (base) => ({
                                        ...base,
                                        backgroundColor: 'var(--background)',
                                    }),
                                    option: (base, state) => ({
                                        ...base,
                                        backgroundColor: state.isSelected
                                            ? 'rgba(34, 197, 94, 0.18)'
                                            : state.isFocused
                                              ? 'rgba(34, 197, 94, 0.1)'
                                              : 'var(--background)',
                                        color: 'var(--foreground)',
                                    }),
                                    input: (base) => ({
                                        ...base,
                                        color: 'var(--foreground)',
                                    }),
                                    placeholder: (base) => ({
                                        ...base,
                                        color: 'var(--muted-foreground)',
                                    }),
                                    singleValue: (base) => ({
                                        ...base,
                                        color: 'var(--foreground)',
                                    }),
                                    multiValue: (base) => ({
                                        ...base,
                                        backgroundColor:
                                            'rgba(34, 197, 94, 0.1)',
                                    }),
                                    multiValueLabel: (base) => ({
                                        ...base,
                                        color: 'var(--foreground)',
                                    }),
                                    multiValueRemove: (base) => ({
                                        ...base,
                                        color: 'var(--foreground)',
                                        ':hover': {
                                            backgroundColor:
                                                'rgba(239, 68, 68, 0.16)',
                                            color: 'var(--foreground)',
                                        },
                                    }),
                                }}
                            />
                            {errors.shared_with && (
                                <p className="text-xs text-red-500">
                                    {errors.shared_with}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={processing}
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            className="bg-green-600 text-white hover:bg-green-700"
                            disabled={processing}
                        >
                            {processing ? 'Guardando...' : 'Guardar'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
