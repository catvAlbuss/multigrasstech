<?php

declare(strict_types=1);

namespace App\Models;

use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Sale extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'tenant_id',
        'sale_number',
        'document_type',
        'customer_doc_type',
        'customer_doc_number',
        'customer_name',
        'customer_address',
        'customer_email',
        'igv_applied',
        'subtotal',
        'igv_amount',
        'total',
        'payment_amount',
        'change_amount',
        'notes',
        'status',
        'sold_at',
    ];

    protected $casts = [
        'igv_applied'    => 'boolean',
        'subtotal'       => 'decimal:2',
        'igv_amount'     => 'decimal:2',
        'total'          => 'decimal:2',
        'payment_amount' => 'decimal:2',
        'change_amount'  => 'decimal:2',
        'sold_at'        => 'datetime',
    ];

    public function items(): HasMany
    {
        return $this->hasMany(SaleItem::class);
    }
}
