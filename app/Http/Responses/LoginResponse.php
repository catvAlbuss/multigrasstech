<?php

namespace App\Http\Responses;

use Inertia\Inertia;
use Laravel\Fortify\Contracts\LoginResponse as LoginResponseContract;

class LoginResponse implements LoginResponseContract
{
    public function toResponse($request)
    {
        $user = $request->user();

        if ($user && $user->tenant_id) {
            $domain = $user->tenant->domains()->value('domain');

            if ($domain) {
                // Inertia::location forces a full browser navigation (not XHR),
                // which is required for cross-subdomain redirects to bypass CORS.
                return Inertia::location($this->tenantUrl($domain, '/dashboard'));
            }
        }

        // Absolute URL ensures the redirect always targets the central domain,
        // not whatever domain the login request came from (tenant subdomain via shared session).
        return redirect(rtrim(config('app.url'), '/').'/admin/dashboard');
    }

    private function tenantUrl(string $subdomain, string $path): string
    {
        $appUrl = config('app.url');
        $scheme = parse_url($appUrl, PHP_URL_SCHEME) ?? 'http';
        $host = parse_url($appUrl, PHP_URL_HOST);
        $port = parse_url($appUrl, PHP_URL_PORT);

        $url = $scheme.'://'.$subdomain.'.'.$host;
        if ($port) {
            $url .= ':'.$port;
        }

        return $url.$path;
    }
}
