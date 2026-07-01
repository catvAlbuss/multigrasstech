import { Head, router, useForm } from '@inertiajs/react';
import { ImagePlus, Trash2, UploadCloud } from 'lucide-react';
import {    useRef } from 'react';
import type {ChangeEvent, FormEvent, RefObject} from 'react';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { deleteMedia, edit, update } from '@/routes/landing';

type MediaItem = { id: number; url: string };

type LandingProfile = {
    tagline: string | null;
    description: string | null;
    phone: string | null;
    address: string | null;
    email: string | null;
    show_calendar: boolean;
    booking_start_time?: string;
    booking_end_time?: string;
    hero_images: MediaItem[];
    gallery_images: MediaItem[];
    payment_qr: MediaItem | null;
};

type PageProps = {
    profile: LandingProfile | null;
};

export default function LandingSettings({ profile }: PageProps) {
    const heroInputRef = useRef<HTMLInputElement>(null);
    const galleryInputRef = useRef<HTMLInputElement>(null);
    const paymentQrInputRef = useRef<HTMLInputElement>(null);

    const { data, setData, post, processing, errors, reset } = useForm({
        tagline: profile?.tagline ?? '',
        description: profile?.description ?? '',
        phone: profile?.phone ?? '',
        address: profile?.address ?? '',
        email: profile?.email ?? '',
        show_calendar: profile?.show_calendar ?? true,
        booking_start_time: profile?.booking_start_time ?? '06:00',
        booking_end_time: profile?.booking_end_time ?? '23:00',
        hero_images: [] as File[],
        gallery_images: [] as File[],
        payment_qr: null as File | null,
    });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        post(update.url(), {
            preserveScroll: true,
            forceFormData: true,
            onSuccess: () => reset('hero_images', 'gallery_images', 'payment_qr'),
        });
    };

    const removeMedia = (id: number) => {
        router.delete(deleteMedia.url(id), { preserveScroll: true });
    };

    return (
        <>
            <Head title="Página web" />

            <h1 className="sr-only">Página web</h1>

            <div className="space-y-10">
                <Heading
                    variant="small"
                    title="Página web"
                    description="Configura el contenido público de tu página web"
                />

                <form
                    onSubmit={submit}
                    className="space-y-10"
                    encType="multipart/form-data"
                >
                    <section className="space-y-4">
                        <p className="text-sm font-semibold text-foreground">
                            Información pública
                        </p>

                        <div className="grid gap-2">
                            <Label htmlFor="tagline">Eslogan</Label>
                            <Input
                                id="tagline"
                                value={data.tagline}
                                onChange={(e) =>
                                    setData('tagline', e.target.value)
                                }
                                placeholder="Ej.: La mejor cancha de grass de la ciudad"
                                maxLength={120}
                            />
                            <p className="text-xs text-muted-foreground">
                                Frase principal que aparece en el inicio de tu
                                página.
                            </p>
                            <InputError message={errors.tagline} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="description">Descripción</Label>
                            <Textarea
                                id="description"
                                value={data.description}
                                onChange={(e) =>
                                    setData('description', e.target.value)
                                }
                                placeholder="Cuéntale a tus clientes sobre tu complejo deportivo..."
                                rows={3}
                                maxLength={500}
                            />
                            <InputError message={errors.description} />
                        </div>
                    </section>

                    <Separator />

                    <section className="space-y-4">
                        <div>
                            <p className="text-sm font-semibold text-foreground">
                                QR de pago
                            </p>
                            <p className="text-xs text-muted-foreground">
                                Este QR se mostrara en el bot de reservas para
                                pagos por Yape o Plin.
                            </p>
                        </div>

                        {profile?.payment_qr && (
                            <div className="group relative w-fit">
                                <img
                                    src={profile.payment_qr.url}
                                    alt="QR de pago"
                                    className="h-32 w-32 rounded-lg object-cover ring-1 ring-border"
                                />
                                <button
                                    type="button"
                                    onClick={() =>
                                        removeMedia(profile.payment_qr!.id)
                                    }
                                    className="absolute top-1.5 right-1.5 flex size-6 items-center justify-center rounded-full bg-red-600 text-white opacity-0 transition group-hover:opacity-100"
                                >
                                    <Trash2 className="size-3" />
                                </button>
                            </div>
                        )}

                        <SingleUploadZone
                            inputRef={paymentQrInputRef}
                            file={data.payment_qr}
                            onChange={(file) => setData('payment_qr', file)}
                            error={errors.payment_qr}
                        />
                    </section>

                    <Separator />

                    <section className="space-y-4">
                        <p className="text-sm font-semibold text-foreground">
                            Contacto
                        </p>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="grid gap-2">
                                <Label htmlFor="phone">
                                    Teléfono / WhatsApp
                                </Label>
                                <Input
                                    id="phone"
                                    value={data.phone}
                                    onChange={(e) =>
                                        setData('phone', e.target.value)
                                    }
                                    placeholder="Ej.: 987 654 321"
                                    maxLength={30}
                                />
                                <InputError message={errors.phone} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="email">
                                    Correo de contacto
                                </Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={data.email}
                                    onChange={(e) =>
                                        setData('email', e.target.value)
                                    }
                                    placeholder="Ej.: info@migrass.pe"
                                />
                                <InputError message={errors.email} />
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="address">Dirección</Label>
                            <Input
                                id="address"
                                value={data.address}
                                onChange={(e) =>
                                    setData('address', e.target.value)
                                }
                                placeholder="Ej.: Av. Los Deportes 123, Lima"
                                maxLength={200}
                            />
                            <InputError message={errors.address} />
                        </div>
                    </section>

                    <Separator />

                    <section className="space-y-4">
                        <p className="text-sm font-semibold text-foreground">
                            Opciones
                        </p>

                        <label className="flex cursor-pointer items-center gap-3">
                            <Checkbox
                                checked={data.show_calendar}
                                onCheckedChange={(checked) =>
                                    setData('show_calendar', checked === true)
                                }
                            />
                            <div>
                                <span className="text-sm font-medium">
                                    Mostrar calendario de disponibilidad
                                </span>
                                <p className="text-xs text-muted-foreground">
                                    Los visitantes verán un calendario público
                                    con los días ocupados.
                                </p>
                            </div>
                        </label>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="grid gap-2">
                                <Label htmlFor="booking_start_time">
                                    Inicio de reservas
                                </Label>
                                <Input
                                    id="booking_start_time"
                                    type="time"
                                    value={data.booking_start_time}
                                    onChange={(e) =>
                                        setData(
                                            'booking_start_time',
                                            e.target.value,
                                        )
                                    }
                                />
                                <InputError
                                    message={errors.booking_start_time}
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="booking_end_time">
                                    Fin de reservas
                                </Label>
                                <Input
                                    id="booking_end_time"
                                    type="time"
                                    value={data.booking_end_time}
                                    onChange={(e) =>
                                        setData(
                                            'booking_end_time',
                                            e.target.value,
                                        )
                                    }
                                />
                                <InputError message={errors.booking_end_time} />
                            </div>
                        </div>
                    </section>

                    <Separator />

                    <section className="space-y-4">
                        <div>
                            <p className="text-sm font-semibold text-foreground">
                                Imágenes principales
                            </p>
                            <p className="text-xs text-muted-foreground">
                                Fotos que rotan en el carrusel principal.
                                Máximo 8 imágenes de 5 MB cada una.
                            </p>
                        </div>

                        {(profile?.hero_images?.length ?? 0) > 0 && (
                            <div className="flex flex-wrap gap-3">
                                {profile!.hero_images.map((img) => (
                                    <div key={img.id} className="group relative">
                                        <img
                                            src={img.url}
                                            alt="Imagen principal"
                                            className="h-24 w-36 rounded-lg object-cover ring-1 ring-border"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => removeMedia(img.id)}
                                            className="absolute top-1.5 right-1.5 flex size-6 items-center justify-center rounded-full bg-red-600 text-white opacity-0 transition group-hover:opacity-100"
                                        >
                                            <Trash2 className="size-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        <UploadZone
                            inputRef={heroInputRef}
                            files={data.hero_images}
                            onChange={(files) => setData('hero_images', files)}
                            error={errors['hero_images.0']}
                        />
                    </section>

                    <Separator />

                    <section className="space-y-4">
                        <div>
                            <p className="text-sm font-semibold text-foreground">
                                Galería
                            </p>
                            <p className="text-xs text-muted-foreground">
                                Fotos de tus instalaciones para la sección de
                                galería. Máximo 20 imágenes de 5 MB cada una.
                            </p>
                        </div>

                        {(profile?.gallery_images?.length ?? 0) > 0 && (
                            <div className="flex flex-wrap gap-3">
                                {profile!.gallery_images.map((img) => (
                                    <div key={img.id} className="group relative">
                                        <img
                                            src={img.url}
                                            alt="Galería"
                                            className="h-24 w-36 rounded-lg object-cover ring-1 ring-border"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => removeMedia(img.id)}
                                            className="absolute top-1.5 right-1.5 flex size-6 items-center justify-center rounded-full bg-red-600 text-white opacity-0 transition group-hover:opacity-100"
                                        >
                                            <Trash2 className="size-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        <UploadZone
                            inputRef={galleryInputRef}
                            files={data.gallery_images}
                            onChange={(files) =>
                                setData('gallery_images', files)
                            }
                            error={errors['gallery_images.0']}
                            multiple
                        />
                    </section>

                    <Separator />

                    <div className="flex items-center gap-4">
                        <Button type="submit" disabled={processing}>
                            {processing ? 'Guardando...' : 'Guardar cambios'}
                        </Button>
                    </div>
                </form>
            </div>
        </>
    );
}

LandingSettings.layout = {
    breadcrumbs: [
        {
            title: 'Página web',
            href: edit(),
        },
    ],
};

function UploadZone({
    inputRef,
    files,
    onChange,
    error,
    multiple = true,
}: {
    inputRef: RefObject<HTMLInputElement | null>;
    files: File[];
    onChange: (files: File[]) => void;
    error?: string;
    multiple?: boolean;
}) {
    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const selected = Array.from(e.target.files ?? []);
        onChange([...files, ...selected]);
    };

    const removePreview = (index: number) => {
        onChange(files.filter((_, i) => i !== index));
    };

    return (
        <div className="space-y-3">
            {files.length > 0 && (
                <div className="flex flex-wrap gap-3">
                    {files.map((file, i) => (
                        <div key={i} className="group relative">
                            <img
                                src={URL.createObjectURL(file)}
                                alt={file.name}
                                className="h-24 w-36 rounded-lg object-cover ring-1 ring-border"
                            />
                            <button
                                type="button"
                                onClick={() => removePreview(i)}
                                className="absolute top-1.5 right-1.5 flex size-6 items-center justify-center rounded-full bg-red-600 text-white opacity-0 transition group-hover:opacity-100"
                            >
                                <Trash2 className="size-3" />
                            </button>
                            <span className="absolute bottom-1.5 left-1.5 rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-white">
                                Nueva
                            </span>
                        </div>
                    ))}
                </div>
            )}

            <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className={cn(
                    'flex w-full cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed border-border px-6 py-8 text-center transition',
                    'hover:border-primary hover:bg-muted/50',
                )}
            >
                <UploadCloud className="size-7 text-muted-foreground" />
                <div>
                    <p className="text-sm font-medium text-foreground">
                        Haz clic para subir{' '}
                        {multiple ? 'imágenes' : 'una imagen'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                        PNG, JPG, WEBP - Máx. 5 MB
                    </p>
                </div>
                <ImagePlus className="size-4 text-muted-foreground" />
            </button>

            <input
                ref={inputRef}
                type="file"
                accept="image/*"
                multiple={multiple}
                className="sr-only"
                onChange={handleChange}
            />

            {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
    );
}

function SingleUploadZone({
    inputRef,
    file,
    onChange,
    error,
}: {
    inputRef: RefObject<HTMLInputElement | null>;
    file: File | null;
    onChange: (file: File | null) => void;
    error?: string;
}) {
    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        onChange(e.target.files?.[0] ?? null);
    };

    return (
        <div className="space-y-3">
            {file && (
                <div className="group relative w-fit">
                    <img
                        src={URL.createObjectURL(file)}
                        alt={file.name}
                        className="h-32 w-32 rounded-lg object-cover ring-1 ring-border"
                    />
                    <button
                        type="button"
                        onClick={() => onChange(null)}
                        className="absolute top-1.5 right-1.5 flex size-6 items-center justify-center rounded-full bg-red-600 text-white opacity-0 transition group-hover:opacity-100"
                    >
                        <Trash2 className="size-3" />
                    </button>
                    <span className="absolute bottom-1.5 left-1.5 rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-white">
                        Nuevo
                    </span>
                </div>
            )}

            <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className={cn(
                    'flex w-full cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed border-border px-6 py-8 text-center transition',
                    'hover:border-primary hover:bg-muted/50',
                )}
            >
                <UploadCloud className="size-7 text-muted-foreground" />
                <div>
                    <p className="text-sm font-medium text-foreground">
                        Haz clic para subir el QR
                    </p>
                    <p className="text-xs text-muted-foreground">
                        PNG, JPG, WEBP - Max. 5 MB
                    </p>
                </div>
                <ImagePlus className="size-4 text-muted-foreground" />
            </button>

            <input
                ref={inputRef}
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={handleChange}
            />

            {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
    );
}
