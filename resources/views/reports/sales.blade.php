@include('reports.partials.styles')
@php
    $fmt = fn($n) => 'S/ ' . number_format((float)$n, 2, '.', ',');
    $docLabel = match($docType) { 'boleta' => 'Solo Boletas', 'factura' => 'Solo Facturas', default => 'Todos los documentos' };
    $maxDay = max(array_column($data['dailySales'] ?? [], 'total') ?: [1]);
    $maxProd = max(array_column($data['topProducts'] ?? [], 'total_revenue') ?: [1]);
    $statusMap = ['boleta' => ['label'=>'Boleta','bg'=>'#dbeafe','color'=>'#1e40af'], 'factura' => ['label'=>'Factura','bg'=>'#dcfce7','color'=>'#15803d']];
@endphp
<body>

<div class="pdf-header">
    <div class="header-row">
        <div>
            <div class="company">{{ $tenantName }}</div>
            <div class="report-title">Reporte de Ventas Detallado</div>
            <div class="meta">Periodo: {{ $period['start'] }} al {{ $period['end'] }} &nbsp;|&nbsp; {{ $docLabel }}</div>
        </div>
        <div class="badge">VENTAS</div>
    </div>
</div>

<div class="content">

{{-- KPIs --}}
<div class="kpi-grid" style="margin-top:18px;">
    <div class="kpi-card kpi-green">
        <div class="kpi-label">Total Ventas</div>
        <div class="kpi-value text-green">{{ $fmt($data['totalSales']) }}</div>
        <div class="kpi-sub">Monto total facturado</div>
    </div>
    <div class="kpi-card kpi-amber">
        <div class="kpi-label">Subtotal (sin IGV)</div>
        <div class="kpi-value text-amber">{{ $fmt($data['totalSubtotal']) }}</div>
    </div>
    <div class="kpi-card kpi-blue">
        <div class="kpi-label">IGV Recaudado</div>
        <div class="kpi-value text-blue">{{ $fmt($data['totalIgv']) }}</div>
        <div class="kpi-sub">18% sobre gravados</div>
    </div>
    <div class="kpi-card kpi-purple">
        <div class="kpi-label">Boletas Emitidas</div>
        <div class="kpi-value text-purple">{{ number_format($data['boletasCount']) }}</div>
    </div>
    <div class="kpi-card" style="border-left:3px solid #15803d;">
        <div class="kpi-label">Facturas Emitidas</div>
        <div class="kpi-value text-green">{{ number_format($data['facturasCount']) }}</div>
    </div>
</div>

{{-- Daily Bar Chart --}}
@if(count($data['dailySales']) > 0)
<div class="section-title">Ventas por Día</div>
<div class="no-break" style="display:flex; gap:2px; align-items:flex-end; height:55px; margin:6px 0 16px 0;">
    @foreach($data['dailySales'] as $day)
    @php $barH = $maxDay > 0 ? max(2, round($day['total']/$maxDay*50)) : 2; @endphp
    <div style="flex:1; text-align:center;">
        <div style="background:#16a34a; border-radius:2px 2px 0 0; height:{{ $barH }}px; margin:0 1px;"></div>
        <div style="font-size:7px; color:#6b7280; margin-top:2px;">{{ $day['date'] }}</div>
    </div>
    @endforeach
</div>
@endif

{{-- Top Products --}}
<div class="two-col">
<div class="col-60 no-break">
<div class="section-title">Productos Más Vendidos</div>
@if(count($data['topProducts']) === 0)
    <p style="font-size:10px; color:#9ca3af; font-style:italic;">Sin datos de productos.</p>
@else
<table>
    <thead><tr>
        <th>#</th><th>Producto</th>
        <th class="text-right">Unidades</th>
        <th class="text-right">Ingreso (S/)</th>
    </tr></thead>
    <tbody>
    @foreach($data['topProducts'] as $i => $p)
    <tr>
        <td class="rank">{{ $i+1 }}</td>
        <td>{{ $p->name }}</td>
        <td class="text-right">{{ number_format($p->total_qty) }}</td>
        <td class="text-right" style="color:#15803d; font-weight:bold;">{{ $fmt($p->total_revenue) }}</td>
    </tr>
    @endforeach
    </tbody>
</table>
@endif
</div>

<div class="col-40 no-break">
<div class="section-title">Participación por Producto</div>
@foreach(array_slice((array)$data['topProducts'], 0, 6) as $p)
@php
    $p = (object)$p;
    $barPct = $maxProd > 0 ? round($p->total_revenue/$maxProd*100) : 0;
@endphp
<div class="bar-row">
    <div class="bar-label">{{ \Illuminate\Support\Str::limit($p->name, 12) }}</div>
    <div class="bar-track"><div class="bar-fill" style="width:{{ $barPct }}%; background:#16a34a;"></div></div>
    <div class="bar-value">{{ $fmt($p->total_revenue) }}</div>
</div>
@endforeach
</div>
</div>

{{-- Sales Detail Table --}}
<div class="section-title" style="margin-top:14px; page-break-before:always;">Detalle de Ventas</div>
<table>
    <thead><tr>
        <th>N° Documento</th>
        <th>Fecha</th>
        <th>Cliente</th>
        <th>Doc. Cliente</th>
        <th class="text-right">Subtotal</th>
        <th class="text-right">IGV</th>
        <th class="text-right">Total</th>
        <th>Tipo</th>
    </tr></thead>
    <tbody>
    @forelse($data['sales'] as $sale)
    <tr>
        <td style="font-weight:bold; font-family:monospace; font-size:9px;">{{ $sale->sale_number }}</td>
        <td>{{ \Carbon\Carbon::parse($sale->sold_at)->format('d/m/Y') }}</td>
        <td>{{ \Illuminate\Support\Str::limit($sale->customer_name, 22) }}</td>
        <td style="font-size:9px; color:#6b7280;">
            {{ strtoupper($sale->customer_doc_type) }} {{ $sale->customer_doc_number }}
        </td>
        <td class="text-right">{{ $fmt($sale->subtotal) }}</td>
        <td class="text-right" style="color:#2563eb;">{{ $fmt($sale->igv_amount) }}</td>
        <td class="text-right" style="color:#15803d; font-weight:bold;">{{ $fmt($sale->total) }}</td>
        <td>
            @php $st = $statusMap[$sale->document_type] ?? ['label'=>$sale->document_type,'bg'=>'#f3f4f6','color'=>'#374151']; @endphp
            <span class="cat-badge" style="background:{{ $st['bg'] }}; color:{{ $st['color'] }};">{{ $st['label'] }}</span>
        </td>
    </tr>
    @empty
    <tr><td colspan="8" style="text-align:center; color:#9ca3af; font-style:italic;">Sin ventas en este periodo.</td></tr>
    @endforelse
    </tbody>
</table>

{{-- Totals row --}}
@if(count($data['sales']) > 0)
<table style="margin-top:4px;">
    <tbody>
    <tr style="background:#f0fdf4;">
        <td colspan="4" style="font-weight:bold; text-align:right; color:#15803d; border-top:2px solid #16a34a;">TOTAL</td>
        <td class="text-right" style="font-weight:bold; border-top:2px solid #16a34a;">{{ $fmt($data['totalSubtotal']) }}</td>
        <td class="text-right" style="font-weight:bold; color:#2563eb; border-top:2px solid #16a34a;">{{ $fmt($data['totalIgv']) }}</td>
        <td class="text-right" style="font-weight:bold; color:#15803d; font-size:12px; border-top:2px solid #16a34a;">{{ $fmt($data['totalSales']) }}</td>
        <td style="border-top:2px solid #16a34a;"></td>
    </tr>
    </tbody>
</table>
@endif

</div>

@include('reports.partials.footer')
</body>
</html>
