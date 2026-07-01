<?php

namespace Database\Seeders;

use App\Models\Plan;
use App\Models\Tenant;
use Illuminate\Database\Seeder;

class PlanSeeder extends Seeder
{
    public function run(): void
    {
        $plans = [
            [
                'name' => 'Básico',
                'slug' => 'basic',
                'description' => 'Funciones esenciales para comenzar a gestionar la empresa.',
                'price' => 29.90,
                'billing_period' => 'monthly',
                'sort_order' => 10,
            ],
            [
                'name' => 'Premium',
                'slug' => 'premium',
                'description' => 'Acceso ampliado para empresas en crecimiento.',
                'price' => 79.90,
                'billing_period' => 'monthly',
                'sort_order' => 20,
            ],
            [
                'name' => 'Contáctenos',
                'slug' => 'contact',
                'description' => 'Solución personalizada según las necesidades de la empresa.',
                'price' => null,
                'billing_period' => 'contact',
                'sort_order' => 30,
            ],
        ];

        foreach ($plans as $attributes) {
            Plan::updateOrCreate(
                ['slug' => $attributes['slug']],
                [...$attributes, 'is_active' => true],
            );
        }

        $legacyPlans = [
            'basic' => 'basic',
            'pro' => 'premium',
            'enterprise' => 'contact',
            'premium' => 'premium',
            'contact' => 'contact',
        ];

        foreach ($legacyPlans as $legacySlug => $planSlug) {
            Tenant::whereNull('plan_id')
                ->where('plan', $legacySlug)
                ->update(['plan_id' => Plan::where('slug', $planSlug)->value('id')]);
        }
    }
}
