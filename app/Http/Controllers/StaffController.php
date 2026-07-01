<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Role;

class StaffController extends Controller
{
    public function index(): Response
    {
        $tenantId = tenant('id');

        // Fetch users for this tenant and their roles
        $staff = User::where('tenant_id', $tenantId)
            ->with('roles')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($user) {
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->roles->first()->name ?? 'viewer',
                    'created_at' => $user->created_at->format('d/m/Y'),
                ];
            });

        return Inertia::render('tenant/staff/index', [
            'staff' => $staff,
        ]);
    }

    public function store(Request $request)
    {
        $tenantId = tenant('id');

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique('users')],
            'password' => ['required', 'string', 'min:8'],
            'role' => ['required', 'string', Rule::in(['admin', 'operator', 'viewer'])],
        ]);

        $user = User::create([
            'tenant_id' => $tenantId,
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
        ]);

        $user->assignRole($validated['role']);

        return back()->with('success', 'Personal creado correctamente.');
    }

    public function update(Request $request, User $staff)
    {
        if ($staff->tenant_id !== tenant('id')) {
            abort(403);
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique('users')->ignore($staff->id)],
            'password' => ['nullable', 'string', 'min:8'],
            'role' => ['required', 'string', Rule::in(['admin', 'operator', 'viewer'])],
        ]);

        $staff->name = $validated['name'];
        $staff->email = $validated['email'];
        
        if (!empty($validated['password'])) {
            $staff->password = Hash::make($validated['password']);
        }
        
        $staff->save();

        $staff->syncRoles([$validated['role']]);

        return back()->with('success', 'Personal actualizado correctamente.');
    }

    public function destroy(User $staff)
    {
        if ($staff->tenant_id !== tenant('id')) {
            abort(403);
        }

        // Prevent self-deletion if they are the only admin, etc.
        // But for now, just allow deletion.
        $staff->delete();

        return back()->with('success', 'Personal eliminado correctamente.');
    }
}
