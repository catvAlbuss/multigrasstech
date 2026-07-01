<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\Response;

class RedirectSuperAdminToCentral
{
    public function handle(Request $request, Closure $next): Response
    {
        // Super-admins (tenant_id null) must never operate inside a tenant subdomain.
        // The session is shared across subdomains, so they can arrive here accidentally.
        // Redirect them back to the central domain admin panel.
        if (tenancy()->initialized && $request->user() && $request->user()->tenant_id === null) {
            $centralAdminUrl = rtrim(config('app.url'), '/').'/admin/tenants';

            // Inertia::location forces a full browser navigation for XHR (prefetch/SPA)
            // requests, bypassing any cross-subdomain CORS restriction.
            if ($request->header('X-Inertia')) {
                return Inertia::location($centralAdminUrl);
            }

            return redirect($centralAdminUrl);
        }

        return $next($request);
    }
}
