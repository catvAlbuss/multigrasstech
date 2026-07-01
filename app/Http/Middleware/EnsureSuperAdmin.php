<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureSuperAdmin
{
    public function handle(Request $request, Closure $next): Response
    {
        // Admin panel is only accessible from the central domain (not tenant subdomains).
        $centralDomains = config('tenancy.central_domains', []);
        if (! in_array($request->getHost(), $centralDomains)) {
            abort(403);
        }

        // Super-admins have tenant_id = null. Spatie hasRole(team_id=0) is unreliable
        // because PHP treats 0 as falsy in ->when(), so we use the model contract directly.
        if ($request->user()?->tenant_id !== null) {
            abort(403);
        }

        setPermissionsTeamId(0);

        return $next($request);
    }
}
