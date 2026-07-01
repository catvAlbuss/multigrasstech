<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class EnsureTenantIsActive
{
    public const MESSAGE = 'Empresa desactivada, contacte con el proveedor.';

    public function handle(Request $request, Closure $next): Response
    {
        if (! tenancy()->initialized || tenant()->is_active) {
            return $next($request);
        }

        if (Auth::check()) {
            Auth::logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();
        }

        return redirect('/login')->withErrors([
            'email' => self::MESSAGE,
        ]);
    }
}
