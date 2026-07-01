import { Head, usePage } from '@inertiajs/react';
import { ContactFooter } from '@/components/welcome/contact-footer';
import { FieldsSection } from '@/components/welcome/fields-section';
import { GallerySection } from '@/components/welcome/gallery-section';
import { HeroSection } from '@/components/welcome/hero-section';
import { ReservationAssistant } from '@/components/welcome/reservation-assistant';
import { ReservationCalendarSection } from '@/components/welcome/reservation-calendar-section';
import { TenantNavbar } from '@/components/welcome/tenant-navbar';
import { useRotatingIndex } from '@/hooks/use-rotating-index';
import { useWelcomeCalendar } from '@/hooks/use-welcome-calendar';
import { DEFAULT_HERO } from '@/lib/welcome';
import { login } from '@/routes';
import { create as createReservation } from '@/routes/reservations';
import { dashboard } from '@/routes/tenant';
import type { WelcomePageProps } from '@/types/welcome';

export default function TenantWelcome() {
    const { auth, tenant, profile, fields, calendar } = usePage<WelcomePageProps>().props;
    const heroImages = profile?.hero_images?.length ? profile.hero_images : [DEFAULT_HERO];
    const galleryImages = profile?.gallery_images ?? [];
    const isAuthenticated = Boolean(auth?.user);
    const tenantName = tenant?.name ?? 'Nuestro Complejo';
    const dashboardHref = dashboard.url();
    const loginHref = login.url();
    const primaryHref = isAuthenticated ? createReservation.url() : loginHref;
    const heroSlider = useRotatingIndex(heroImages.length);
    const welcomeCalendar = useWelcomeCalendar(calendar);
    const showCalendar = profile?.show_calendar ?? true;

    return (
        <>
            <Head title={tenantName} />

            <TenantNavbar
                tenantName={tenantName}
                dashboardHref={dashboardHref}
                isAuthenticated={isAuthenticated}
                loginHref={loginHref}
            />

            <HeroSection
                description={
                    profile?.description ??
                    'Reserva tu cancha en segundos. Disponibilidad en tiempo real.'
                }
                heroImages={heroImages}
                isAuthenticated={isAuthenticated}
                primaryHref={primaryHref}
                sliderIndex={heroSlider.index}
                tagline={
                    profile?.tagline ?? `${tenantName} - tu espacio deportivo`
                }
                onNext={heroSlider.next}
                onPrevious={heroSlider.previous}
            />

            {showCalendar && (
                <ReservationCalendarSection
                    dayDetail={welcomeCalendar.dayDetail}
                    detailLoading={welcomeCalendar.detailLoading}
                    grid={welcomeCalendar.grid}
                    loading={welcomeCalendar.loading}
                    month={welcomeCalendar.month}
                    selectedDate={welcomeCalendar.selectedDate}
                    onNext={() => void welcomeCalendar.navigate(1)}
                    onPrevious={() => void welcomeCalendar.navigate(-1)}
                    onSelectDay={(date, status) =>
                        void welcomeCalendar.selectDay(date, status)
                    }
                    onToday={() => void welcomeCalendar.goToday()}
                />
            )}

            <FieldsSection fields={fields} primaryHref={primaryHref} />

            <GallerySection images={galleryImages} tenantName={tenantName} />

            <ContactFooter profile={profile} tenantName={tenantName} />

            <ReservationAssistant
                fields={fields}
                paymentPhone={profile?.phone ?? null}
                paymentQrUrl={profile?.payment_qr_url ?? null}
                tenantAddress={profile?.address ?? null}
                tenantName={tenantName}
            />
        </>
    );
}
