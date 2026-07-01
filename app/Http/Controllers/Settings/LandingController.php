<?php

declare(strict_types=1);

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\TenantProfile;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class LandingController extends Controller
{
    public function edit(): Response
    {
        $profile = TenantProfile::with('media')->first();

        return Inertia::render('settings/landing', [
            'profile' => $profile ? [
                'tagline' => $profile->tagline,
                'description' => $profile->description,
                'phone' => $profile->phone,
                'address' => $profile->address,
                'email' => $profile->email,
                'show_calendar' => $profile->show_calendar,
                'booking_start_time' => substr((string) ($profile->booking_start_time ?? '06:00'), 0, 5),
                'booking_end_time' => substr((string) ($profile->booking_end_time ?? '23:00'), 0, 5),
                'hero_images' => $profile->getMedia('hero')
                    ->map(fn ($m) => ['id' => $m->id, 'url' => $m->getUrl('thumb') ?: $m->getUrl()])
                    ->values()->toArray(),
                'gallery_images' => $profile->getMedia('gallery')
                    ->map(fn ($m) => ['id' => $m->id, 'url' => $m->getUrl()])
                    ->values()->toArray(),
                'payment_qr' => ($qr = $profile->getFirstMedia('payment_qr'))
                    ? ['id' => $qr->id, 'url' => $qr->getUrl()]
                    : null,
            ] : null,
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $request->validate([
            'tagline' => 'nullable|string|max:120',
            'description' => 'nullable|string|max:500',
            'phone' => 'nullable|string|max:30',
            'address' => 'nullable|string|max:200',
            'email' => 'nullable|email|max:100',
            'show_calendar' => 'boolean',
            'booking_start_time' => 'required|date_format:H:i',
            'booking_end_time' => 'required|date_format:H:i|after:booking_start_time',
            'hero_images' => 'nullable|array|max:8',
            'hero_images.*' => 'mimes:jpg,jpeg,png,webp|max:5120',
            'gallery_images' => 'nullable|array|max:20',
            'gallery_images.*' => 'mimes:jpg,jpeg,png,webp|max:5120',
            'payment_qr' => 'nullable|mimes:jpg,jpeg,png,webp|max:5120',
        ]);

        $profile = TenantProfile::first() ?? new TenantProfile;
        $profile->fill([
            'tagline' => $request->input('tagline'),
            'description' => $request->input('description'),
            'phone' => $request->input('phone'),
            'address' => $request->input('address'),
            'email' => $request->input('email'),
            'show_calendar' => $request->boolean('show_calendar'),
            'booking_start_time' => $request->input('booking_start_time', '06:00'),
            'booking_end_time' => $request->input('booking_end_time', '23:00'),
        ]);
        $profile->save();

        if ($request->hasFile('hero_images')) {
            foreach ($request->file('hero_images') as $file) {
                $profile->addMedia($file)->toMediaCollection('hero');
            }
        }

        if ($request->hasFile('gallery_images')) {
            foreach ($request->file('gallery_images') as $file) {
                $profile->addMedia($file)->toMediaCollection('gallery');
            }
        }

        if ($request->hasFile('payment_qr')) {
            $profile->addMediaFromRequest('payment_qr')->toMediaCollection('payment_qr');
        }

        return back()->with('success', 'Configuración guardada.');
    }

    public function deleteMedia(int $media): RedirectResponse
    {
        $profile = TenantProfile::with('media')->firstOrFail();

        $item = $profile->media()->findOrFail($media);
        $item->delete();

        return back()->with('success', 'Imagen eliminada.');
    }
}
