<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SetPermissionsTeamId
{
    public function handle(Request $request, Closure $next): Response
    {
        // 0 = contexto global (super-admin sin tenant)
        setPermissionsTeamId(tenancy()->initialized ? tenant('id') : 0);

        return $next($request);
    }
}
