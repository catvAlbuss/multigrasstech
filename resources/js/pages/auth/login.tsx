import { Form, Head, usePage } from '@inertiajs/react';
import { useEffect } from 'react';
import Swal from 'sweetalert2';
import InputError from '@/components/input-error';
import PasskeyVerify from '@/components/passkey-verify';
import PasswordInput from '@/components/password-input';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { store } from '@/routes/login';
import { request } from '@/routes/password';

type Props = {
    status?: string;
    canResetPassword: boolean;
};

export default function Login({ status, canResetPassword }: Props) {
    const pageErrors = (usePage().props.errors ?? {}) as Record<string, string>;
    const inactiveTenantMessage = pageErrors.email?.includes(
        'Empresa desactivada',
    )
        ? pageErrors.email
        : null;

    useEffect(() => {
        if (inactiveTenantMessage) {
            void Swal.fire({
                icon: 'error',
                title: 'Empresa desactivada',
                text: inactiveTenantMessage,
                confirmButtonColor: '#16a34a',
            });
        }
    }, [inactiveTenantMessage]);

    return (
        <>
            <Head title="Iniciar sesion" />

            <PasskeyVerify />

            <Form
                {...store.form()}
                resetOnSuccess={['password']}
                className="flex flex-col gap-6">
                {({ processing, errors }) => (
                    <>
                        <div className="grid gap-6">
                            <div className="auth-field grid gap-2">
                                <Label htmlFor="email" className="text-white">
                                    Correo electronico
                                </Label>
                                <Input id="email" type="email" name="email" required autoFocus tabIndex={1} autoComplete="email" placeholder="usuario@grassverde.com" className="h-11 border-white/15 bg-white/[0.06] text-white shadow-inner shadow-black/20 transition duration-200 placeholder:text-zinc-500 focus-visible:border-emerald-300/80 focus-visible:ring-emerald-300/25"/>
                                <InputError message={errors.email} />
                            </div>

                            <div className="auth-field grid gap-2">
                                <div className="flex items-center">
                                    <Label htmlFor="password" className="text-white">
                                        Contrasena
                                    </Label>
                                    {canResetPassword && (
                                        <TextLink href={request()} className="ml-auto text-sm text-emerald-200 underline-offset-4 hover:text-emerald-100" tabIndex={5}>
                                            Olvidaste tu contrasena?
                                        </TextLink>
                                    )}
                                </div>
                                <PasswordInput id="password" name="password" required tabIndex={2} autoComplete="current-password" placeholder="Ingresa tu contrasena" className="h-11 border-white/15 bg-white/[0.06] text-white shadow-inner shadow-black/20 transition duration-200 placeholder:text-zinc-500 focus-visible:border-emerald-300/80 focus-visible:ring-emerald-300/25"/>
                                <InputError message={errors.password} />
                            </div>

                            <div className="auth-field flex items-center space-x-3">
                                <Checkbox id="remember" name="remember" tabIndex={3} className="border-white/20 data-[state=checked]:border-emerald-400 data-[state=checked]:bg-emerald-500"/>
                                <Label htmlFor="remember" className="text-sm text-zinc-200">
                                    Recordarme
                                </Label>
                            </div>

                            <Button type="submit" className="auth-submit mt-2 h-11 w-full bg-emerald-400 text-emerald-950 shadow-lg shadow-emerald-950/40 transition duration-200 hover:bg-emerald-300 hover:shadow-emerald-900/50" tabIndex={4} disabled={processing} data-test="login-button">
                                {processing && <Spinner />}
                                Iniciar sesion
                            </Button>
                        </div>
                    </>
                )}
            </Form>

            {status && (
                <div className="mb-4 text-center text-sm font-medium text-emerald-300">
                    {status}
                </div>
            )}
        </>
    );
}

Login.layout = {
    title: 'Ingresa a tu panel',
    description: 'Administra reservas, ventas y operacion diaria de tu grass.',
};
